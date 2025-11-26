import React from 'react';
import { Dashboard } from './Dashboard';
import { ComparativeView } from './ComparativeView';
import { RevenueDashboard } from './RevenueDashboard';
import { Transaction, DashboardMetadata, ExportOptions } from '../types';

interface ReportData {
  transactions: Transaction[];
  metadata: DashboardMetadata;
}

interface FullReportProps {
  selfServiceData: ReportData | null;
  attendantData: ReportData | null;
  options: ExportOptions;
}

export const FullReport: React.FC<FullReportProps> = ({ selfServiceData, attendantData, options }) => {
  return (
    <div className="w-full bg-white min-h-screen">
      {/* Self Service Section */}
      {options.includeSelf && selfServiceData && (
        <div className="page-break mb-8">
          <Dashboard 
            transactions={selfServiceData.transactions} 
            metadata={selfServiceData.metadata} 
            hideHeader={true}
            printMode={true}
          />
        </div>
      )}

      {/* Attendant Section */}
      {options.includeAttendant && attendantData && (
        <div className="page-break mb-8">
          <Dashboard 
            transactions={attendantData.transactions} 
            metadata={attendantData.metadata} 
            hideHeader={true}
            printMode={true}
          />
        </div>
      )}

      {/* Comparative Section */}
      {options.includeComparative && selfServiceData && attendantData && (
        <div className="page-break mb-8">
          <ComparativeView 
            selfServiceTransactions={selfServiceData.transactions}
            attendantTransactions={attendantData.transactions}
            printMode={true}
          />
        </div>
      )}

      {/* Financial Section */}
      {options.includeFinancial && (
        <div className="page-break mb-8">
          <RevenueDashboard
            selfServiceTransactions={selfServiceData?.transactions || []}
            attendantTransactions={attendantData?.transactions || []}
            printMode={true}
          />
        </div>
      )}
    </div>
  );
};