// types.ts

export interface HreflangTag {
  lang: string;
  url: string;
}

export interface WebsiteAnalysis {
  url: string;
  title: string;
  metaDescription: string;
  h1: string;
  h2s: string[];
  h3s: string[];
  navigationItems: string[];
  // Real data: parsed JSON-LD schema objects from the crawled page
  schemaMarkup: object[];
  // Real data: hreflang link tags from the crawled page
  hreflangTags: HreflangTag[];
  // Derived from schemaMarkup for backward compatibility with existing components
  structuredDataTypes: string[];
  contentSummary: string; // Gemini's summary of page content
  // How the page was crawled (for UI transparency)
  crawlMethod?: 'fetch' | 'playwright' | 'failed';
  crawlError?: string;
  comparisonPages: {
    serviceProductUrl?: string;
    serviceProductTitle?: string;
    serviceProductMetaDescription?: string;
    serviceProductH1?: string;
    serviceProductH2s?: string[];
    serviceProductH3s?: string[];
    serviceProductStructuredDataTypes?: string[];
  };
}

export interface KeywordPerformance {
  siteUrl: string;
  inTitle: boolean;
  inH1: boolean;
  inH2: boolean;
  inMeta: boolean;
  contentRelevance: 'high' | 'medium' | 'low' | 'none';
}

export interface KeywordAnalysis {
  keyword: string;
  performance: KeywordPerformance[];
}

export interface BenchmarkResult {
  summaryInsights: string; // Markdown formatted
  sectionGaps: string[];
  contentGaps: string[];
  suggestions: string[];
  contentRecommendations: string[]; // New field for specific content suggestions
  keywordAnalysis?: KeywordAnalysis[]; // New field for keyword-specific analysis
}

export interface ApiResponseError {
  message: string;
}