import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

import type { RouteAnalyticsPayload } from "@/app/types/route";

// 1. Função auxiliar para o Retry
async function generateWithRetry(
  model: any,
  prompt: string,
  retries = 3,
  delay = 1000,
) {
  try {
    return await model.generateContent(prompt);
  } catch (error: any) {
    if ((error.status === 503 || error.status === 500) && retries > 0) {
      console.warn(
        `Tentativa falhou. Tentando novamente em ${delay}ms... Restam: ${retries}`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return generateWithRetry(model, prompt, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function POST(req: NextRequest) {
  type NewsBody = {
    date: string;
    fullContent: string;
    link: string;
    neighborhood: string;
    title: string;
  };
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });

    const {
      neighborhoodNames,
      neighborhoodCoordinates,
      neighborhoodNews,
      prompt,
    }: RouteAnalyticsPayload = await req.json();

    const systemInstruction = `
Você é um assistente de segurança para motoristas, entregadores e passageiros.

TAREFA:
Compare os bairros em ${neighborhoodNames} com as notícias em ${neighborhoodNews}.
Identifique bairros com histórico de barricadas, restrições a motoristas/entregadores ou alto índice de roubos.

RESPOSTA:
- Se houver risco: alerte sobre o bairro específico em tom formal e corporativo.
- Se não houver risco: responda "Rota aparentemente segura, boa viagem."
- Cada coordenada em ${neighborhoodCoordinates} corresponde ao bairro de mesmo índice em ${neighborhoodNames}.

REGRAS:
- Não mencione bairros sem risco confirmado.
- Não invente locais.
- Sem listas. Um parágrafo único, máximo 30 palavras.

FORMATO JSON ESTRITO:
{
  "mensagem": "parágrafo único, formal, máx 30 palavras",
  "neigh": ["nomes dos bairros de risco"],
  "coordenadas_risco": [{ "lat": número, "lng": número }]
}

Mantenha as coordenadas exatamente como fornecidas em ${neighborhoodCoordinates}.
`;
    const genIA = new GoogleGenerativeAI(apiKey);
    const model = genIA.getGenerativeModel({
      // model: "gemini-2.5-flash-lite",
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
      systemInstruction: systemInstruction,
    });

    // 2. Uso da função de retry
    const result = await generateWithRetry(
      model,
      prompt || "Analise as coordenadas.",
    );
    const response = await result.response;
    const parsedResponse = JSON.parse(response.text());
    const alertaTexto = parsedResponse.mensagem;
    const bairrosPerigosos = parsedResponse.neigh;

    const coordsFiltradas = neighborhoodNames
      .map((nome, index) => ({ nome, coord: neighborhoodCoordinates[index] }))
      .filter((item) => bairrosPerigosos.includes(item.nome));
    return NextResponse.json({
      result: [alertaTexto, coordsFiltradas],
    });
  } catch (error: any) {
    console.error("ERRO FINAL:", error.message);
    return NextResponse.json(
      {
        error: "Falha ao processar após várias tentativas",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
