import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  error?: string | null;
  onRetry?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Preparing your workspace...',
  error = null,
  onRetry
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-[#F0F7FF] dark:bg-[#0B1320] transition-colors duration-300 selection:bg-[#3563E9]/20"
      style={{ minHeight: '100dvh' }}
    >
      {/* Soft radial glow behind brand */}
      <div
        aria-hidden="true"
        className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-[#3563E9]/10 dark:bg-[#3563E9]/15 blur-3xl pointer-events-none -translate-y-4"
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full animate-fade-in">
        {/* Brand Logo with gentle hover/floating style */}
        <div className="relative mb-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/80 dark:bg-[#121E31]/80 shadow-[0_8px_24px_rgba(53,99,233,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] border border-[#E1E7EF]/80 dark:border-[#1F2E45]/80 p-2.5 flex items-center justify-center backdrop-blur-md">
            <img
              src="/logo.png"
              alt="LandDelay AI"
              className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(53,99,233,0.3)] select-none"
            />
          </div>
        </div>

        {/* Brand Typography & Tiny AI Badge */}
        <div className="flex items-center justify-center gap-1.5 mb-1.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033] dark:text-[#F1F5F9] font-sans">
            LandDelay
          </h1>
          <span className="inline-flex items-center justify-center text-[9px] leading-none px-1.5 py-0.5 rounded bg-[#3563E9]/15 text-[#3563E9] dark:text-[#60A5FA] font-mono font-medium border border-[#3563E9]/30 tracking-wide select-none">
            AI
          </span>
        </div>

        {/* Muted Subtitle */}
        <p className="text-xs text-[#687386] dark:text-[#94A3B8] font-normal tracking-normal mb-7">
          Predictive Delay Analytics
        </p>

        {/* State: Error with Retry OR Cute Smooth Loading Indicator */}
        {error ? (
          <div className="w-full bg-white dark:bg-[#121E31] border border-[#FECACA] dark:border-[#DC3545]/40 rounded-xl p-4 shadow-sm flex flex-col items-center gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#DC3545]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Failed to initialize workspace</span>
            </div>
            <p className="text-xs text-[#687386] dark:text-[#94A3B8] leading-relaxed break-words text-center px-1">
              {error}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3563E9] hover:bg-[#2B52C6] text-white text-xs font-medium transition-colors shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-[#3563E9]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3.5">
            {/* Cute smooth 3-dot pulse animation */}
            <div className="flex items-center gap-1.5 h-3" aria-hidden="true">
              <span className="w-2 h-2 rounded-full bg-[#3563E9] animate-dot-bounce [animation-delay:-0.32s]" />
              <span className="w-2 h-2 rounded-full bg-[#3563E9] animate-dot-bounce [animation-delay:-0.16s]" />
              <span className="w-2 h-2 rounded-full bg-[#3563E9] animate-dot-bounce" />
            </div>

            {/* Status message */}
            <p className="text-xs font-medium text-[#687386] dark:text-[#94A3B8] tracking-wide animate-pulse">
              {message}
            </p>
          </div>
        )}
      </div>

      {/* Subtle bottom statutory indicator */}
      <footer className="absolute bottom-4 text-center text-[11px] text-[#94A3B8] dark:text-[#64748B]">
        Infrastructure Intelligence &bull; Statutory Decision Support
      </footer>
    </div>
  );
};
