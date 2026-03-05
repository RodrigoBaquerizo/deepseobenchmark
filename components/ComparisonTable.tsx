// components/ComparisonTable.tsx
import React from 'react';
import { WebsiteAnalysis } from '../types';

interface ComparisonTableProps {
  userSite: WebsiteAnalysis;
  competitors: WebsiteAnalysis[];
}

const COMMON_H_KEYWORDS = [
  'servicios',
  'productos',
  'soluciones',
  'equipo',
  'contacto',
  'precios',
  'características',
  'beneficios',
  'testimonios',
  'blog',
  'noticias',
  'faq',
  'sobre nosotros',
  'historia',
];

const hasKeyword = (headings: string[], keyword: string) => {
  return headings.some(h => h.toLowerCase().includes(keyword.toLowerCase()));
};

// This function is now specific for the table layout
const renderHeadingComparisonRows = (label: string, siteHeadings: string[][]) => {
  return (
    <React.Fragment>
      <tr>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-text-dark bg-light-lavender" colSpan={siteHeadings.length + 1}>
          {label}
        </td>
      </tr>
      {COMMON_H_KEYWORDS.map(keyword => (
        <tr key={keyword}>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 pl-8">- {keyword}</td>
          {siteHeadings.map((headings, siteIndex) => (
            <td key={siteIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
              {hasKeyword(headings, keyword) ? '✅' : '❌'}
            </td>
          ))}
        </tr>
      ))}
    </React.Fragment>
  );
};

const ComparisonTable: React.FC<ComparisonTableProps> = ({ userSite, competitors }) => {
  const allSites = [userSite, ...competitors];

  const homeMetrics = [
    { label: 'Título', getValue: (site: WebsiteAnalysis) => site.title },
    { label: 'Meta Descripción', getValue: (site: WebsiteAnalysis) => site.metaDescription },
    { label: 'H1', getValue: (site: WebsiteAnalysis) => site.h1 },
    { label: 'Nav. Items', getValue: (site: WebsiteAnalysis) => site.navigationItems.join(', ') || 'N/A' },
    { label: 'Datos Estructurados', getValue: (site: WebsiteAnalysis) => site.structuredDataTypes.join(', ') || 'N/A' },
  ];

  return (
    <div className="space-y-10">
      {/* Home/Subdirectory Section */}
      <section className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-xl font-bold text-text-dark mb-4">Análisis de Home/Subdirectorio</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allSites.map((site, index) => (
            <div key={site.url} className={`rounded-xl p-4 space-y-4 ${index === 0 ? 'bg-light-lavender border-2 border-primary-purple' : 'bg-gray-50 border'}`}>
              <div>
                <h4 className={`font-bold ${index === 0 ? 'text-primary-purple' : 'text-text-dark'}`}>
                  {index === 0 ? 'Tu Web' : `Competidor ${index}`}
                </h4>
                <p className="text-xs text-gray-500 break-all">{site.url}</p>
              </div>
              {homeMetrics.map(metric => (
                <div key={metric.label}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{metric.label}</p>
                  <p className="text-sm text-text-dark mt-1">{metric.getValue(site)}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Headings Comparison Table for Home */}
      <section className="overflow-x-auto bg-white p-6 rounded-xl shadow-sm">
         <h3 className="text-xl font-bold text-text-dark mb-4">Comparativa de Encabezados (Home)</h3>
        <table className="min-w-full divide-y divide-border-gray">
          <thead className="bg-light-lavender">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Keyword</th>
              {allSites.map((site, index) => (
                <th
                  key={site.url}
                  scope="col"
                  className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${index === 0 ? 'text-primary-purple' : 'text-text-dark'}`
                >
                  {index === 0 ? 'Tu Web' : `Comp. ${index}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-border-gray">
            {renderHeadingComparisonRows('H2s', allSites.map(site => site.h2s))}
            {renderHeadingComparisonRows('H3s', allSites.map(site => site.h3s))}
          </tbody>
        </table>
      </section>
      
      {/* Comparison Pages Section (Original Table) */}
      <section className="overflow-x-auto bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-xl font-bold text-text-dark mb-4">Análisis de Página Comparable (Servicio/Producto)</h3>
        <table className="min-w-full divide-y divide-border-gray">
            <thead className="bg-light-lavender">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Métrica</th>
                {allSites.map((site, index) => (
                  <th
                    key={site.url}
                    scope="col"
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${index === 0 ? 'text-primary-purple' : 'text-text-dark'}`
                  >
                    {index === 0 ? 'Tu Web' : `Comp. ${index}:`} <span className="block font-normal text-gray-500">{site.url}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border-gray">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-dark">Título (Comp. Page)</td>
                {allSites.map(site => <td key={site.url} className="px-6 py-4 text-sm text-gray-700">{site.comparisonPages?.serviceProductTitle || 'N/A'}</td>)}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-dark">Meta Desc. (Comp. Page)</td>
                {allSites.map(site => <td key={site.url} className="px-6 py-4 text-sm text-gray-700 max-w-xs overflow-hidden text-ellipsis">{site.comparisonPages?.serviceProductMetaDescription || 'N/A'}</td>)}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-dark">H1 (Comp. Page)</td>
                {allSites.map(site => <td key={site.url} className="px-6 py-4 text-sm text-gray-700">{site.comparisonPages?.serviceProductH1 || 'N/A'}</td>)}
              </tr>
              {renderHeadingComparisonRows('H2s (Comp. Page)', allSites.map(site => site.comparisonPages?.serviceProductH2s || []))}
              {renderHeadingComparisonRows('H3s (Comp. Page)', allSites.map(site => site.comparisonPages?.serviceProductH3s || []))}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-dark">Datos Estructurados (Comp. Page)</td>
                {allSites.map(site => <td key={site.url} className="px-6 py-4 text-sm text-gray-700 max-w-xs overflow-hidden text-ellipsis">{site.comparisonPages?.serviceProductStructuredDataTypes?.join(', ') || 'N/A'}</td>)}
              </tr>
            </tbody>
        </table>
      </section>
    </div>
  );
};

export default ComparisonTable;