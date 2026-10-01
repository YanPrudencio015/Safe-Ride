import { GoogleGenAI } from "@google/genai";

// some type to avoid repeat more than one struture
import type { RouteAnalyticsPayload } from "@/app/types/route";

// Tipo inferido diretamente do payload real, evitando divergência
// com o tipo NewsItem já definido em @/app/types/route
type NewsBody = RouteAnalyticsPayload["neighborhoodNews"][number];

// 1. Função auxiliar para o Retry
// Agora recebe a instância do genIA + os parâmetros da chamada,
// já que na nova SDK não existe mais "model.generateContent(prompt)" isolado.
async function generateWithRetry(
  genIA: GoogleGenAI,
  params: Parameters<GoogleGenAI["models"]["generateContent"]>[0],
  retries = 3,
  delay = 1000,
) {
  try {
    const result = await genIA.models.generateContent(params);
    return result;
  } catch (error: any) {
    if ((error.status === 503 || error.status === 500) && retries > 0) {
      console.warn(
        `Tentativa falhou. Tentando novamente em ${delay}ms... Restam: ${retries}`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return generateWithRetry(genIA, params, retries - 1, delay * 2);
    }
    throw error;
  }
}

// structure to the Gemini creation
export async function GeminiResponse(payload: RouteAnalyticsPayload) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { result: null, error: "API Key missing" };

    const { neighborhoodNames, neighborhoodCoordinates, neighborhoodNews } =
      payload;

    const cleanNews = neighborhoodNews
      .filter((n: NewsBody) => {
        const title = n.title?.toLocaleLowerCase() || "";
        const content = n.fullContent?.toLocaleLowerCase() || "";
        const keyWords = [
          "assalto",
          "roubo",
          "sequestro",
          "criminoso",
          "tráfico",
          "operação",
          "confronto",
          "rendido",
          "motorista",
          "entregador",
        ];
        return keyWords.some((p) => title.includes(p) || content.includes(p));
      })
      .map((n: NewsBody) => ({
        neighborhood: n.neighborhood,
        title: n.title,
        content: n.fullContent?.slice(0, 400),
      }));

    const userPrompt = `
BAIRROS DA ROTA: ${JSON.stringify(neighborhoodNames)}
 
COORDENADAS (mesma ordem dos bairros): ${JSON.stringify(neighborhoodCoordinates)}
 
NOTÍCIAS FILTRADAS:
${cleanNews
  .map(
    (n) =>
      `- Bairro: ${n.neighborhood}\n  Título: ${n.title}\n  Conteúdo: ${n.content}`,
  )
  .join("\n\n")}
 
Analise e retorne o JSON conforme instruído.
`;

    const systemInstruction = `
Você é um assistente de segurança para motoristas, entregadores e passageiros no Brasil.
 
Você receberá notícias filtradas sobre bairros de uma rota.
Sua tarefa é identificar quais bairros representam risco real para quem trafega por eles.
 
CRITÉRIO DE RISCO — considere risco confirmado se a notícia mencionar:
- Assalto, roubo, sequestro ou tentativa contra motoristas ou entregadores
- Confronto armado, operação policial ou tiroteio na via
- Restrição de acesso por facções ou tráfico
 
REGRAS:
- Só cite bairros com risco nas notícias fornecidas. Nunca invente.
- Notícias antigas (mais de 2 anos) contam como histórico de risco — mencione como tal.
- Tom formal e corporativo. Um parágrafo único, máximo 40 palavras.
- Se nenhum bairro tiver risco confirmado: retorne "Rota aparentemente segura, boa viagem."
 
RETORNE APENAS JSON VÁLIDO, SEM TEXTO FORA DO JSON:
{
  "mensagem": "parágrafo único formal, máx 40 palavras",
  "neigh": ["nomes exatos dos bairros de risco, conforme recebidos"],
  "coordenadas_risco": [{ "lat": número, "lng": número }]
}
`;

    // IA Model creation
    const genIA = new GoogleGenAI({ apiKey });

    const result = await generateWithRetry(genIA, {
      // model: "gemini-2.5-flash",
      model: "gemini-2.5-flash-lite",
      contents: userPrompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 2000 },
      },
    });

    if (!result.text) {
      throw new Error("Resposta do Gemini veio vazia");
    }
    const parsedResponse = JSON.parse(result.text);

    const alertaTexto = parsedResponse.mensagem;
    const bairrosPerigosos = parsedResponse.neigh;

    const coordsFiltradas = neighborhoodNames
      .map((nome: string, index: number) => ({
        nome,
        coord: neighborhoodCoordinates[index],
      }))
      .filter((item: { nome: string }) => bairrosPerigosos.includes(item.nome));

    return { result: [alertaTexto, coordsFiltradas] };
  } catch (error: any) {
    console.error("ERRO FINAL:", error.message);
    throw new Error(error.message);
  }
}
