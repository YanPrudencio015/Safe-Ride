import { clear, error } from "console";
import { NextResponse } from "next/server";

const BLOCKED_DOMAINS = [
  "instagram.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "facebook.com",
  "youtube.com",
  "threads.net",
];

// ------ remove Social media URLs ----------------------------
function isScrapable(url: string): boolean {
  const { hostname } = new URL(url);
  try {
    return !BLOCKED_DOMAINS.some((domains) => hostname.includes(domains));
  } catch (error) {
    return false;
  }
}

//  ----- Use JINA IA to reads the news content and return it ------------------------
async function fetchPagesContent(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: "text/plain" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const text = await response.text();
    return text.slice(0, 3000);
  } catch (error) {
    return null;
  }
}

export async function POST(request: Request) {
  const key = process.env.SERPER_API;

  try {
    // 1. separing "neighborhoods" as a array
    const { neighborhoods }: { neighborhoods: string[] } = await request.json();
    if (!neighborhoods || !Array.isArray(neighborhoods)) {
      return NextResponse.json(
        { error: "needs to be an array" },
        { status: 400 },
      );
    }

    // 2. mapping each neigborhood for a search promise
    const allResults = await Promise.all(
      neighborhoods.map(async (neighborhood) => {
        const options = {
          method: "POST",
          headers: {
            "X-API-KEY": key!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: `(assalto OR rendido OR sequestro OR "ordem de parada") AND (motorista OR entregador) AND "${neighborhood}" AND "Rio de Janeiro"`,
            gl: "br",
            hl: "pt",
            tbm: "nws",
          }),
        };

        const res = await fetch("https://google.serper.dev/search", options);
        const data = await res.json();

        const filtered = data.organic
          ? data.organic.filter((e: any) => isScrapable(e.link))
          : [];

        // putting more information for this especific neigbor
        const enriched = await Promise.all(
          filtered.map(async (e: any) => {
            const fullContent = await fetchPagesContent(e.link);
            return {
              neighborhood, // check which neigbor is that news
              title: e.title,
              link: e.link,
              date: e.date ?? null,
              fullContent: fullContent ?? e.snippet,
            };
          }),
        );

        return enriched;
      }),
    );

    // 3. Flatten (achatar) o array para retornar uma lista única de notícias
    return NextResponse.json({ results: allResults.flat() });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
  }
}
