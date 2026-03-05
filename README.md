<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Deep SEO Benchmark

Compara tu web con tus competidores usando análisis de IA (Gemini API). Los datos SEO se extraen **directamente del HTML real** de cada página mediante un backend de crawling propio — no son datos inventados por la IA.

---

## Run Locally

**Prerequisites:** Node.js (v18+). Se recomienda instalarlo vía [nvm](https://github.com/nvm-sh/nvm).

**1. Instalar dependencias del frontend (root):**
```bash
npm install
```

**2. Instalar dependencias del backend:**
```bash
cd backend && npm install
```

**3. Descargar Chromium para Playwright** *(solo la primera vez)*:
```bash
cd backend && npx playwright install chromium
```

**4. Configurar la API key de Gemini:**

Crea el archivo `.env.local` en la raíz del proyecto con:
```
GEMINI_API_KEY=tu_clave_aqui
```
Obtén una clave gratuita en [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

**5. Arrancar ambos servidores:**
```bash
# Terminal 1 — Backend (crawler)
cd backend && npm run dev

# Terminal 2 — Frontend
npm run dev:frontend
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

---

## Arquitectura del proyecto

```
deep-seo-benchmark/
├── App.tsx                          # Componente raíz y orquestador del flujo
├── types.ts                         # Definición de interfaces TypeScript
├── index.tsx                        # Punto de entrada React
├── index.html                       # HTML base
├── .env.local                       # API key de Gemini (no incluida en el repo)
├── services/
│   └── geminiService.ts             # Crawling real + análisis comparativo con Gemini
├── components/
│   ├── BenchmarkResultsDisplay.tsx  # Resultados agrupados por métrica (incluye URLs en cabeceras)
│   ├── KeywordAnalysis.tsx          # Matriz de optimización de keywords (TITLE, H1, H2, META)
│   ├── ComparisonTable.tsx          # Tabla comparativa estructurada
│   ├── GapsAndInsights.tsx          # Panel de gaps e insights SEO (integra KeywordAnalysis)
│   ├── WebsiteCard.tsx              # Tarjeta individual de un sitio
│   ├── LoadingSpinner.tsx           # Indicador de carga
│   └── MarkdownRenderer.tsx         # Renderizador de Markdown
└── backend/
    ├── server.ts                    # Servidor Express — endpoint POST /api/crawl
    ├── crawler.ts                   # Lógica de crawling en dos capas (fetch → Playwright)
    ├── package.json                 # Dependencias del backend
    └── tsconfig.json                # Configuración TypeScript para Node.js
```

### Flujo general

```
Usuario introduce URLs + términos de búsqueda
  → handleAnalyze() [App.tsx]
      → validateUrl() por cada URL
      → analyzeWebsite() × (1 sitio usuario + N competidores) en paralelo
          → POST /api/crawl [backend/server.ts]
              → crawlWithFetch()       ← Capa 1: rápido, ~1-2s
              → crawlWithPlaywright()  ← Capa 2: fallback si falla, ~5-10s
          → interpretWithGemini()      ← Solo contentSummary + navigationItems
      → getBenchmarkInsights() con todos los análisis obtenidos
  → Renderiza <BenchmarkResultsDisplay> + <GapsAndInsights>
```

### Estrategia anti-bloqueo del crawler

El backend usa dos capas en cascada para obtener el HTML real de cada URL:

| Capa | Método | Tiempo | Cobertura |
|---|---|---|---|
| **1** | `fetch` + headers de Chrome | ~1-2s | WordPress, Next.js SSR, Nuxt, webs estáticas |
| **2** | Playwright + stealth plugin | ~5-10s | SPAs (Angular, Vue CSR), Cloudflare básico |

Si ambas capas fallan (Cloudflare Enterprise, Turnstile), se devuelven campos vacíos con `crawlMethod: 'failed'`.

---

## Inventario de funciones

> **Referencia de desarrollo.** Consulta esta sección antes de hacer cambios para identificar qué archivos impacta cada funcionalidad.

---

### `types.ts` — Interfaces de datos

| Interfaz | Campos principales | Descripción |
|---|---|---|
| `HreflangTag` | `lang`, `url` | Representa una etiqueta `<link rel="alternate" hreflang="...">` extraída del HTML. |
| `KeywordPerformance` | `siteUrl`, `inTitle`, `inH1`, `inH2`, `inMeta`, `contentRelevance` | Desempeño de una keyword específica en un sitio. `contentRelevance` es 'high', 'medium', 'low' o 'none'. |
| `KeywordAnalysis` | `keyword`, `performance[]` | Agrupado por keyword, contiene el rendimiento en todos los sitios analizados. |
| `WebsiteAnalysis` | `url`, `title`, `metaDescription`, `h1`, `h2s`, `h3s`, `navigationItems`, `schemaMarkup`, `hreflangTags`, `structuredDataTypes`, `contentSummary`, `crawlMethod`, `crawlError`, `comparisonPages` | Datos reales extraídos de un sitio web. `schemaMarkup` contiene los objetos JSON-LD parseados. `structuredDataTypes` se deriva de `schemaMarkup` para compatibilidad con componentes existentes. `crawlMethod` indica si se usó `fetch` o `playwright`. |
| `BenchmarkResult` | `summaryInsights`, `keywordAnalysis[]`, `sectionGaps[]`, `contentGaps[]`, `suggestions[]`, `contentRecommendations[]` | Resultado del análisis comparativo generado por Gemini. `summaryInsights` está en formato Markdown. `keywordAnalysis` alimenta la matriz de optimización. |
| `ApiResponseError` | `message` | Error tipado para las llamadas a la API. |

---

### `backend/crawler.ts` — Motor de crawling

| Función | Visibilidad | Parámetros | Devuelve | Descripción |
|---|---|---|---|---|
| `extractSeoFromHtml(html, url)` | Privada | `string`, `string` | `Omit<SeoData, 'crawlMethod' \| 'crawlError'>` | Parsea el HTML con Cheerio y extrae: `title` (`<title>`), `metaDescription` (`<meta name="description">` u OG), `h1` (primer `<h1>`), `h2s`, `h3s`, `schemaMarkup` (todos los `<script type="application/ld+json">` parseados), `hreflangTags` (todos los `<link rel="alternate" hreflang="...">`). |
| `hasUsefulData(data)` | Privada | `Partial<SeoData>` | `boolean` | Devuelve `true` si el HTML extraído contiene al menos título, H1 o algún H2 — indica que el fetch no fue bloqueado. |
| `crawlWithFetch(url)` | Privada async | `string` | `Promise<SeoData \| null>` | **Capa 1.** Hace `fetch(url)` con headers realistas de Chrome (User-Agent, Sec-Fetch-*, etc.), timeout de 10s. Devuelve `null` si el HTTP falla o si `hasUsefulData()` es `false`. |
| `crawlWithPlaywright(url)` | Privada async | `string` | `Promise<SeoData>` | **Capa 2.** Lanza Chromium headless con `playwright-extra` + `puppeteer-extra-plugin-stealth`. Espera `domcontentloaded` + 1.5s adicionales para páginas JS-heavy. Extrae el HTML renderizado y lo parsea con `extractSeoFromHtml()`. |
| `crawlUrl(url)` | **Export** async | `string` | `Promise<SeoData>` | Función principal. Intenta `crawlWithFetch()` primero; si devuelve `null`, ejecuta `crawlWithPlaywright()`. Si ambos fallan, devuelve un `SeoData` vacío con `crawlMethod: 'failed'` y el mensaje de error. |

**Constante `CHROME_HEADERS`:** cabeceras HTTP realistas de Chrome 121 para evitar detección básica de bots (User-Agent, Accept, Sec-Fetch-*, etc.).

---

### `backend/server.ts` — Servidor Express

| Endpoint | Método | Body | Respuesta | Descripción |
|---|---|---|---|---|
| `/health` | `GET` | — | `{ status: 'ok' }` | Health check del servidor. |
| `/api/crawl` | `POST` | `{ url: string }` | `SeoData` | Valida la URL, llama a `crawlUrl()` y devuelve los datos SEO reales. CORS habilitado para `localhost:3000` y `localhost:5173`. |

**Puerto:** `3001` por defecto (configurable con la variable de entorno `PORT`).

---

### `services/geminiService.ts` — Capa de servicio

| Función | Visibilidad | Parámetros | Devuelve | Descripción |
|---|---|---|---|---|
| `cleanMalformedJson(malformedJsonString)` | Privada | `string` | `string` | Extrae el bloque JSON principal buscando `{` y `}`. Lanza error si el JSON sigue siendo inválido tras la extracción. |
| `extractStructuredDataTypes(schemaMarkup)` | Privada | `object[]` | `string[]` | Extrae los valores de `@type` de cada objeto JSON-LD (incluidos los nodos dentro de `@graph`). Deduplica los tipos resultantes. |
| `crawlPage(url)` | Privada async | `string` | `Promise<RawCrawlData>` | Llama a `POST http://localhost:3001/api/crawl` y devuelve los datos SEO reales del backend. |
| `interpretWithGemini(url, realData, contextTerms)` | Privada async | `string`, `{title, metaDescription, h1, h2s, h3s}`, `string[]` | `Promise<{contentSummary, navigationItems}>` | Único prompt que se envía a Gemini durante el análisis de una página. Recibe los datos reales extraídos y genera solo el resumen de contenido e infiere los ítems de navegación. |
| `analyzeWebsite(url, contextTerms)` | **Export** async | `url: string`, `contextTerms: string[]` | `Promise<WebsiteAnalysis>` | Orquesta el análisis de una URL: (1) llama a `crawlPage()` para datos reales, (2) llama a `interpretWithGemini()` para `contentSummary` y `navigationItems`, (3) deriva `structuredDataTypes` desde `schemaMarkup`. Si Gemini falla, devuelve igualmente los datos reales del crawler. |
| `getBenchmarkInsights(userSite, competitors, contextTerms)` | **Export** async | `userSite: WebsiteAnalysis`, `competitors: WebsiteAnalysis[]`, `contextTerms: string[]` | `Promise<BenchmarkResult>` | Envía todos los análisis reales a Gemini para generar el benchmark comparativo: resumen de insights (Markdown), **análisis de keywords (matriz)**, gaps de secciones, gaps de contenido, sugerencias generales y recomendaciones de contenido específicas. |

**Modelo Gemini utilizado:** `gemini-2.5-flash` (temperatura: 0.3 en ambas funciones).

---

### `App.tsx` — Componente principal y orquestador

#### Estado (useState)

| Estado | Tipo | Descripción |
|---|---|---|
| `userSiteUrl` | `string` | URL del sitio del usuario |
| `competitorUrls` | `string[]` | Array de URLs de competidores (mín. 1, máx. 5) |
| `searchTerms` | `string` | Términos de búsqueda contextuales separados por comas |
| `userSiteAnalysis` | `WebsiteAnalysis \| null` | Resultado del análisis del sitio del usuario |
| `competitorAnalyses` | `WebsiteAnalysis[]` | Resultados de los análisis de los competidores |
| `benchmarkResults` | `BenchmarkResult \| null` | Resultado del benchmark comparativo |
| `loading` | `boolean` | Controla el estado de carga (deshabilita el botón de análisis) |
| `error` | `string \| null` | Mensaje de error para mostrar en la UI |
| `showDisclaimer` | `boolean` | Controla la visibilidad del aviso inicial sobre el funcionamiento de la app |

#### Funciones

| Función | Tipo | Archivos implicados | Descripción |
|---|---|---|---|
| `handleAddCompetitor()` | `useCallback` | `App.tsx` | Añade un campo vacío al array `competitorUrls` (máximo 5). |
| `handleRemoveCompetitor(index)` | `useCallback` | `App.tsx` | Elimina el competidor en la posición `index` del array. |
| `handleCompetitorUrlChange(index, value)` | `useCallback` | `App.tsx` | Actualiza el valor de la URL de un competidor específico. |
| `validateUrl(url)` | Función local | `App.tsx` | Valida que la URL sea válida: acepta `http://`, `https://` o rutas relativas que empiecen por `/`. Usa `new URL()` internamente. |
| `handleAnalyze()` | `useCallback` async | `App.tsx`, `geminiService.ts` | Función principal del benchmark. Valida inputs, llama a `analyzeWebsite()` en paralelo para todos los sitios (`Promise.all`), luego llama a `getBenchmarkInsights()`. Gestiona el estado de carga y los errores. |

---

### `components/BenchmarkResultsDisplay.tsx` — Resultados por métrica

| Función / Componente | Parámetros | Archivos implicados | Descripción |
|---|---|---|---|
| `renderContent(content)` | `string \| string[] \| undefined` | `BenchmarkResultsDisplay.tsx` | Función interna de `MetricComparisonCard`. Renderiza: URL como `<a>`, array como `<ul>`, string como `<p>`. |
| `MetricComparisonCard` | `metricLabel`, `userValue`, `competitorValues`, `userSiteUrl`, `competitorUrls`, `isUrl?` | `BenchmarkResultsDisplay.tsx`, `types.ts` | Tarjeta que muestra "Mi Web" (resaltada en morado) frente a cada competidor. Muestra la URL truncada en la cabecera de cada columna para mejor identificación. |
| `SectionTitle` | `title` | `BenchmarkResultsDisplay.tsx` | Título de sección interna con línea divisoria. |
| `BenchmarkResultsDisplay` | `userSite: WebsiteAnalysis`, `competitors: WebsiteAnalysis[]` | `BenchmarkResultsDisplay.tsx`, `types.ts` | Renderiza todas las métricas comparativas: resumen de contenido, elementos SEO de la home (título, meta desc., H1, H2s), navegación, datos estructurados y página comparable completa. |

---

### `components/KeywordAnalysis.tsx` — Matriz de optimización

| Componente | Parámetros | Archivos implicados | Descripción |
|---|---|---|---|
| `KeywordAnalysis` | `analysis: KeywordAnalysis[]` | `KeywordAnalysis.tsx`, `types.ts` | Muestra una tabla comparativa de keywords vs sitios. Indica la presencia en TITLE, H1, H2 y META (✅/❌) y el nivel de relevancia del contenido determinado por IA. |

---

### `components/ComparisonTable.tsx` — Tabla comparativa estructurada

| Función / Componente | Parámetros | Archivos implicados | Descripción |
|---|---|---|---|
| `hasKeyword(headings, keyword)` | `headings: string[]`, `keyword: string` | `ComparisonTable.tsx` | Devuelve `true` si algún encabezado contiene la keyword (case-insensitive). |
| `renderHeadingComparisonRows(label, siteHeadings)` | `label: string`, `siteHeadings: string[][]` | `ComparisonTable.tsx` | Genera filas de tabla para cada keyword de `COMMON_H_KEYWORDS`, mostrando ✅/❌ por sitio. |
| `getValue(site)` | `site: WebsiteAnalysis` | `ComparisonTable.tsx`, `types.ts` | Funciones inline en el array `homeMetrics` que extraen cada métrica de un sitio (título, meta desc., H1, navegación, datos estructurados). |
| `ComparisonTable` | `userSite: WebsiteAnalysis`, `competitors: WebsiteAnalysis[]` | `ComparisonTable.tsx`, `types.ts` | Renderiza 3 secciones: (1) tarjetas Home/Subdirectorio, (2) tabla ✅/❌ de encabezados H2/H3 por keywords, (3) tabla de página comparable. |

**Constante `COMMON_H_KEYWORDS`:** lista de keywords comunes usadas en la tabla comparativa de encabezados (`servicios`, `productos`, `equipo`, `contacto`, `precios`, etc.).

---

### `components/GapsAndInsights.tsx` — Panel de gaps e insights

| Componente | Parámetros | Archivos implicados | Descripción |
|---|---|---|---|
| `GapsAndInsights` | `results: BenchmarkResult` | `GapsAndInsights.tsx`, `types.ts`, `MarkdownRenderer.tsx` | Muestra el `BenchmarkResult` incluyendo: (1) **Matriz de Keywords** (si hay datos), (2) Resumen de Insights (Markdown), (3) Gaps de Secciones, (4) Gaps de Contenido, (5) Sugerencias Generales, (6) Recomendaciones de Contenido Específicas. |

---

### `components/WebsiteCard.tsx` — Tarjeta individual de sitio

| Componente | Parámetros | Archivos implicados | Descripción |
|---|---|---|---|
| `WebsiteCard` | `analysis: WebsiteAnalysis`, `isUserSite?: boolean` | `WebsiteCard.tsx`, `types.ts` | Tarjeta completa con todos los datos de un sitio: URL, resumen, elementos SEO, navegación, datos estructurados y página comparable. El borde es morado para el sitio del usuario y gris para competidores. **Nota:** importado en `App.tsx` pero no renderizado directamente en la vista de resultados actual. |

---

### `components/LoadingSpinner.tsx` — Indicador de carga

| Componente | Parámetros | Archivos implicados | Descripción |
|---|---|---|---|
| `LoadingSpinner` | `message?: string` (default: `'Analizando...'`) | `LoadingSpinner.tsx`, `App.tsx` | Spinner animado con mensaje configurable. Se muestra en `App.tsx` durante las llamadas a la API. |

---

### `components/MarkdownRenderer.tsx` — Renderizador de Markdown

| Componente | Parámetros | Archivos implicados | Descripción |
|---|---|---|---|
| `MarkdownRenderer` | `content: string`, `className?: string` | `MarkdownRenderer.tsx`, `GapsAndInsights.tsx`, `App.tsx` | Envuelve `react-markdown` con el plugin `remark-gfm` (tablas, listas de tareas, etc.). Utilizado en el aviso inicial de `App.tsx` y en `GapsAndInsights.tsx` para el campo `summaryInsights`. |
