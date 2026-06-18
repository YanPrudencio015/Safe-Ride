import { GoogleGenerativeAI } from "@google/generative-ai";

// some type to avoid repeat more than one struture
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

// structure to the Gemini creation
// export async function GeminiResponse(req: any) {
export async function GeminiResponse(payload: RouteAnalyticsPayload) {
  type NewsBody = {
    date: string;
    fullContent: string;
    link: string;
    neighborhood: string;
    title: string;
  };
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { result: null, error: "API Key missing" };

    const {
      neighborhoodNames,
      neighborhoodCoordinates,
      neighborhoodNews,
      prompt,
    } = payload;

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
    type NewsBody = {
      neighborhood: string;
      title: string;
      fullContent: string;
    };

    const genIA = new GoogleGenerativeAI(apiKey);
    const model = genIA.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      // model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
      systemInstruction: systemInstruction,
    });

    // Uso da função de retry
    // Chama o modelo com o prompt do usuário
    const result = await generateWithRetry(model, userPrompt);
    const response = await result.response;
    const parsedResponse = JSON.parse(response.text());

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

// export async function POST(req: NextRequest) {
//   type NewsBody = {
//     date: string;
//     fullContent: string;
//     link: string;
//     neighborhood: string;
//     title: string;
//   };
//   try {
//     const apiKey = process.env.GEMINI_API_KEY;
//     if (!apiKey)
//       return NextResponse.json({ error: "API Key missing" }, { status: 500 });

//     const {
//       neighborhoodNames,
//       neighborhoodCoordinates,
//       neighborhoodNews,
//       prompt,
//     }: RouteAnalyticsPayload = await req.json();

//     const cleanNews = neighborhoodNews
//       .filter((n: NewsBody) => {
//         const title = n.title?.toLocaleLowerCase() || "";
//         const content = n.fullContent?.toLocaleLowerCase() || "";
//         const keyWords = [
//           "assalto",
//           "roubo",
//           "sequestro",
//           "criminoso",
//           "tráfico",
//           "operação",
//           "confronto",
//           "rendido",
//           "motorista",
//           "entregador",
//         ];
//         return keyWords.some((p) => title.includes(p) || content.includes(p));
//       })
//       .map((n: NewsBody) => ({
//         neighborhood: n.neighborhood,
//         title: n.title,
//         content: n.fullContent?.slice(0, 400),
//       }));

//     const userPrompt = `
// BAIRROS DA ROTA: ${JSON.stringify(neighborhoodNames)}

// COORDENADAS (mesma ordem dos bairros): ${JSON.stringify(neighborhoodCoordinates)}

// NOTÍCIAS FILTRADAS:
// ${cleanNews
//   .map(
//     (n) =>
//       `- Bairro: ${n.neighborhood}\n  Título: ${n.title}\n  Conteúdo: ${n.content}`,
//   )
//   .join("\n\n")}

// Analise e retorne o JSON conforme instruído.
// `;

//     const systemInstruction = `
// Você é um assistente de segurança para motoristas, entregadores e passageiros no Brasil.

// Você receberá notícias filtradas sobre bairros de uma rota.
// Sua tarefa é identificar quais bairros representam risco real para quem trafega por eles.

// CRITÉRIO DE RISCO — considere risco confirmado se a notícia mencionar:
// - Assalto, roubo, sequestro ou tentativa contra motoristas ou entregadores
// - Confronto armado, operação policial ou tiroteio na via
// - Restrição de acesso por facções ou tráfico

// REGRAS:
// - Só cite bairros com risco nas notícias fornecidas. Nunca invente.
// - Notícias antigas (mais de 2 anos) contam como histórico de risco — mencione como tal.
// - Tom formal e corporativo. Um parágrafo único, máximo 40 palavras.
// - Se nenhum bairro tiver risco confirmado: retorne "Rota aparentemente segura, boa viagem."

// RETORNE APENAS JSON VÁLIDO, SEM TEXTO FORA DO JSON:
// {
//   "mensagem": "parágrafo único formal, máx 40 palavras",
//   "neigh": ["nomes exatos dos bairros de risco, conforme recebidos"],
//   "coordenadas_risco": [{ "lat": número, "lng": número }]
// }
// `;
//     type NewsBody = {
//       neighborhood: string;
//       title: string;
//       fullContent: string;
//     };

//     const genIA = new GoogleGenerativeAI(apiKey);
//     const model = genIA.getGenerativeModel({
//       model: "gemini-2.5-flash-lite",
//       // model: "gemini-2.5-flash",
//       generationConfig: { responseMimeType: "application/json" },
//       systemInstruction: systemInstruction,
//     });

//     // Uso da função de retry
//     // Chama o modelo com o prompt do usuário
//     const result = await generateWithRetry(model, userPrompt);
//     const response = await result.response;
//     const parsedResponse = JSON.parse(response.text());

//     const alertaTexto = parsedResponse.mensagem;
//     const bairrosPerigosos = parsedResponse.neigh;

//     const coordsFiltradas = neighborhoodNames
//       .map((nome: string, index: number) => ({
//         nome,
//         coord: neighborhoodCoordinates[index],
//       }))
//       .filter((item: { nome: string }) => bairrosPerigosos.includes(item.nome));

//     return NextResponse.json({
//       result: [alertaTexto, coordsFiltradas],
//     });
//   } catch (error: any) {
//     console.error("ERRO FINAL:", error.message);
//     return NextResponse.json(
//       {
//         error: "Falha ao processar após várias tentativas",
//         details: error.message,
//       },
//       { status: 500 },
//     );
//   }
// }
