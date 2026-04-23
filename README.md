# 🛡️ Safe Ride
> Viaje pelo Brasil de maneiras mais seguras com consciência dos riscos reais ao seu redor e sugestões de como evita-las.
> **Status:** MVP no ar 🚀 → [[saferideproject.netlify.app](https://saferideproject.netlify.app/)](https://saferideproject.netlify.app/)


---

## O problema


No Rio de Janeiro, ocorrências de violência afetam trajetos urbanos todos os dias. Não só isso, 
restrições de entradas de carros particulares em zonas de riscos, casos de incidentes onde motoristas são abordados,
além de proibições de motoboys e entregadores em certas comunidades do Rio. Sobretudo, Esse problema 
se encontra não só no território carioca mas também em boa parte do Brasil.

O Objetivo do Safe Ride é esse: consome a API do Fogo Cruzado e plota as ocorrências
diretamente no mapa, dando ao usuário uma visão geográfica clara dos riscos na região. Mas infelizmente limitada
à alguns estados. E para sobressair dessa limitação, foco em incrementar a inteligência artificial.

## ✦ Funcionalidades

- **Mapa interativo** com marcadores de ocorrências em tempo real.
- **Autenticação com a API do Fogo Cruzado** para consumo de dados reais de segurança.
- **Deploy contínuo** via Netlify com pipeline de CI/CD configurado.

🔜 Roadmap de Evolução
O Safe Ride está sendo construído em fases, evoluindo de um mapa de visualização para uma ferramenta de decisão inteligente.

1. Inteligência de Dados e IA (O "Cérebro")
[ ] Engine de Busca IA (Expansão Nacional): Implementação de LLM para monitorar notícias em tempo real em estados sem cobertura do Fogo Cruzado, filtrando termos como "arrastão", "operação" e "confronto".

[ ] Sentiment Analysis Local: Treinar a IA para identificar "climas tensos" em notícias locais antes mesmo do incidente ser reportado oficialmente.

[ ] Análise de Horário de Exposição: Modulação dinâmica de risco (um local pode ser seguro às 14h, mas crítico às 23h).

2. Geofencing e Navegação (Mapbox)
[ ] Mapeamento de "Safe Zones": Identificação via IA de locais públicos (postos 24h, farmácias, mercados) para pontos de embarque seguros com iluminação e movimento.

[ ] Desvio Geográfico Granular: Em vez de evitar bairros inteiros, criar um "raio de desvio" automático em torno da rua exata do incidente.

[ ] Conversão GeoJSON Automática: Padronizar qualquer notícia ou dado de IA para polígonos visuais no mapa.

3. Experiência e Segurança do Usuário (UX/UI)
[ ] GPS Cego vs. Risco Territorial: Cruzar a rota do GPS com dados de domínio de área e barricadas antes do início da viagem.

[ ] Validação Biométrica Simétrica: Proposta de biometria facial para passageiros em áreas de risco (combatendo contas "laranja").

[ ] Incentivo Financeiro Transparente: Exibir score de risco e adicional financeiro opcional para motoristas antes do aceite da corrida.

[ ] Assistente de Voz Ativo (NLP): Alertas sonoros para motoristas: "Confronto detectado a 1km. Sugiro desvio pela direita. Posso alterar?"

## 🛠 Stack e decisões técnicas

| Tecnologia | Por que foi escolhida |
|---|---|
| **Next.js 14+ (App Router)** | Separação estratégica entre Server e Client Components — lógica de autenticação com a API fica no servidor, sem expor tokens no cliente |
| **TypeScript** | Tipar os dados da API do Fogo Cruzado desde o início evita erros silenciosos com estruturas geoespaciais |
| **Mapbox GL** | Performance superior ao Leaflet para renderização de múltiplos marcadores com dados dinâmicos |
| **Tailwind CSS** | Estilização responsiva sem overhead de CSS customizado |

---



## ⚙️ Rodando localmente

### Pré-requisitos

- Node.js 18+
- Conta no [Mapbox](https://mapbox.com) (token público)
- Credenciais na [API do Fogo Cruzado](https://api.fogocruzado.org.br)

### Instalação

```bash
git clone https://github.com/YanPrudencio015/Safe-Ride
cd Safe-Ride
npm install
```

### Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=seu_token_aqui
FOGO_CRUZADO_EMAIL=seu_email_aqui
FOGO_CRUZADO_PASSWORD=sua_senha_aqui
```

> ⚠️ As credenciais do Fogo Cruzado são usadas **apenas no servidor** (Server Components).
> Nunca exponha essas variáveis com o prefixo `NEXT_PUBLIC_`.

### Rodando

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## 📁 Estrutura do projeto

```text
src/
├── app/              # Rotas, páginas e layouts (Next.js App Router)
│   ├── api/          # Route Handlers para chamadas de servidor
│   └── login/        # Lógica da página de autenticação
├── components/       # Componentes reutilizáveis de UI
├── services/         # Configurações de serviços externos (Mapbox/Fogo Cruzado)
├── types/            # Definições de interfaces TypeScript para a API
└── utils/            # Funções utilitárias e constantes


