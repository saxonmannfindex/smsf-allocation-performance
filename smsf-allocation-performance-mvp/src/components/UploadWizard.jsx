/**
 * UploadWizard Component
 * 
 * Two-step upload flow for PDF reports:
 * 1. Upload Asset Allocation report
 * 2. Upload Performance (TWR) report
 * 
 * Presentation-grade styling with clear progress indication.
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
    description: 'Upload the Investment Allocation PDF',
    expectedType: 'asset_allocation',
  },
  {
    id: 2,
    key: 'performance',
    title: 'Performance Report',
    description: 'Upload the Investment Movement and Returns PDF',
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
  const hasAnyUpload = uploadStatus.asset_allocation !== 'idle' || uploadStatus.performance !== 'idle';

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6">
      {/* Main Container Card */}
      <div className="rounded-2xl bg-gradient-to-b from-[#1a1f2e] to-[#141820] border border-[#2a3142] overflow-hidden">
        
        {/* Header Section */}
        <div className="px-8 pt-8 pb-6 border-b border-[#2a3142]/60">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-medium text-slate-500 tracking-[0.2em] uppercase mb-2">
                Fund Analytics Report
              </p>
              <h1 className="text-xl font-semibold text-white tracking-tight">
                Portfolio Document Intake
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Upload allocation and performance reports to generate analysis
              </p>
            </div>
            
            {/* Step Progress */}
            <div className="flex items-center gap-2">
              {STEPS.map((step, index) => {
                const status = uploadStatus[step.key];
                const isStepComplete = status === 'success';
                const isStepActive = currentStep === step.id;
                const hasStepError = status === 'error';
                
                return (
                  <React.Fragment key={step.id}>
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                        ${isStepComplete 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                          : hasStepError
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : isStepActive 
                              ? 'bg-slate-700/50 text-white border border-slate-600' 
                              : 'bg-transparent text-slate-500 border border-transparent hover:border-slate-700'
                        }
                      `}
                    >
                      <span className={`
                        w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold
                        ${isStepComplete 
                          ? 'bg-emerald-500/20' 
                          : hasStepError
                            ? 'bg-red-500/20'
                            : isStepActive 
                              ? 'bg-slate-600' 
                              : 'bg-slate-700/50'
                        }
                      `}>
                        {isStepComplete ? (
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          step.id
                        )}
                      </span>
                      <span className="hidden sm:inline">
                        {step.key === 'asset_allocation' ? 'Allocation' : 'Performance'}
                      </span>
                    </button>
                    {index < STEPS.length - 1 && (
                      <div className={`w-6 h-px ${uploadStatus[step.key] === 'success' ? 'bg-emerald-500/50' : 'bg-slate-700'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upload Cards Grid */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            {STEPS.map((step) => (
              <UploadCard
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

          {/* Completion State */}
          {isComplete && (
            <div className="mt-4 flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Documents processed successfully</p>
                <p className="text-xs text-slate-500">Analysis ready • Scroll down to view results</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-[#2a3142]/40 flex items-center justify-between">
          <p className="text-[10px] text-slate-600">
            Documents processed locally • Not stored externally
          </p>
          <p className="text-[10px] text-slate-600">
            Supported format: PDF
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual upload card component
 */
function UploadCard({ step, status, error, isActive, parsedData, onFileUpload, onReset }) {
  const isComplete = status === 'success';
  const hasError = status === 'error';
  
  return (
    <div className={`
      rounded-xl border transition-all duration-200 overflow-hidden
      ${isComplete 
        ? 'bg-[#1a2420] border-emerald-500/20' 
        : hasError
          ? 'bg-[#241a1a] border-red-500/20'
          : isActive 
            ? 'bg-[#1e2330] border-slate-600/50' 
            : 'bg-[#161a24] border-[#2a3142]/50'
      }
    `}>
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a3142]/30">
        <div className="flex items-center gap-3">
          <div className={`
            w-7 h-7 rounded-lg flex items-center justify-center
            ${isComplete 
              ? 'bg-emerald-500/15' 
              : hasError
                ? 'bg-red-500/15'
                : 'bg-slate-700/40'
            }
          `}>
            {step.key === 'asset_allocation' ? (
              <svg className={`w-3.5 h-3.5 ${isComplete ? 'text-emerald-400' : hasError ? 'text-red-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            ) : (
              <svg className={`w-3.5 h-3.5 ${isComplete ? 'text-emerald-400' : hasError ? 'text-red-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              Step {step.id}
            </p>
            <h3 className="text-sm font-medium text-white">{step.title}</h3>
          </div>
        </div>
        {isComplete && (
          <button
            onClick={onReset}
            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700/30 rounded transition-colors"
            title="Replace file"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Upload Zone */}
      <div className="p-4">
        <DropZone
          onFileSelect={onFileUpload}
          status={status}
          label={null}
          description="PDF files only"
          errorMessage={error}
          acceptedFileName={isComplete ? `${step.title} loaded` : null}
        />
        
        {/* Parsed Data Preview */}
        {isComplete && parsedData && (
          <ExtractedDataPreview type={step.key} data={parsedData} />
        )}
      </div>
    </div>
  );
}

/**
 * Preview of extracted data
 */
function ExtractedDataPreview({ type, data }) {
  const formatCurrency = (value) => {
    if (value == null) return '—';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const MetricItem = ({ label, value, accent }) => (
    <div>
      <p className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-xs font-medium tabular-nums mt-0.5 ${accent ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );

  if (type === 'asset_allocation' && data) {
    return (
      <div className="mt-3 pt-3 border-t border-[#2a3142]/30">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-1 h-1 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-medium text-slate-400">Extracted</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <MetricItem label="Asset Classes" value={data.assetClasses?.length || 0} />
          <MetricItem label="Holdings" value={data.holdings?.length || 0} />
          <MetricItem label="Total Value" value={formatCurrency(data.totalValue)} accent />
          <MetricItem label="Report Date" value={data.asAtDate || '—'} />
        </div>
      </div>
    );
  }
  
  if (type === 'performance' && data) {
    return (
      <div className="mt-3 pt-3 border-t border-[#2a3142]/30">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-1 h-1 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-medium text-slate-400">Extracted</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <MetricItem 
            label="1Y TWR" 
            value={data.twr?.oneYear != null ? `${data.twr.oneYear}%` : '—'} 
            accent 
          />
          <MetricItem 
            label="Ending Value" 
            value={formatCurrency(data.endingMarketValue)}
          />
          <MetricItem 
            label="Net Return" 
            value={formatCurrency(data.dollarReturnAfterExpenses)}
          />
          <MetricItem 
            label="Period" 
            value={data.period?.to || '—'}
          />
        </div>
      </div>
    );
  }
  
  return null;
}