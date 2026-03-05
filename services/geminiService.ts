// services/geminiService.ts
import { FunctionDeclaration, GoogleGenAI, Type } from "@google/genai";
import { BenchmarkResult, WebsiteAnalysis } from "../types";

const API_KEY = process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:3001";

/**
 * Attempts to clean a malformed JSON string returned by the AI.
 */
function cleanMalformedJson(malformedJsonString: string): string {
  const firstBrace = malformedJsonString.indexOf('{');
  const lastBrace = malformedJsonString.lastIndexOf('}');

  let jsonCandidate = malformedJsonString;
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonCandidate = malformedJsonString.substring(firstBrace, lastBrace + 1);
  } else {
    throw new Error("La respuesta de la IA no contiene una estructura de objeto JSON válida.");
  }

  try {
    const parsed = JSON.parse(jsonCandidate);
    return JSON.stringify(parsed);
  } catch (error) {
    console.error("Error al parsear el JSON después de la limpieza básica:", error);
    throw new Error(`La respuesta de la IA contiene JSON malformado: ${(error as Error).message}`);
  }
}

/**
 * Extracts @type values from an array of parsed schema.org JSON-LD objects.
 */
function extractStructuredDataTypes(schemaMarkup: object[]): string[] {
  const types: string[] = [];
  for (const item of schemaMarkup) {
    const schema = item as Record<string, unknown>;
    if (schema['@type']) {
      const type = schema['@type'];
      if (Array.isArray(type)) {
        types.push(...type.map(String));
      } else {
        types.push(String(type));
      }
    }
    // Handle @graph arrays (e.g., { "@graph": [...] })
    if (schema['@graph'] && Array.isArray(schema['@graph'])) {
      for (const node of schema['@graph'] as Record<string, unknown>[]) {
        if (node['@type']) {
          const t = node['@type'];
          if (Array.isArray(t)) {
            types.push(...t.map(String));
          } else {
            types.push(String(t));
          }
        }
      }
    }
  }
  return [...new Set(types)]; // deduplicate
}

/**
 * Step 1: Crawl the URL using the local backend (real data).
 * Returns raw crawl data from the Express + Cheerio/Playwright backend.
 */
async function crawlPage(url: string): Promise<{
  title: string;
  metaDescription: string;
  h1: string;
  h2s: string[];
  h3s: string[];
  navLinks: string[];
  schemaMarkup: object[];
  hreflangTags: { lang: string; url: string }[];
  crawlMethod: string;
  navMethod?: string;
  crawlError?: string;
}> {
  const response = await fetch(`${BACKEND_URL}/api/crawl`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`Error del servidor de crawling: ${(err as { error: string }).error}`);
  }

  return response.json();
}

/**
 * Step 2: Use Gemini only for content interpretation — generating contentSummary
 * and inferring navigationItems from the real H2/H3 headings and page title.
 * This keeps Gemini useful without inventing any SEO data.
 */
async function interpretWithGemini(
  url: string,
  realData: { title: string; metaDescription: string; h1: string; h2s: string[]; h3s: string[] },
  contextTerms: string[],
): Promise<{ contentSummary: string }> {
  if (!API_KEY) {
    throw new Error("API_KEY is not set. Please ensure it's configured in your environment.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `Actúa como un analista SEO senior. A continuación tienes los datos reales extraídos de la página "${url}":

- Título: "${realData.title}"
- Meta descripción: "${realData.metaDescription}"
- H1: "${realData.h1}"
- H2s: ${JSON.stringify(realData.h2s)}
- H3s: ${JSON.stringify(realData.h3s)}

Términos de búsqueda relevantes del sector: ${contextTerms.join(', ') || 'N/A'}

Con base en estos datos reales, escribe un resumen conciso (2-3 frases) del contenido y propósito de esta página.

Tu ÚNICA salida debe ser un objeto JSON perfectamente válido con exactamente esta propiedad: "contentSummary" (string).`;

  const schema: FunctionDeclaration['parameters'] = {
    type: Type.OBJECT,
    properties: {
      contentSummary: { type: Type.STRING, description: 'Concise summary of page content and purpose.' },
    },
    required: ['contentSummary'],
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.3,
    },
  });

  const jsonStr = response.text.trim();
  const cleaned = cleanMalformedJson(jsonStr);
  return JSON.parse(cleaned);
}

/**
 * Main website analysis function.
 * Replaces the old simulation-only approach:
 * 1. Crawls the URL for real SEO data (backend)
 * 2. Uses Gemini only for content interpretation & navigation inference
 */
export const analyzeWebsite = async (
  url: string,
  contextTerms: string[],
): Promise<WebsiteAnalysis> => {
  // Step 1: Real crawl
  const crawlData = await crawlPage(url);

  // Step 2: Gemini interpretation (content summary + navigation)
  // We attempt this but gracefully degrade if it fails
  let geminiData: { contentSummary: string } = { contentSummary: '' };
  try {
    geminiData = await interpretWithGemini(
      url,
      {
        title: crawlData.title,
        metaDescription: crawlData.metaDescription,
        h1: crawlData.h1,
        h2s: crawlData.h2s,
        h3s: crawlData.h3s,
      },
      contextTerms,
    );
  } catch (err) {
    console.warn(`[gemini] Interpretation failed for ${url}:`, err);
    // Non-fatal: we still return the real crawl data
  }

  return {
    url,
    title: crawlData.title,
    metaDescription: crawlData.metaDescription,
    h1: crawlData.h1,
    h2s: crawlData.h2s,
    h3s: crawlData.h3s,
    schemaMarkup: crawlData.schemaMarkup,
    hreflangTags: crawlData.hreflangTags,
    structuredDataTypes: extractStructuredDataTypes(crawlData.schemaMarkup),
    contentSummary: geminiData.contentSummary,
    // Use real nav items from the crawler (flat first-level list)
    navigationItems: crawlData.navLinks ?? [],
    crawlMethod: crawlData.crawlMethod as 'fetch' | 'playwright' | 'failed',
    crawlError: crawlData.crawlError,
    comparisonPages: {},
  };
};

/**
 * Generates benchmark insights by comparing the user's website analysis with competitors'.
 * Uses a more capable model for complex reasoning.
 * This function is unchanged — it still works with real WebsiteAnalysis data.
 */
export const getBenchmarkInsights = async (
  userSite: WebsiteAnalysis,
  competitors: WebsiteAnalysis[],
  contextTerms: string[],
): Promise<BenchmarkResult> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not set. Please ensure it's configured in your environment.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const benchmarkResultSchema: FunctionDeclaration['parameters'] = {
    type: Type.OBJECT,
    properties: {
      summaryInsights: { type: Type.STRING, description: 'Markdown formatted summary of overall insights.' },
      sectionGaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List of missing or underdeveloped sections compared to competitors.' },
      contentGaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List of missing or underdeveloped content topics/keywords compared to competitors.' },
      suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'General SEO suggestions for improvement.' },
      contentRecommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Specific content recommendations based on gaps.' },
      keywordAnalysis: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            keyword: { type: Type.STRING },
            performance: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  siteUrl: { type: Type.STRING },
                  inTitle: { type: Type.BOOLEAN },
                  inH1: { type: Type.BOOLEAN },
                  inH2: { type: Type.BOOLEAN },
                  inMeta: { type: Type.BOOLEAN },
                  contentRelevance: { type: Type.STRING, enum: ['high', 'medium', 'low', 'none'] },
                },
                required: ['siteUrl', 'inTitle', 'inH1', 'inH2', 'inMeta', 'contentRelevance'],
              },
            },
          },
          required: ['keyword', 'performance'],
        },
        description: 'Detailed analysis of how each keyword is used across all analyzed sites.',
      },
    },
    required: ['summaryInsights', 'sectionGaps', 'contentGaps', 'suggestions', 'contentRecommendations', 'keywordAnalysis'],
  };

  const prompt = `Como estratega SEO altamente experimentado, analiza los datos REALES de los sitios web proporcionados (extraídos directamente de sus páginas, no inventados).
  Tu objetivo es realizar un benchmark competitivo entre el 'userSite' y los 'competitors'.

  Análisis del Sitio del Usuario:
  ${JSON.stringify(userSite, null, 2)}

  Análisis de Sitios Competidores:
  ${JSON.stringify(competitors, null, 2)}

  Términos de Búsqueda Contextuales: ${contextTerms.join(', ') || 'None provided'}

  Basado en los datos anteriores, identifica:
  1.  **Resumen de Insights**: Proporciona un resumen exhaustivo, formateado en Markdown, de los hallazgos clave, fortalezas, debilidades y el posicionamiento competitivo general del sitio del usuario. **Importante: Si se proporcionaron términos de búsqueda, incluye un análisis de cómo se posiciona el usuario frente a los competidores para esos términos específicos.**
  2.  **Gaps de Secciones**: Enumera las secciones específicas del sitio web que el sitio del usuario podría estar perdiendo o donde los competidores tienen una clara ventaja.
  3.  **Gaps de Contenido**: Enumera temas de contenido específicos, palabras clave o tipos de información que los competidores cubren pero que el sitio del usuario carece.
  4.  **Sugerencias Generales**: Proporciona sugerencias SEO accionables para el sitio del usuario.
  5.  **Recomendaciones de Contenido Específicas**: Sugiere ideas de contenido concretas basadas en los gaps identificados.
  6.  **Análisis de Keywords**: Para cada uno de los 'Términos de Búsqueda Contextuales' proporcionados, evalúa su presencia y optimización en CADA uno de los sitios (usuario y competidores). 
      - inTitle: ¿Está la keyword (o variaciones muy cercanas) en el title?
      - inH1: ¿Está la keyword en el H1?
      - inH2: ¿Está la keyword en alguno de los H2?
      - inMeta: ¿Está en la meta descripción?
      - contentRelevance: Basado en el 'contentSummary' y los encabezados, ¿qué tan relevante es el contenido para esta keyword? (high, medium, low, none).

  Tu ÚNICA salida debe ser un objeto JSON que se ajuste estrictamente al esquema proporcionado.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: benchmarkResultSchema,
        temperature: 0.3,
      },
    });

    const jsonStr = response.text.trim();
    const cleanedJsonStr = cleanMalformedJson(jsonStr);
    const result: BenchmarkResult = JSON.parse(cleanedJsonStr);
    return result;
  } catch (error) {
    console.error('Error generating benchmark insights:', error);
    throw new Error(`Error al generar los insights del benchmark: ${error instanceof Error ? error.message : String(error)}`);
  }
};