// App.tsx
import React, { useState, useCallback } from 'react';
import { analyzeWebsite, getBenchmarkInsights } from './services/geminiService';
import { BenchmarkResult, WebsiteAnalysis, ApiResponseError } from './types';
import LoadingSpinner from './components/LoadingSpinner';
import GapsAndInsights from './components/GapsAndInsights';
import BenchmarkResultsDisplay from './components/BenchmarkResultsDisplay';

// ── Icons ────────────────────────────────────────────────────────────────────

const LogoIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="9" height="9" rx="2" fill="currentColor" opacity="0.9" />
    <rect x="13" y="2" width="9" height="9" rx="2" fill="currentColor" opacity="0.6" />
    <rect x="2" y="13" width="9" height="9" rx="2" fill="currentColor" opacity="0.6" />
    <rect x="13" y="13" width="9" height="9" rx="2" fill="currentColor" opacity="0.3" />
  </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChevronIcon: React.FC<{ open: boolean; className?: string }> = ({ open, className = 'w-4 h-4' }) => (
  <svg
    className={`${className} transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ── Main App ─────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const [userSiteUrl, setUserSiteUrl] = useState<string>('');
  const [competitorUrls, setCompetitorUrls] = useState<string[]>(['']);
  const [searchTerms, setSearchTerms] = useState<string>('');
  const [userSiteAnalysis, setUserSiteAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [competitorAnalyses, setCompetitorAnalyses] = useState<WebsiteAnalysis[]>([]);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [accordionOpen, setAccordionOpen] = useState<boolean>(false);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAddCompetitor = useCallback(() => {
    if (competitorUrls.length < 5) setCompetitorUrls(prev => [...prev, '']);
  }, [competitorUrls.length]);

  const handleRemoveCompetitor = useCallback((index: number) => {
    setCompetitorUrls(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleCompetitorUrlChange = useCallback((index: number, value: string) => {
    setCompetitorUrls(prev => {
      const next = [...prev]; next[index] = value; return next;
    });
  }, []);

  const validateUrl = (url: string) => {
    if (url.startsWith('/')) return true;
    try { new URL(url); return true; } catch { return false; }
  };

  const handleAnalyze = useCallback(async () => {
    setError(null);
    setLoading(true);
    setUserSiteAnalysis(null);
    setCompetitorAnalyses([]);
    setBenchmarkResults(null);

    const validUserSiteUrl = userSiteUrl.trim();
    const validCompetitorUrls = competitorUrls.filter(url => url.trim() !== '');

    if (!validUserSiteUrl) {
      setError('Por favor, introduce el dominio o subdirectorio de tu web.');
      setLoading(false); return;
    }
    if (!validateUrl(validUserSiteUrl)) {
      setError("El dominio de tu web no es válido. Debe empezar por 'http://', 'https://' o '/'.");
      setLoading(false); return;
    }
    if (validCompetitorUrls.length === 0) {
      setError('Por favor, introduce al menos un dominio de competidor.');
      setLoading(false); return;
    }
    const invalidUrl = validCompetitorUrls.find(url => !validateUrl(url));
    if (invalidUrl) {
      setError(`El dominio '${invalidUrl}' no es válido.`);
      setLoading(false); return;
    }

    const cleanedTerms = searchTerms.split(',').map(t => t.trim()).filter(Boolean);

    try {
      const userAnalysis = await analyzeWebsite(validUserSiteUrl, cleanedTerms);
      setUserSiteAnalysis(userAnalysis);
      const competitorsData = await Promise.all(validCompetitorUrls.map(url => analyzeWebsite(url, cleanedTerms)));
      setCompetitorAnalyses(competitorsData);
      const benchmark = await getBenchmarkInsights(userAnalysis, competitorsData, cleanedTerms);
      setBenchmarkResults(benchmark);
    } catch (e) {
      const err = e as ApiResponseError;
      setError(`Error al realizar el análisis: ${err.message || 'Ha ocurrido un error inesperado.'}`);
    } finally {
      setLoading(false);
    }
  }, [userSiteUrl, competitorUrls, searchTerms]);

  const hasResults = !loading && userSiteAnalysis && competitorAnalyses.length > 0 && benchmarkResults;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm transition-transform duration-150 group-hover:scale-105">
              <LogoIcon className="w-4 h-4" />
            </div>
            <span className="font-bold text-gray-900 text-base tracking-tight">Deep SEO Benchmark</span>
            <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded tracking-wider">V1.0</span>
          </div>
        </div>
      </nav>



      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* ── Hero / Input section ─────────────────────────────────────────── */}
        <section className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            Deep SEO Benchmark
          </h1>
          <p className="text-text-secondary text-base">
            Compara tu web con tus competidores usando análisis de inteligencia artificial.
          </p>
        </section>

        {/* ── Input card ──────────────────────────────────────────────────── */}
        <section className="bg-surface rounded-2xl shadow-sm border border-border-light overflow-hidden">

          {/* Main URL row */}
          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <label htmlFor="userSiteUrl" className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-2">
                Tu web
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <SearchIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="userSiteUrl"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 transition-all duration-150"
                    value={userSiteUrl}
                    onChange={e => setUserSiteUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                    placeholder="https://ejemplo.com"
                  />
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="flex-shrink-0 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-indigo-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                >
                  {loading ? 'Analizando…' : 'Analizar'}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* ── Accordion: Competidores + Términos ────────────────────────── */}
          <div className="border-t border-gray-100">
            <button
              onClick={() => setAccordionOpen(o => !o)}
              className="w-full flex items-center justify-between px-5 sm:px-6 py-3 text-sm font-medium text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-150"
            >
              <span>Competidores y términos de búsqueda</span>
              <ChevronIcon open={accordionOpen} className="w-4 h-4" />
            </button>

            {accordionOpen && (
              <div className="px-5 sm:px-6 pb-6 pt-4 space-y-5 border-t border-gray-100 bg-gray-50">

                {/* Competitor URLs */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">
                    Competidores <span className="normal-case font-normal">(mín. 1 · máx. 5)</span>
                  </label>
                  <div className="space-y-2">
                    {competitorUrls.map((url, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 transition-all duration-150"
                          value={url}
                          onChange={e => handleCompetitorUrlChange(index, e.target.value)}
                          placeholder={`https://competidor${index + 1}.com`}
                        />
                        {competitorUrls.length > 1 && (
                          <button
                            onClick={() => handleRemoveCompetitor(index)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-150"
                            aria-label="Eliminar competidor"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {competitorUrls.length < 5 && (
                    <button
                      onClick={handleAddCompetitor}
                      className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors duration-150"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      Añadir competidor
                    </button>
                  )}
                </div>

                {/* Search terms */}
                <div>
                  <label htmlFor="searchTerms" className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-2">
                    Términos de búsqueda <span className="normal-case font-normal">(opcional · separados por comas)</span>
                  </label>
                  <input
                    type="text"
                    id="searchTerms"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 transition-all duration-150"
                    value={searchTerms}
                    onChange={e => setSearchTerms(e.target.value)}
                    placeholder="SEO, marketing digital, desarrollo web"
                  />
                </div>

              </div>
            )}
          </div>
        </section>

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex justify-center">
            <LoadingSpinner message="Analizando con IA…" />
          </div>
        )}

        {/* ── Results ─────────────────────────────────────────────────────── */}
        {hasResults && (
          <section className="space-y-8">

            {/* Section header */}
            <div className="flex items-center gap-3">
              <LogoIcon className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Resultados del Benchmark</h2>
            </div>

            <BenchmarkResultsDisplay
              userSite={userSiteAnalysis!}
              competitors={competitorAnalyses}
            />

            <GapsAndInsights results={benchmarkResults!} />
          </section>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border-light bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-text-muted">
          <span>© {new Date().getFullYear()} Deep SEO Benchmark</span>
          <span>Desarrollado con Gemini API</span>
        </div>
      </footer>
    </div>
  );
};

export default App;