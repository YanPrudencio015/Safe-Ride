import { NextResponse, NextRequest } from "next/server";
import { isScrapable, fetchPagesContent } from "../Serper/route";
import { RouteAnalyticsPayload } from "@/app/types/route";
import { GeminiResponse } from "../gemini/route";
import { getNeighborhoodsFromRoute } from "../../server/RouteNeighbor";

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

interface Cache {
  neighborhood: string[];
  simpleCoordinates: number[][];
  GeminiResponse: {};
}
// get the cordinates from MAP.tsx file
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const coordinates = JSON.parse(raw);

  // -> simplify the coordinates from the same neigboohoods and
  // return it's names too
  const { neighborhoods, simplified } = await getNeighborhoodsFromRoute(
    coordinates.coordinates,
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
  // console.log("Cache Miss — rodando pipeline: ", cacheKey); // ← adiciona isso
  // search for news abou each neighbohoods
  const key = process.env.SERPER_API;
  if (!key)
    return NextResponse.json({ error: "SERPER_API missing" }, { status: 500 });
  if (!Array.isArray(neighborhoods))
    return NextResponse.json(
      { error: "Needs to be an array" },
      { status: 400 },
    );

  try {
    console.time("2_serper");
    // 1. Busca notícias de todos os bairros em paralelo
    const allNeighborhoodResults = await Promise.all(
      neighborhoods.map(async (neighborhood) => {
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

        // Anota qual bairro pertence cada link
        return filtered.map((e: any) => ({ ...e, neighborhood }));
      }),
    );
    console.timeEnd("2_serper");
    // 2. Junta todos os links de todos os bairros
    const allLinks = allNeighborhoodResults.flat();
    console.time("3_jina");
    // 3. Busca todo o conteúdo com Jina em paralelo de uma vez
    const news = await Promise.all(
      allLinks.map(async (e: any) => {
        const fullContent = await fetchPagesContent(e.link);
        return {
          neighborhood: e.neighborhood,
          title: e.title,
          link: e.link,
          date: e.date ?? null,
          fullContent: fullContent ?? e.snippet,
        };
      }),
    );
    console.timeEnd("3_jina");

    console.time("4_gemini");
    // 4. Manda para o Gemini
    const payload: RouteAnalyticsPayload = {
      neighborhoodNames: neighborhoods,
      neighborhoodCoordinates: simplified,
      neighborhoodNews: news,
      prompt: "Analiza se são bairros seguros",
    };

    const GeminiResponded = await GeminiResponse(payload);
    console.timeEnd("4_gemini");

    const newGeminiResponse: Cache = {
      simpleCoordinates: simplified,
      neighborhood: neighborhoods,
      GeminiResponse: GeminiResponded,
    };

    await redis.setex(cacheKey, 86400, JSON.stringify(newGeminiResponse));

    return NextResponse.json({ GeminiResponded, error: null });
  } catch (error) {
    return NextResponse.json(
      { error: "Error when process it" },
      { status: 500 },
    );
  }
}
