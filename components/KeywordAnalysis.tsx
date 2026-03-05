import React from 'react';
import { KeywordAnalysis as KeywordAnalysisType } from '../types';

interface Props {
    keywordAnalysis: KeywordAnalysisType[];
}

const RelevanceBadge: React.FC<{ relevance: string }> = ({ relevance }) => {
    const colors = {
        high: 'bg-green-100 text-green-700 border-green-200',
        medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        low: 'bg-orange-100 text-orange-700 border-orange-200',
        none: 'bg-red-100 text-red-700 border-red-200',
    };

    const labels = {
        high: 'Alta',
        medium: 'Media',
        low: 'Baja',
        none: 'Nula',
    };

    const colorClass = colors[relevance as keyof typeof colors] || colors.none;
    const label = labels[relevance as keyof typeof labels] || labels.none;

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colorClass}`}>
            {label}
        </span>
    );
};

const CheckIcon: React.FC<{ checked: boolean }> = ({ checked }) => (
    checked ? (
        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    ) : (
        <svg className="w-4 h-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    )
);

const KeywordAnalysis: React.FC<Props> = ({ keywordAnalysis }) => {
    if (!keywordAnalysis || keywordAnalysis.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    Matriz de Optimización de Keywords
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white text-[11px] font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                            <th className="px-6 py-4 font-bold text-gray-900">Keyword</th>
                            {keywordAnalysis[0].performance.map((p, i) => (
                                <th key={i} className="px-6 py-4 min-w-[150px]">
                                    <div className="flex flex-col">
                                        <span className="text-indigo-600 truncate max-w-[140px]" title={p.siteUrl}>
                                            {p.siteUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                                        </span>
                                        <span className="text-[9px] font-normal text-gray-400">
                                            {i === 0 ? 'Tu Sitio' : `Competidor ${i}`}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {keywordAnalysis.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="text-sm font-medium text-gray-900 bg-indigo-50 px-2 py-1 rounded-lg">
                                        {item.keyword}
                                    </span>
                                </td>
                                {item.performance.map((p, i) => (
                                    <td key={i} className="px-6 py-4">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <CheckIcon checked={p.inTitle} />
                                                    <span className="text-[8px] font-bold text-gray-400">TITLE</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <CheckIcon checked={p.inH1} />
                                                    <span className="text-[8px] font-bold text-gray-400">H1</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <CheckIcon checked={p.inH2} />
                                                    <span className="text-[8px] font-bold text-gray-400">H2</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <CheckIcon checked={p.inMeta} />
                                                    <span className="text-[8px] font-bold text-gray-400">META</span>
                                                </div>
                                            </div>
                                            <div className="mt-1">
                                                <RelevanceBadge relevance={p.contentRelevance} />
                                            </div>
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                <p className="text-[10px] text-gray-500 flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Este análisis evalúa la presencia exacta o semántica de las keywords en los elementos clave y la relevancia del contenido interpretado por IA.
                </p>
            </div>
        </div>
    );
};

export default KeywordAnalysis;
