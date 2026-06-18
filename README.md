# 🛡️ Safe Ride

> Viaje pelo Brasil de forma mais consciente — visualizando riscos reais ao longo do seu trajeto e recebendo alertas inteligentes baseados em dados e notícias locais.

**Deploy:** [saferideproject.netlify.app](https://saferideproject.netlify.app) · **Status:** MVP no ar 🚀

---

## O problema

No Brasil, ocorrências de violência afetam trajetos urbanos todos os dias. Motoristas de aplicativo são abordados em zonas de risco, motoboys e entregadores enfrentam restrições em comunidades, carros particulares são impedidos de entrar em certas áreas.

Esse problema está presente em boa parte do território brasileiro.

O Safe Ride consome a API do Fogo Cruzado e plota ocorrências diretamente no mapa, dando ao usuário uma visão geográfica clara dos riscos na região. Para superar a limitação geográfica dessa API, o projeto evolui para uma camada de inteligência artificial capaz de monitorar notícias em tempo real em qualquer estado do país.

---

## ✦ Funcionalidades

- Mapa interativo com marcadores de ocorrências em tempo real
- Autenticação com a API do Fogo Cruzado para consumo de dados reais de segurança
- Pipeline de IA para análise de risco por bairro ao longo da rota
- Deploy contínuo via Netlify com pipeline de CI/CD configurado

---

## 🧠 O desafios técnicos: 
**Do trajeto ao alerta inteligente**

### Situação

Ao traçar uma rota, o sistema precisa identificar quais bairros o passageiro com motorista ou motoboys vão cruzar durante o percurso e verificar se há ocorrências recentes ou histórico de risco nessas áreas — devolvendo alertas personalizados para os usuários.

### Problema

A abordagem inicial foi passar as coordenadas da rota diretamente para um modelo de IA e pedir que ele identificasse os bairros e pesquisasse notícias. O resultado foi impreciso: o modelo não tinha acesso à internet e **chutava** os nomes dos bairros com base em conhecimento de treinamento desatualizado. Coordenadas não são texto — um LLM não faz reverse geocoding com precisão.

### Solução: pipeline de orquestração em 4 etapas

Em vez de delegar tudo para um único modelo, o problema foi decomposto em etapas especializadas, cada uma com a ferramenta certa:

```
Rota (coordenadas brutas)
        ↓
[1] Turf.js          → Simplifica a rota, removendo pontos redundantes
                        do mesmo bairro (tolerância geoespacial: 0.01)
        ↓
[2] Mapbox Geocoding  → Converte cada coordenada precisa em nome de bairro
                        (reverse geocoding via API — sem chute)
        ↓
[3] Serper API        → Pesquisa notícias reais na internet por bairro:
                        "arrastão", "confronto", "motorista", etc.
        ↓
[4] Jina AI           → Lê e extrai o conteúdo textual das páginas de notícia
        ↓
[5] Gemini            → Analisa o conteúdo e gera mensagem de alerta
                        personalizada por perfil (motorista / entregador / passageiro)
```

### Por que Turf.js na primeira etapa?

Uma rota com muitos pontos GPS frequentemente tem dezenas de coordenadas dentro do mesmo bairro. Fazer reverse geocoding em todos eles seria redundante, lento e geraria duplicatas. O Turf.js simplifica a polilinha com `turf.simplify()` (tolerância `0.01`, `highQuality: true`), retornando apenas os pontos mais representativos geograficamente — um por trecho de bairro. Após o geocoding, duplicatas remanescentes são removidas com `Set`.

```typescript
// Resultado: lista única de bairros no trajeto, sem redundância
const neighborhoods = [
  ...new Set(results.filter((name): name is string => name !== null)),
];
```

### Resultado

A pipeline entrega bairros precisos, notícias reais e análise contextual — substituindo o "chute" do modelo por dados verificáveis de fontes externas. A integração com o frontend (exibição da mensagem do Gemini no mapa) está em andamento.

---

## ⚡ Otimização de Performance da Pipeline

### Situação
A pipeline de análise de rotas retornava resultados em 13 a 20 segundos — 
tempo suficiente para distrair um motorista em movimento ou fazer um 
passageiro abandonar o app antes mesmo de iniciar uma corrida.

Além disso, ferramentas como Gemini e Jina possuem limites de uso diário 
e mensal. Múltiplos usuários pesquisando o mesmo bairro consumiriam 
chamadas desnecessárias de API para um resultado que já havia sido calculado.

### Problema
Três gargalos identificados via logs de tempo:

- **Gemini:** responsável por 9 dos 12 segundos totais
- **Jina:** lendo URLs sequencialmente por bairro em vez de em paralelo
- **Arquitetura:** todas as requisições no client side, impossibilitando 
  o uso de cache com Redis (que só funciona no servidor)

### Solução

**1 — Unificação no server side**
Movi todas as requisições do client side para um arquivo único 
`pipeline/route.ts` no servidor. Isso permitiu implementar a 
verificação de cache antes de qualquer chamada de API.

**2 — Cache com Redis/Upstash**
Implementei cache com TTL de 24 horas. Rotas já consultadas retornam 
o resultado salvo sem executar a pipeline — eliminando consumo 
desnecessário de Serper, Jina e Gemini.

**3 — Paralelização do Jina**
Em vez de ler URLs sequencialmente por bairro, passei a coletar todos 
os links de todos os bairros e disparar todas as leituras em paralelo 
com `Promise.all` de uma vez só.
## Resultado:
ao fazer a pesquisa após esses ajustes, o custo de tempo foi de 13 a 20 segundos para 6 a 8 segundos. Melhoria na performance da  implementação da feature de identificação de local seguro para rápido embarque e desembarque em zonas categorizadas como perigosas
 

---

## 🛠 Stack e decisões técnicas

| Tecnologia | Por que foi escolhida |
|---|---|
| **Next.js 14+ (App Router)** | Separação entre Server e Client Components — autenticação e tokens da API do Fogo Cruzado ficam no servidor, sem expor credenciais no cliente |
| **TypeScript** | Tipar os dados geoespaciais da API desde o início evita erros silenciosos com estruturas de coordenadas aninhadas |
| **Mapbox GL JS** | Performance superior ao Leaflet para renderização de múltiplos marcadores dinâmicos; suporte nativo a camadas GeoJSON |
| **Turf.js** | Operações geoespaciais precisas no servidor — simplificação de rotas sem dependência de terceiros |
| **Serper API** | Pesquisa web programática com retorno estruturado, substituindo scraping frágil |
| **Jina AI** | Extração de conteúdo limpo de URLs de notícias, sem lidar com HTML bruto |
| **Google Gemini** | Geração de alertas contextuais com custo acessível e integração simples via API |
| **Tailwind CSS** | Estilização responsiva sem overhead de CSS customizado |

---

## ⚙️ Rodando localmente

**Pré-requisitos:** Node.js 18+, conta no Mapbox, credenciais na API do Fogo Cruzado, credenciais no Gemini, Credenciais Serper

```bash
git clone https://github.com/YanPrudencio015/Safe-Ride
cd Safe-Ride
npm install
```

Crie um `.env.local` na raiz:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=seu_token_aqui
FOGO_CRUZADO_EMAIL=seu_email_aqui
FOGO_CRUZADO_PASSWORD=sua_senha_aqui
GEMINI_API_KEY=sua_api_aqui
SERPER_API=sua_api_aqui
UPSTASH_REDIS_REST_URL=url_aqui
UPSTASH_REDIS_REST_TOKEN=seu_token_aqui
```

> ⚠️ As credenciais do Fogo Cruzado são usadas **apenas no servidor** (Server Components). Nunca exponha essas variáveis com o prefixo `NEXT_PUBLIC_`.

```bash
npm run dev
# Acesse http://localhost:3000
```

---

## 📁 Estrutura do projeto

```
src/
├── app/
│   ├── api/          # Route Handlers — autenticação e chamadas server-side
│   └── login/        # Lógica de autenticação com Fogo Cruzado
├── components/       # Componentes reutilizáveis de UI
├── services/         # Configurações de serviços externos (Mapbox, Fogo Cruzado)
├── types/            # Interfaces TypeScript para dados da API
└── utils/
    └── getNeighborhoodsFromRoute.ts  # Pipeline Turf.js + Mapbox geocoding
```

---

## 🔜 Roadmap

**Inteligência e dados**
- [ ] Exibição da mensagem de alerta do Gemini no frontend
- [x] Engine de busca IA para estados sem cobertura do Fogo Cruzado
- [x] Sentiment analysis de notícias locais

**Navegação e mapa**
- [ ] Desvio geográfico granular por rua (não por bairro inteiro)
- [ ] Mapeamento de "Safe Zones" (postos 24h, farmácias, locais iluminados)
- [x] Conversão automática de dados de IA para polígonos GeoJSON

**UX**
- [ ] Alertas por perfil de usuário (motorista, entregador, passageiro)
- [ ] Assistente de voz ativo com sugestões de desvio
