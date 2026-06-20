import { NextResponse, NextRequest } from "next/server";
import { getNeighborhoodsFromRoute } from "@/app/server/RouteNeighbor";
import { isScrapable, fetchPagesContent } from "../Serper/route";
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

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const coordinate = JSON.parse(raw);

  const { neighborhoods, simplified } = await getNeighborhoodsFromRoute(
    coordinate.coordinates,
    process.env.NEXT_PUBLIC_MAP_TOKEN!,
  );

  const cacheKey = `route:${[...neighborhoods].sort().join("-")}`;
  const cached = (await redis.get(cacheKey)) as Cache | null;

  if (cached) {
    return NextResponse.json({
      GeminiResponded: cached.GeminiResponse,
      error: null,
    });
  }

  const key = process.env.SERPER_API;
  if (!key) {
    return NextResponse.json({ error: "SERPER_API missing" }, { status: 500 });
  }
  if (!Array.isArray(neighborhoods)) {
    return NextResponse.json(
      { error: "Needs to be an array" },
      { status: 400 },
    );
  }

  try {
    // 1. Busca notícias de cada bairro em paralelo
    const allNeighborhoodResults = await Promise.all(
      neighborhoods.map(async (neighborhood: string) => {
        const res = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: { "X-API-KEY": key, "Content-Type": "application/json" },
          body: JSON.stringify({
            q: `(assalto OR rendido OR sequestro OR "ordem de parada") AND (motorista OR entregador) AND "${neighborhood}"`,
            gl: "br",
            hl: "pt",
            tbm: "nws",
          }),
        });

        const data = await res.json();
        const filtered = data.organic
          ? data.organic.filter((e: any) => isScrapable(e.link)).slice(0, 2)
          : [];

        return filtered.map((e: any) => ({ ...e, neighborhood }));
      }),
    );

    const allLinks = allNeighborhoodResults.flat();

    // 2. Scraping com timeout — 1 site lento não trava o restante
    const news = await Promise.all(
      allLinks.map(async (e: any) => {
        const fullContent = await fetchPagesContentWithTimeout(e.link, 3000);
        return {
          neighborhood: e.neighborhood,
          title: e.title,
          link: e.link,
          date: e.date ?? null,
          fullContent: fullContent ?? e.snippet,
        };
      }),
    );

    // 3. Chama o Gemini com os dados prontos
    const payload: RouteAnalyticsPayload = {
      neighborhoodNames: neighborhoods,
      neighborhoodCoordinates: simplified,
      neighborhoodNews: news,
      prompt: "Analiza se são bairros seguros",
    };

    const GeminiResponded = await GeminiResponse(payload);

    const newGeminiResponse: Cache = {
      simpleCoordinates: simplified,
      neighborhood: neighborhoods,
      GeminiResponse: GeminiResponded,
    };

    await redis.setex(cacheKey, 86400, JSON.stringify(newGeminiResponse));

    return NextResponse.json({ GeminiResponded, error: null });
  } catch (error: any) {
    console.error("ERRO route-analysis:", error.message);
    return NextResponse.json(
      { error: "Error when process it" },
      { status: 500 },
    );
  }
}

// Helper: dá um tempo máximo pro scraping de cada link
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
