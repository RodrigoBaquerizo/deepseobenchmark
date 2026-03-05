// components/GapsAndInsights.tsx
import React from 'react';
import { BenchmarkResult } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import KeywordAnalysis from './KeywordAnalysis';

interface GapsAndInsightsProps {
  results: BenchmarkResult;
}

// ── Icons ────────────────────────────────────────────────────────────────────

const StarAIIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);

const AlertIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TargetIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);

// ── Chip ────────────────────────────────────────────────────────────────────

const Chip: React.FC<{ text: string; variant?: 'blue' | 'orange' }> = ({ text, variant = 'blue' }) => {
  const styles = {
    blue: 'bg-primary-light text-primary hover:bg-indigo-100',
    orange: 'bg-orange-50 text-orange-700 hover:bg-orange-100',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium transition-colors duration-150 cursor-default ${variant === 'blue' ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
      }`}>
      {text}
    </span>
  );
};

// ── Main export ─────────────────────────────────────────────────────────────

const GapsAndInsights: React.FC<GapsAndInsightsProps> = ({ results }) => {
  return (
    <div className="space-y-4">
      {/* ── Keyword Matrix ── */}
      {results.keywordAnalysis && results.keywordAnalysis.length > 0 && (
        <KeywordAnalysis keywordAnalysis={results.keywordAnalysis} />
      )}

      {/* ── AI Summary card — inspired by "Google AI Overview" block ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all duration-200">

        {/* Header row */}
        <div className="flex items-start gap-3 p-5 pb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
            <StarAIIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-base">Análisis de Gaps e Insights SEO</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mt-0.5">Análisis IA</p>
          </div>
        </div>

        {/* Summary body */}
        <div className="px-5 pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary mb-2">Resumen de la IA</p>
          <div className="border-l-4 border-indigo-600 pl-4 py-1">
            <MarkdownRenderer content={results.summaryInsights} className="text-sm text-text-primary leading-relaxed" />
          </div>
        </div>
      </div>

      {/* ── Section gaps ── */}
      {results.sectionGaps.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border-light shadow-sm hover:shadow-md hover:border-border-indigo transition-all duration-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertIcon className="w-4 h-4 text-orange-500" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Gaps de Secciones</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {results.sectionGaps.map((gap, i) => (
              <Chip key={i} text={gap} variant="orange" />
            ))}
          </div>
        </div>
      )}

      {/* ── Content gaps ── */}
      {results.contentGaps.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertIcon className="w-4 h-4 text-primary" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Gaps de Contenido</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {results.contentGaps.map((gap, i) => (
              <Chip key={i} text={gap} variant="blue" />
            ))}
          </div>
        </div>
      )}

      {/* ── Suggestions — "Estrategia SEO Sugerida" style ── */}
      {results.suggestions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckIcon className="w-4 h-4 text-success" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Sugerencias Generales</p>
          </div>
          <ol className="space-y-2">
            {results.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-text-primary">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── Content recommendations ── */}
      {results.contentRecommendations.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TargetIcon className="w-4 h-4 text-primary" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Recomendaciones de Contenido</p>
          </div>
          {/* Bordered-left style — like "Estrategia SEO Sugerida" meta title block */}
          <div className="space-y-3">
            {results.contentRecommendations.map((rec, i) => (
              <div key={i} className="border-l-4 border-indigo-600 pl-3 py-0.5">
                <p className="text-sm text-text-primary leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default GapsAndInsights;