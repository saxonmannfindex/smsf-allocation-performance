/**
 * UploadWizard Component
 * 
 * Two-step upload flow for PDF reports:
 * 1. Upload Asset Allocation report
 * 2. Upload Performance (TWR) report
 * 
 * UPDATED: Demoted visual weight to feel like "upload slots" within a system,
 * not a standalone form. Reduced icon dominance and empty-state noise.
 * Designed to sit within AppShell context framing.
 */

import React, { useState, useCallback } from 'react';
import DropZone from './DropZone.jsx';
import { extractTextFromPDF } from '../utils/pdfParser.js';
import { parseReport, identifyReportType } from '../parsers/reportRegistry.js';

// Step definitions
const STEPS = [
  {
    id: 1,
    key: 'asset_allocation',
    title: 'Asset Allocation Report',
    description: 'Investment Allocation PDF',
    expectedType: 'asset_allocation',
  },
  {
    id: 2,
    key: 'performance',
    title: 'Performance Report',
    description: 'Investment Movement and Returns PDF',
    expectedType: 'performance',
  },
];

export default function UploadWizard({ onComplete, onPartialData }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadStatus, setUploadStatus] = useState({
    asset_allocation: 'idle',
    performance: 'idle',
  });
  const [parsedData, setParsedData] = useState({
    asset_allocation: null,
    performance: null,
  });
  const [errors, setErrors] = useState({
    asset_allocation: null,
    performance: null,
  });

  // Handle file upload for a specific step
  const handleFileUpload = useCallback(async (file, error, stepKey) => {
    if (error) {
      setErrors(prev => ({ ...prev, [stepKey]: error }));
      setUploadStatus(prev => ({ ...prev, [stepKey]: 'error' }));
      return;
    }

    if (!file) return;

    setUploadStatus(prev => ({ ...prev, [stepKey]: 'processing' }));
    setErrors(prev => ({ ...prev, [stepKey]: null }));

    try {
      console.log(`[UploadWizard] Extracting text from ${file.name}...`);
      const extractedPdf = await extractTextFromPDF(file);
      
      if (!extractedPdf.fullText || extractedPdf.fullText.length < 100) {
        throw new Error('Could not extract text from PDF. The file may be image-based or corrupted.');
      }

      const identification = identifyReportType(extractedPdf.fullText);
      console.log(`[UploadWizard] Identified as: ${identification?.type || 'unknown'}`);

      const step = STEPS.find(s => s.key === stepKey);
      if (identification?.type !== step.expectedType) {
        const expectedName = step.title;
        const actualName = identification?.name || 'Unknown report type';
        throw new Error(
          `This appears to be a ${actualName}. Please upload a ${expectedName} for this step.`
        );
      }

      const parsed = await parseReport(extractedPdf);
      console.log(`[UploadWizard] Parsed ${stepKey}:`, parsed);

      const newParsedData = { ...parsedData, [stepKey]: parsed.data };
      setParsedData(newParsedData);
      setUploadStatus(prev => ({ ...prev, [stepKey]: 'success' }));

      if (onPartialData) {
        onPartialData(stepKey, parsed.data);
      }

      if (currentStep < STEPS.length) {
        setTimeout(() => setCurrentStep(currentStep + 1), 500);
      }

      if (stepKey === 'performance' && newParsedData.asset_allocation) {
        if (onComplete) {
          onComplete(newParsedData);
        }
      } else if (stepKey === 'asset_allocation' && newParsedData.performance) {
        if (onComplete) {
          onComplete(newParsedData);
        }
      }

    } catch (err) {
      console.error(`[UploadWizard] Error processing ${stepKey}:`, err);
      setErrors(prev => ({ ...prev, [stepKey]: err.message }));
      setUploadStatus(prev => ({ ...prev, [stepKey]: 'error' }));
    }
  }, [currentStep, parsedData, onComplete, onPartialData]);

  const handleReset = useCallback((stepKey) => {
    setParsedData(prev => ({ ...prev, [stepKey]: null }));
    setUploadStatus(prev => ({ ...prev, [stepKey]: null }));
    setErrors(prev => ({ ...prev, [stepKey]: null }));
  }, []);

  const isComplete = parsedData.asset_allocation && parsedData.performance;

  return (
    /* ========================================================================
       DOCUMENT INTAKE SECTION
       Positioned as a workflow stage, not a standalone form
       Minimal section header - context comes from AppShell
       ======================================================================== */
    <div className="space-y-4">
      {/* Section Header - Minimal, workflow-oriented */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-slate-300">Document Intake</h3>
          <span className="text-[10px] text-slate-600">•</span>
          <span className="text-[10px] text-slate-500">
            {isComplete ? 'Complete' : `${uploadStatus.asset_allocation === 'success' ? 1 : 0} of 2 uploaded`}
          </span>
        </div>
        
        {/* Compact step indicators */}
        <div className="flex items-center gap-1">
          {STEPS.map((step, index) => {
            const status = uploadStatus[step.key];
            const isStepComplete = status === 'success';
            const hasStepError = status === 'error';
            
            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`
                    w-6 h-6 rounded flex items-center justify-center text-[10px] font-medium transition-all
                    ${isStepComplete 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : hasStepError
                        ? 'bg-red-500/20 text-red-400'
                        : currentStep === step.id 
                          ? 'bg-slate-700 text-white' 
                          : 'bg-[#1e2736] text-slate-500 hover:bg-slate-700/50'
                    }
                  `}
                  title={step.title}
                >
                  {isStepComplete ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`w-4 h-px ${isStepComplete ? 'bg-emerald-500/40' : 'bg-[#1e2736]'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Upload Cards - Side by side, slot-like appearance */}
      <div className="grid md:grid-cols-2 gap-3">
        {STEPS.map((step) => (
          <UploadSlot
            key={step.key}
            step={step}
            status={uploadStatus[step.key]}
            error={errors[step.key]}
            isActive={currentStep === step.id}
            parsedData={parsedData[step.key]}
            onFileUpload={(file, error) => handleFileUpload(file, error, step.key)}
            onReset={() => handleReset(step.key)}
          />
        ))}
      </div>

      {/* Completion indicator - Subtle, not celebratory */}
      {isComplete && (
        <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
          <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xs text-emerald-400/80">Documents processed • Analysis metrics updated above</p>
        </div>
      )}
    </div>
  );
}

/**
 * UploadSlot Component
 * Demoted visual weight - feels like a slot in a system, not a primary CTA
 */
function UploadSlot({ step, status, error, isActive, parsedData, onFileUpload, onReset }) {
  const isComplete = status === 'success';
  const hasError = status === 'error';
  const isProcessing = status === 'processing';
  
  return (
    <div className={`
      rounded-lg border transition-all duration-200 overflow-hidden
      ${isComplete 
        ? 'bg-[#0f1a14] border-emerald-500/15' 
        : hasError
          ? 'bg-[#1a0f0f] border-red-500/15'
          : isActive 
            ? 'bg-[#141a23] border-slate-600/30' 
            : 'bg-[#0f1318] border-[#1e2736]/60'
      }
    `}>
      {/* Slot Header - Compact, informational */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1e2736]/40">
        <div className="flex items-center gap-2.5">
          {/* Small icon - demoted */}
          <div className={`
            w-5 h-5 rounded flex items-center justify-center
            ${isComplete 
              ? 'bg-emerald-500/10 text-emerald-400' 
              : hasError
                ? 'bg-red-500/10 text-red-400'
                : 'bg-slate-700/30 text-slate-500'
            }
          `}>
            {step.key === 'asset_allocation' ? (
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              </svg>
            ) : (
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            )}
          </div>
          <div>
            <h4 className="text-xs font-medium text-slate-300">{step.title}</h4>
            <p className="text-[9px] text-slate-600">{step.description}</p>
          </div>
        </div>
        
        {/* Status / Actions */}
        <div className="flex items-center gap-2">
          {isComplete && (
            <>
              <span className="text-[9px] text-emerald-400/60">Loaded</span>
              <button
                onClick={onReset}
                className="p-1 text-slate-600 hover:text-slate-400 transition-colors"
                title="Replace"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </>
          )}
          {isProcessing && (
            <span className="text-[9px] text-blue-400/60">Processing...</span>
          )}
          {hasError && (
            <span className="text-[9px] text-red-400/60">Error</span>
          )}
        </div>
      </div>
      
      {/* Upload Zone - Minimal height, slot-like */}
      <div className="p-3">
        <DropZone
          onFileSelect={onFileUpload}
          status={status}
          label={null}
          description="PDF"
          errorMessage={error}
          acceptedFileName={isComplete ? 'Document loaded' : null}
        />
        
        {/* Extracted Data - Compact inline metrics */}
        {isComplete && parsedData && (
          <ExtractedMetrics type={step.key} data={parsedData} />
        )}
      </div>
    </div>
  );
}

/**
 * ExtractedMetrics Component
 * Compact inline display of key extracted values
 */
function ExtractedMetrics({ type, data }) {
  const formatCurrency = (value) => {
    if (value == null) return '—';
    const num = parseFloat(value);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num.toFixed(0)}`;
  };

  if (type === 'asset_allocation' && data) {
    return (
      <div className="mt-2 pt-2 border-t border-[#1e2736]/30 flex items-center gap-4">
        <Metric label="Classes" value={data.assetClasses?.length || 0} />
        <Metric label="Holdings" value={data.holdings?.length || 0} />
        <Metric label="Value" value={formatCurrency(data.totalValue)} accent />
      </div>
    );
  }
  
  if (type === 'performance' && data) {
    return (
      <div className="mt-2 pt-2 border-t border-[#1e2736]/30 flex items-center gap-4">
        <Metric 
          label="1Y TWR" 
          value={data.twr?.oneYear != null ? `${data.twr.oneYear}%` : '—'} 
          accent 
        />
        <Metric label="End Value" value={formatCurrency(data.endingMarketValue)} />
        <Metric label="Return" value={formatCurrency(data.dollarReturnAfterExpenses)} />
      </div>
    );
  }
  
  return null;
}

/**
 * Compact inline metric display
 */
function Metric({ label, value, accent }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] text-slate-600 uppercase">{label}</span>
      <span className={`text-[10px] font-medium ${accent ? 'text-emerald-400' : 'text-slate-400'}`}>
        {value}
      </span>
    </div>
  );
}