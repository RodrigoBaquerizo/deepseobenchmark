// components/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Cargando...' }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12">
      {/* Spinner ring */}
      <div className="relative w-14 h-14">
        {/* Outer track */}
        <div className="absolute inset-0 rounded-full border-4 border-primary-light"></div>
        {/* Spinning arc */}
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"
          style={{ animationDuration: '800ms' }}
        ></div>
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-primary opacity-60"></div>
        </div>
      </div>

      {/* Message */}
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-text-primary">{message}</p>
        <p className="text-xs text-text-secondary">Esto puede tardar unos segundos…</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
