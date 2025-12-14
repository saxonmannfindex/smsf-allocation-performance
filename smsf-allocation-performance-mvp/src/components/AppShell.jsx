/**
 * AppShell Component
 * 
 * Provides the application-level canvas and context framing for all screens.
 * This ensures the UploadWizard feels like a stage within the analytics platform,
 * not a standalone form.
 * 
 * Design intent:
 * - Full-viewport dark canvas matching dashboard aesthetic
 * - Persistent platform identity and navigation context
 * - Pre-analysis placeholder metrics that activate after upload
 * - Bloomberg/fintech internal tool aesthetic
 */

import React from 'react';

/**
 * Main application shell - wraps all content in consistent platform framing
 */
export default function AppShell({ children, analysisState = 'awaiting', fundData = null }) {
  const hasData = fundData?.asset_allocation || fundData?.performance;
  const isComplete = fundData?.asset_allocation && fundData?.performance;
  
  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* ========================================================================
          TOP NAV BAR
          Persistent platform identity - user always knows where they are
          ======================================================================== */}
      <header className="border-b border-[#1e2736] bg-[#0d1117]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          {/* Platform Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white tracking-tight">SMSF Analytics</h1>
              <p className="text-[10px] text-slate-500">Portfolio Intelligence Platform</p>
            </div>
          </div>
          
          {/* Analysis State Indicator */}
          <div className="flex items-center gap-4">
            <AnalysisStateIndicator state={analysisState} isComplete={isComplete} />
            
            {/* Minimal nav hint */}
            <div className="h-6 w-px bg-[#1e2736]" />
            <button className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Help
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================
          MAIN CONTENT AREA
          Dark canvas with consistent padding - content floats within
          ======================================================================== */}
      <main className="min-h-[calc(100vh-3.5rem)]">
        {/* Fund Context Header - Always visible, activates with data */}
        <FundContextHeader fundData={fundData} />
        
        {/* Pre-analysis Ghost Metrics - Show structure before data exists */}
        <GhostMetricsBar fundData={fundData} />
        
        {/* Main Content Slot */}
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          {children}
        </div>
      </main>

      {/* ========================================================================
          FOOTER
          Subtle platform footer with timestamp and confidentiality
          ======================================================================== */}
      <footer className="border-t border-[#1e2736] py-4 mt-auto">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
          <p className="text-[10px] text-slate-600">
            Fund ID: Awaiting document upload
          </p>
          <p className="text-[10px] text-slate-600">
            {new Date().toLocaleDateString('en-AU', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })} • Confidential
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Analysis State Indicator
 * Shows current stage in the analysis workflow
 */
function AnalysisStateIndicator({ state, isComplete }) {
  const states = {
    awaiting: { label: 'Awaiting Documents', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    processing: { label: 'Processing', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    ready: { label: 'Analysis Ready', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  };
  
  const currentState = isComplete ? states.ready : states[state] || states.awaiting;
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${currentState.bg} border ${currentState.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
      <span className={`text-xs font-medium ${currentState.color}`}>
        {currentState.label}
      </span>
    </div>
  );
}

/**
 * Fund Context Header
 * Shows fund identity and metadata - placeholder when no data, real when loaded
 */
function FundContextHeader({ fundData }) {
  const hasData = fundData?.asset_allocation || fundData?.performance;
  
  return (
    <div className="border-b border-[#1e2736] bg-[#0a0e14]">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-medium text-slate-500 tracking-[0.2em] uppercase mb-2">
              Fund Analytics Report
            </p>
            <h2 className={`text-2xl font-semibold tracking-tight ${hasData ? 'text-white' : 'text-slate-600'}`}>
              {hasData ? 'Portfolio Analysis' : 'Pending Fund Data'}
            </h2>
            <p className={`text-sm mt-1 ${hasData ? 'text-slate-400' : 'text-slate-600'}`}>
              {hasData 
                ? `As of ${fundData?.asset_allocation?.asAtDate || 'Recent'}`
                : 'Upload documents to begin analysis'
              }
            </p>
          </div>
          
          {/* Performance Score Placeholder */}
          <div className={`flex flex-col items-center ${hasData ? '' : 'opacity-20'}`}>
            <div className="relative w-16 h-16">
              {/* Outer ring */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18" cy="18" r="15.5"
                  fill="none"
                  stroke="#1e2736"
                  strokeWidth="2"
                />
                <circle
                  cx="18" cy="18" r="15.5"
                  fill="none"
                  stroke={hasData ? '#10b981' : '#1e2736'}
                  strokeWidth="2"
                  strokeDasharray={hasData ? '75 100' : '0 100'}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              {/* Score number */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-semibold ${hasData ? 'text-white' : 'text-slate-700'}`}>
                  {hasData ? '—' : '—'}
                </span>
              </div>
            </div>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-1.5">
              Performance Score
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Ghost Metrics Bar
 * Pre-analysis placeholder metrics that show the structure of what will appear
 * These activate and populate after document upload
 */
function GhostMetricsBar({ fundData }) {
  const hasAllocation = fundData?.asset_allocation;
  const hasPerformance = fundData?.performance;
  
  const formatCurrency = (value) => {
    if (value == null) return '—';
    const num = parseFloat(value);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num.toFixed(0)}`;
  };

  return (
    <div className="border-b border-[#1e2736]">
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Total Portfolio Value */}
          <MetricCard
            label="Total Portfolio Value"
            value={hasAllocation ? formatCurrency(fundData.asset_allocation.totalValue) : '—'}
            isActive={hasAllocation}
            variant="default"
          />
          
          {/* Period Return */}
          <MetricCard
            label="Period Return"
            value={hasPerformance && fundData.performance.dollarReturnAfterExpenses 
              ? `+${formatCurrency(fundData.performance.dollarReturnAfterExpenses)}` 
              : '—'
            }
            isActive={hasPerformance}
            variant="highlight"
          />
          
          {/* 1-Year Return */}
          <MetricCard
            label="1-Year Return"
            value={hasPerformance && fundData.performance.twr?.oneYear 
              ? `+${fundData.performance.twr.oneYear}%` 
              : '—'
            }
            subValue={hasPerformance ? 'vs benchmark' : null}
            isActive={hasPerformance}
            variant="accent"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Individual metric card for the ghost metrics bar
 */
function MetricCard({ label, value, subValue, isActive, variant = 'default' }) {
  const variants = {
    default: {
      bg: 'bg-[#141a23]',
      border: 'border-[#1e2736]',
      labelColor: 'text-slate-500',
      valueColor: isActive ? 'text-white' : 'text-slate-700',
    },
    highlight: {
      bg: isActive ? 'bg-[#0f2318]' : 'bg-[#141a23]',
      border: isActive ? 'border-emerald-500/20' : 'border-[#1e2736]',
      labelColor: isActive ? 'text-emerald-400/70' : 'text-slate-500',
      valueColor: isActive ? 'text-emerald-400' : 'text-slate-700',
    },
    accent: {
      bg: isActive ? 'bg-[#0f2318]' : 'bg-[#141a23]',
      border: isActive ? 'border-emerald-500/20' : 'border-[#1e2736]',
      labelColor: isActive ? 'text-emerald-400/70' : 'text-slate-500',
      valueColor: isActive ? 'text-emerald-400' : 'text-slate-700',
    },
  };
  
  const style = variants[variant];
  
  return (
    <div className={`rounded-xl ${style.bg} border ${style.border} px-5 py-4 transition-all duration-300`}>
      <p className={`text-[10px] font-medium uppercase tracking-wider mb-2 ${style.labelColor}`}>
        {label}
      </p>
      <p className={`text-2xl font-semibold tracking-tight ${style.valueColor} transition-colors`}>
        {value}
      </p>
      {subValue && (
        <p className="text-[10px] text-emerald-500/60 mt-1">
          {subValue}
        </p>
      )}
    </div>
  );
}