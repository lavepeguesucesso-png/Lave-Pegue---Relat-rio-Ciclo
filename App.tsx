import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { ComparativeView } from './components/ComparativeView';
import { RevenueDashboard } from './components/RevenueDashboard';
import { ExportModal } from './components/ExportModal';
import { FullReport } from './components/FullReport';
import { parseCSV } from './services/csvParser';
import { Transaction, DashboardMetadata, ExportOptions } from './types';
import { Loader2, ArrowLeft, User, UserCog, GitCompare, DollarSign, Download } from 'lucide-react';

interface ReportData {
  transactions: Transaction[];
  metadata: DashboardMetadata;
}

const App: React.FC = () => {
  const [selfServiceData, setSelfServiceData] = useState<ReportData | null>(null);
  const [attendantData, setAttendantData] = useState<ReportData | null>(null);
  const [activeTab, setActiveTab] = useState<'SELF_SERVICE' | 'ATTENDANT' | 'COMPARISON' | 'FINANCIAL'>('SELF_SERVICE');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions | null>(null);

  // Helper to read file as text
  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleProcessFiles = async (files: { selfService: File | null; attendant: File | null }) => {
    setLoading(true);
    setError(null);
    setSelfServiceData(null);
    setAttendantData(null);

    try {
      let selfDataParsed = null;
      let attendantDataParsed = null;

      // 1. Process Self Service
      if (files.selfService) {
        const content = await readFile(files.selfService);
        const parsed = parseCSV(content);
        if (parsed.transactions.length > 0) {
          if (parsed.metadata.reportType === 'ATTENDANT') {
             console.warn("Warning: Attendant file uploaded in Self-Service slot");
          }
          selfDataParsed = parsed;
          setSelfServiceData(parsed);
        }
      }

      // 2. Process Attendant
      if (files.attendant) {
        const content = await readFile(files.attendant);
        const parsed = parseCSV(content);
        if (parsed.transactions.length > 0) {
           if (parsed.metadata.reportType === 'SELF_SERVICE') {
             console.warn("Warning: Self-Service file uploaded in Attendant slot");
           }
           attendantDataParsed = parsed;
           setAttendantData(parsed);
        }
      }

      // Determine initial tab
      if (selfDataParsed && attendantDataParsed) {
        setActiveTab('FINANCIAL'); // Prioritize finance if both are present
      } else if (selfDataParsed) {
        setActiveTab('SELF_SERVICE');
      } else if (attendantDataParsed) {
        setActiveTab('ATTENDANT');
      }

    } catch (err: any) {
      console.error(err);
      setError('Erro ao processar os arquivos. Verifique se estão no formato CSV correto.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelfServiceData(null);
    setAttendantData(null);
    setError(null);
  };

  // Handle Printing Logic
  const handleOpenExport = () => {
    setIsExportModalOpen(true);
  };

  const handleExport = (options: ExportOptions) => {
    setExportOptions(options);
    setIsExportModalOpen(false);
    setIsPrinting(true);
  };

  // Trigger browser print when isPrinting becomes true
  useEffect(() => {
    if (isPrinting && exportOptions) {
      // Delay to allow DOM to render charts in the overlay
      const timer = setTimeout(() => {
        window.print();
      }, 1000); // 1 second delay for chart animation/rendering

      const handleAfterPrint = () => {
        setIsPrinting(false);
        setExportOptions(null);
      };

      window.addEventListener('afterprint', handleAfterPrint);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [isPrinting, exportOptions]);


  const hasData = selfServiceData || attendantData;
  const hasBoth = selfServiceData && attendantData;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600">
        <Loader2 className="w-12 h-12 animate-spin text-pink-600 mb-4" />
        <p className="font-medium animate-pulse">Gerando relatórios...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Modal for Export Selection */}
      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        onExport={handleExport}
        hasSelfService={!!selfServiceData}
        hasAttendant={!!attendantData}
      />

      {/* Print Overlay Container 
          Visible only when isPrinting is true. 
          This renders ON TOP of the current UI, ensuring standard DOM layout for charts.
      */}
      {isPrinting && exportOptions && (
        <div className="print-overlay">
          <FullReport 
            selfServiceData={selfServiceData} 
            attendantData={attendantData} 
            options={exportOptions} 
          />
        </div>
      )}

      {/* Main Application Interface (Hidden via CSS @media print) */}
      <div className="no-print">
        {!hasData ? (
          <div className="container mx-auto">
            <FileUpload onProcess={handleProcessFiles} />
            {error && (
              <div className="max-w-md mx-auto mt-4 p-4 bg-red-50 text-red-600 text-center rounded-lg border border-red-100">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Navigation Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
              <div className="max-w-6xl mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center h-auto md:h-16 py-2 gap-4">
                  <div className="flex items-center gap-4 self-start md:self-auto">
                    <button 
                      onClick={handleReset} 
                      className="flex items-center gap-2 text-slate-500 hover:text-pink-600 font-medium text-sm transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Novo
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
                    {selfServiceData && (
                      <button
                        onClick={() => setActiveTab('SELF_SERVICE')}
                        className={`
                          flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap
                          ${activeTab === 'SELF_SERVICE' 
                            ? 'bg-white text-pink-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'}
                        `}
                      >
                        <User className="w-4 h-4" /> Self Service
                      </button>
                    )}
                    
                    {attendantData && (
                      <button
                        onClick={() => setActiveTab('ATTENDANT')}
                        className={`
                          flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap
                          ${activeTab === 'ATTENDANT' 
                            ? 'bg-white text-purple-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'}
                        `}
                      >
                        <UserCog className="w-4 h-4" /> Atendente
                      </button>
                    )}

                    {hasBoth && (
                      <button
                        onClick={() => setActiveTab('COMPARISON')}
                        className={`
                          flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap
                          ${activeTab === 'COMPARISON' 
                            ? 'bg-white text-teal-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'}
                        `}
                      >
                        <GitCompare className="w-4 h-4" /> Comparativo
                      </button>
                    )}

                    {/* Financial Tab - Always available if data exists */}
                    <button
                      onClick={() => setActiveTab('FINANCIAL')}
                      className={`
                        flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap
                        ${activeTab === 'FINANCIAL' 
                          ? 'bg-white text-emerald-600 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'}
                      `}
                    >
                      <DollarSign className="w-4 h-4" /> Financeiro
                    </button>
                  </div>

                  {/* Export Button */}
                  <button
                    onClick={handleOpenExport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-full hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg self-end md:self-auto"
                  >
                    <Download className="w-4 h-4" /> Exportar PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Content Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === 'SELF_SERVICE' && selfServiceData && (
                <Dashboard 
                  key="self"
                  transactions={selfServiceData.transactions} 
                  metadata={selfServiceData.metadata} 
                  onReset={handleReset}
                  hideHeader={true} 
                />
              )}
              {activeTab === 'ATTENDANT' && attendantData && (
                <Dashboard 
                  key="attendant"
                  transactions={attendantData.transactions} 
                  metadata={attendantData.metadata} 
                  onReset={handleReset}
                  hideHeader={true}
                />
              )}
              {activeTab === 'COMPARISON' && selfServiceData && attendantData && (
                <ComparativeView 
                  selfServiceTransactions={selfServiceData.transactions}
                  attendantTransactions={attendantData.transactions}
                />
              )}
              {activeTab === 'FINANCIAL' && (
                <RevenueDashboard
                  selfServiceTransactions={selfServiceData?.transactions || []}
                  attendantTransactions={attendantData?.transactions || []}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;