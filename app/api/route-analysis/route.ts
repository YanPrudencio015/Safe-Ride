import { NextResponse, NextRequest } from "next/server";
import { getNeighborhoodsFromRoute } from "@/app/server/RouteNeighbor";
import { fetchPagesContent } from "../Serper/route";
import { GeminiResponse } from "@/app/lib/GeminiResponse";
import type { RouteAnalyticsPayload } from "@/app/types/route";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface Cache {
  neighborhood: string[];
  simpleCoordinates: number[][];
  GeminiResponse: {};
}

// avoid news coming from these social network
function isScrapable(url: string): boolean {
  const BLOCKED_DOMAINS = [
    "instagram.com",
    "tiktok.com",
    "twitter.com",
    "x.com",
    "facebook.com",
    "youtube.com",
    "threads.net",
  ];
  try {
    const { hostname } = new URL(url);
    return !BLOCKED_DOMAINS.some((domain) => hostname.includes(domain));
  } catch {
    return false;
  }
}

async function fetchPagesContentWithTimeout(link: string, ms: number) {
  try {
    return await Promise.race([
      fetchPagesContent(link),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
    ]);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const coordinate = JSON.parse(raw);

  // identify the neighborhoods by coordinates
  const { neighborhoods, simplified } = await getNeighborhoodsFromRoute(
    coordinate.coordinates,
    process.env.NEXT_PUBLIC_MAP_TOKEN!,
  );

  // Check if the full route result is already cached
  // If yes, skip the entire pipeline and return immediately
  const cacheKey = `route:${[...neighborhoods].sort().join("-")}`;
  const cachedRoute = (await redis.get(cacheKey)) as Cache | null;

  if (cachedRoute) {
    return NextResponse.json({
      GeminiResponded: cachedRoute.GeminiResponse,
      error: null,
    });
  } else if (!cachedRoute) {
  }

  const braveKey = process.env.BRAVE_API_KEY;
  if (!braveKey) {
    return NextResponse.json(
      { error: "BRAVE_API_KEY missing" },
      { status: 500 },
    );
  }

  if (!Array.isArray(neighborhoods)) {
    return NextResponse.json(
      { error: "Needs to be an array" },
      { status: 400 },
    );
  }

  try {
    //Get all neighborhoods already cached in Redis (single call)
    // This avoids calling Redis once per neighborhood inside the loop

    const cachedKeys = await redis.keys("bairro:*");
    const cachedNeighborhoodNames = cachedKeys.map((k) =>
      k.replace("bairro:", ""),
    );
    // Separate neighborhoods into cached and missing
    const missing = neighborhoods.filter(
      (n) => !cachedNeighborhoodNames.includes(n),
    );
    const alreadyCached = neighborhoods.filter((n) =>
      cachedNeighborhoodNames.includes(n),
    );

    //Fetch results from cache for already cached neighborhoods
    const cachedResults = await Promise.all(
      alreadyCached.map(async (neighborhood) => {
        const bairroKey = `bairro:${neighborhood}`;
        const cached = (await redis.get(bairroKey)) as any[];
        return cached ?? [];
      }),
    );

    //Search Brave only for missing neighborhoods
    const braveResults = await Promise.all(
      missing.map(async (neighborhood: string) => {
        const url = new URL("https://api.search.brave.com/res/v1/news/search");
        url.searchParams.append(
          "q",
          `crime assalto motorista entregador "${neighborhood}" Brasil`,
        );

        const res = await fetch(url.toString(), {
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": braveKey,
          },
        });

        const data = await res.json();

        const results = data.results ?? [];
        const filtered = results
          .filter((e: any) => isScrapable(e.url))
          .slice(0, 2)
          .map((e: any) => ({ ...e, neighborhood }));

        // Save this neighborhood result in cache for future routes
        const bairroKey = `bairro:${neighborhood}`;
        await redis.setex(bairroKey, 86400, JSON.stringify(filtered));

        return filtered;
      }),
    );

    //Merge cached results + new Brave results
    const allLinks = [...cachedResults.flat(), ...braveResults.flat()];
    //Scrape content with Jina in parallel
    const news = await Promise.all(
      allLinks.map(async (e: any) => {
        const fullContent = await fetchPagesContentWithTimeout(e.url, 1500);
        return {
          neighborhood: e.neighborhood,
          title: e.title,
          link: e.url,
          date: e.age ?? null,
          fullContent: fullContent ?? e.description,
        };
      }),
    );

    //Send to Gemini for risk analysis
    const payload: RouteAnalyticsPayload = {
      neighborhoodNames: neighborhoods,
      neighborhoodCoordinates: simplified,
      neighborhoodNews: news,
      prompt: "Analiza se são bairros perigosos",
    };

    const GeminiResponded = await GeminiResponse(payload);

    //Save the full route result in cache
    // Next time this exact route is searched, the entire pipeline is skipped
    const newGeminiResponse: Cache = {
      simpleCoordinates: simplified,
      neighborhood: neighborhoods,
      GeminiResponse: GeminiResponded,
    };

    await redis.setex(cacheKey, 86400, JSON.stringify(newGeminiResponse));

    return NextResponse.json({ GeminiResponded, error: null });
  } catch (error: any) {
    console.error("ERROR route-analysis:", error.message);
    return NextResponse.json(
      { error: "Error when process it" },
      { status: 500 },
    );
  }
}
