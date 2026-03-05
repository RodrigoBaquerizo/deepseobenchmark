// components/BenchmarkResultsDisplay.tsx
import React from 'react';
import { WebsiteAnalysis } from '../types';

interface BenchmarkResultsDisplayProps {
  userSite: WebsiteAnalysis;
  competitors: WebsiteAnalysis[];
}

// ── Metric comparison card ──────────────────────────────────────────────────

interface MetricCardProps {
  iconLabel: string;
  metricLabel: string;
  userValue: string | string[] | undefined;
  competitorValues: (string | string[] | undefined)[];
  isUrl?: boolean;
  userSiteUrl: string;
  competitorUrls: string[];
}

const MetricComparisonCard: React.FC<MetricCardProps> = ({
  iconLabel,
  metricLabel,
  userValue,
  competitorValues,
  isUrl = false,
  userSiteUrl,
  competitorUrls,
}) => {
  const renderContent = (content: string | string[] | undefined) => {
    if (isUrl && typeof content === 'string') {
      return (
        <a
          href={content}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 text-xs break-all hover:text-indigo-800 hover:underline transition-colors"
        >
          {content}
        </a>
      );
    } else if (Array.isArray(content)) {
      return content.length > 0 ? (
        <ul className="space-y-0.5">
          {content.map((item, idx) => (
            <li key={idx} className="text-xs text-text-primary flex items-start gap-1">
              <span className="mt-1 w-1 h-1 rounded-full bg-text-muted flex-shrink-0"></span>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-xs text-text-muted italic">N/A</span>
      );
    }
    return <p className="text-xs text-text-primary leading-relaxed">{content || <span className="italic text-text-muted">N/A</span>}</p>;
  };

  const formatUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 overflow-hidden">
      {/* Card label header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{iconLabel}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-700">{metricLabel}</span>
      </div>

      {/* Columns: user + competitors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border-light border-t border-gray-100">
        {/* User site */}
        <div className="bg-indigo-50 border-l-4 border-indigo-600 px-4 py-3">
          <div className="mb-1.5 min-w-0">
            <p className="text-indigo-600 text-[10px] font-bold truncate" title={userSiteUrl}>
              {formatUrl(userSiteUrl)}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-400">Mi Web</p>
          </div>
          {renderContent(userValue)}
        </div>

        {/* Competitors */}
        {competitorValues.map((val, idx) => (
          <div
            key={idx}
            className="bg-surface px-4 py-3 hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="mb-1.5 min-w-0">
              <p className="text-gray-600 text-[10px] font-bold truncate" title={competitorUrls[idx]}>
                {formatUrl(competitorUrls[idx])}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                Competidor {idx + 1}
              </p>
            </div>
            {renderContent(val)}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Section title ───────────────────────────────────────────────────────────

const SectionTitle: React.FC<{ title: string; icon?: string }> = ({ title, icon = '◆' }) => (
  <div className="flex items-center gap-2 mt-6 mb-3">
    <span className="text-indigo-600 text-xs">{icon}</span>
    <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{title}</h4>
  </div>
);


// ── Main export ─────────────────────────────────────────────────────────────

const BenchmarkResultsDisplay: React.FC<BenchmarkResultsDisplayProps> = ({ userSite, competitors }) => {
  const competitorUrls = competitors.map(c => c.url);

  return (
    <div className="space-y-4">

      {/* ── SEO Elements section ── */}
      <SectionTitle title="Elementos SEO — Home / Subdirectorio" />

      <MetricComparisonCard
        iconLabel="📝"
        metricLabel="Título"
        userValue={userSite.title}
        competitorValues={competitors.map(c => c.title)}
        userSiteUrl={userSite.url}
        competitorUrls={competitorUrls}
      />
      <MetricComparisonCard
        iconLabel="🔍"
        metricLabel="Meta Descripción"
        userValue={userSite.metaDescription}
        competitorValues={competitors.map(c => c.metaDescription)}
        userSiteUrl={userSite.url}
        competitorUrls={competitorUrls}
      />
      <MetricComparisonCard
        iconLabel="H1"
        metricLabel="Encabezado Principal"
        userValue={userSite.h1}
        competitorValues={competitors.map(c => c.h1)}
        userSiteUrl={userSite.url}
        competitorUrls={competitorUrls}
      />
      <MetricComparisonCard
        iconLabel="H2"
        metricLabel="Subencabezados"
        userValue={userSite.h2s}
        competitorValues={competitors.map(c => c.h2s)}
        userSiteUrl={userSite.url}
        competitorUrls={competitorUrls}
      />

      <SectionTitle title="Contenido y Arquitectura" />

      <MetricComparisonCard
        iconLabel="📖"
        metricLabel="Resumen de Contenido"
        userValue={userSite.contentSummary}
        competitorValues={competitors.map(c => c.contentSummary)}
        userSiteUrl={userSite.url}
        competitorUrls={competitorUrls}
      />
      <MetricComparisonCard
        iconLabel="🧭"
        metricLabel="Navegación"
        userValue={userSite.navigationItems}
        competitorValues={competitors.map(c => c.navigationItems)}
        userSiteUrl={userSite.url}
        competitorUrls={competitorUrls}
      />

      <SectionTitle title="Datos Estructurados" />

      <MetricComparisonCard
        iconLabel="⚙️"
        metricLabel="Schema Markup"
        userValue={userSite.structuredDataTypes}
        competitorValues={competitors.map(c => c.structuredDataTypes)}
        userSiteUrl={userSite.url}
        competitorUrls={competitorUrls}
      />

      {/* ── Comparable pages section ── */}
      {(userSite.comparisonPages?.serviceProductUrl || competitors.some(c => c.comparisonPages?.serviceProductUrl)) && (
        <>
          <SectionTitle title="Página Comparable (Servicio / Producto)" />
          <MetricComparisonCard
            iconLabel="🔗"
            metricLabel="URL"
            userValue={userSite.comparisonPages?.serviceProductUrl}
            competitorValues={competitors.map(c => c.comparisonPages?.serviceProductUrl)}
            isUrl
            userSiteUrl={userSite.url}
            competitorUrls={competitorUrls}
          />
          <MetricComparisonCard
            iconLabel="📝"
            metricLabel="Título"
            userValue={userSite.comparisonPages?.serviceProductTitle}
            competitorValues={competitors.map(c => c.comparisonPages?.serviceProductTitle)}
            userSiteUrl={userSite.url}
            competitorUrls={competitorUrls}
          />
          <MetricComparisonCard
            iconLabel="🔍"
            metricLabel="Meta Descripción"
            userValue={userSite.comparisonPages?.serviceProductMetaDescription}
            competitorValues={competitors.map(c => c.comparisonPages?.serviceProductMetaDescription)}
            userSiteUrl={userSite.url}
            competitorUrls={competitorUrls}
          />
          <MetricComparisonCard
            iconLabel="H1"
            metricLabel="H1"
            userValue={userSite.comparisonPages?.serviceProductH1}
            competitorValues={competitors.map(c => c.comparisonPages?.serviceProductH1)}
            userSiteUrl={userSite.url}
            competitorUrls={competitorUrls}
          />
          <MetricComparisonCard
            iconLabel="H2"
            metricLabel="H2s"
            userValue={userSite.comparisonPages?.serviceProductH2s}
            competitorValues={competitors.map(c => c.comparisonPages?.serviceProductH2s)}
            userSiteUrl={userSite.url}
            competitorUrls={competitorUrls}
          />
          <MetricComparisonCard
            iconLabel="⚙️"
            metricLabel="Datos Estructurados"
            userValue={userSite.comparisonPages?.serviceProductStructuredDataTypes}
            competitorValues={competitors.map(c => c.comparisonPages?.serviceProductStructuredDataTypes)}
            userSiteUrl={userSite.url}
            competitorUrls={competitorUrls}
          />
        </>
      )}
    </div>
  );
};

export default BenchmarkResultsDisplay;