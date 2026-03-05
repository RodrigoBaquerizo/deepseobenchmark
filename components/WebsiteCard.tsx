// components/WebsiteCard.tsx
import React from 'react';
import { WebsiteAnalysis } from '../types';

interface WebsiteCardProps {
  analysis: WebsiteAnalysis;
  isUserSite?: boolean;
}

const WebsiteCard: React.FC<WebsiteCardProps> = ({ analysis, isUserSite = false }) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${isUserSite ? 'border-2 border-primary-blue' : 'border border-accent-gray'}`}>
      <h3 className={`text-xl font-bold mb-4 ${isUserSite ? 'text-primary-blue' : 'text-text-dark'}`}>
        {isUserSite ? `Mi Web: ${analysis.url}` : `Competidor: ${analysis.url}`}
      </h3>
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-lg mb-1">Resumen de Contenido:</h4>
          <p className="text-sm text-gray-700">{analysis.contentSummary}</p>
        </div>
        <div>
          <h4 className="font-semibold text-lg mb-1">Elementos SEO (Home/Subdirectorio):</h4>
          <ul className="list-disc list-inside text-sm text-gray-700">
            <li><strong>Título:</strong> {analysis.title}</li>
            <li><strong>Meta Descripción:</strong> {analysis.metaDescription}</li>
            <li><strong>H1:</strong> {analysis.h1}</li>
            <li><strong>H2s:</strong> {analysis.h2s.join(', ') || 'N/A'}</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-lg mb-1">Navegación:</h4>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {analysis.navigationItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-lg mb-1">Datos Estructurados:</h4>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {analysis.structuredDataTypes.map((type, index) => (
              <li key={index}>{type}</li>
            ))}
          </ul>
        </div>

        {analysis.comparisonPages && analysis.comparisonPages.serviceProductUrl && (
          <div className="border-t border-accent-gray pt-4 mt-4">
            <h4 className="font-semibold text-lg mb-2">Página comparable (Servicio/Producto):</h4>
            <ul className="list-disc list-inside text-sm text-gray-700">
              <li><strong>URL:</strong> <a href={analysis.comparisonPages.serviceProductUrl} target="_blank" rel="noopener noreferrer" className="text-primary-blue hover:underline">{analysis.comparisonPages.serviceProductUrl}</a></li>
              <li><strong>Título:</strong> {analysis.comparisonPages.serviceProductTitle || 'N/A'}</li>
              <li><strong>Meta Descripción:</strong> {analysis.comparisonPages.serviceProductMetaDescription || 'N/A'}</li>
              <li><strong>H1:</strong> {analysis.comparisonPages.serviceProductH1 || 'N/A'}</li>
              <li><strong>H2s:</strong> {analysis.comparisonPages.serviceProductH2s?.join(', ') || 'N/A'}</li>
              <li><strong>Datos Estructurados:</strong> {analysis.comparisonPages.serviceProductStructuredDataTypes?.join(', ') || 'N/A'}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebsiteCard;