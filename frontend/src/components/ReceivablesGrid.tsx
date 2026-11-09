import { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { Invoice } from '../data/mockData';

interface ReceivablesGridProps {
  invoices: Invoice[];
}

const RiskScoreRenderer = (params: ICellRendererParams) => {
  const score = params.value;
  let color = 'bg-green-500';
  if (score > 70) color = 'bg-red-500';
  else if (score > 40) color = 'bg-yellow-500';

  return (
    <div className="flex items-center h-full w-full">
      <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700 overflow-hidden">
        <div className={`${color} h-2.5 rounded-full`} style={{ width: `${score}%` }}></div>
      </div>
      <span className="ml-2 text-xs font-medium text-slate-600">{score}/100</span>
    </div>
  );
};

const StatusRenderer = (params: ICellRendererParams) => {
  const status = params.value;
  let classes = 'bg-slate-100 text-slate-800';
  
  if (status === 'Action Taken') classes = 'bg-green-100 text-green-800';
  if (status === 'Overdue') classes = 'bg-red-100 text-red-800';
  if (status === 'Critical') classes = 'bg-red-200 text-red-900 font-bold';
  if (status === 'Upcoming') classes = 'bg-blue-100 text-blue-800';

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {status}
    </span>
  );
};

export function ReceivablesGrid({ invoices }: ReceivablesGridProps) {
  const columnDefs = useMemo<ColDef[]>(() => [
    { field: 'clientName', headerName: 'Client Name', flex: 1, filter: true },
    { 
      field: 'invoiceAmount', 
      headerName: 'Amount', 
      flex: 1,
      valueFormatter: (params) => `$${params.value.toLocaleString()}`,
      sortable: true
    },
    { field: 'daysOverdue', headerName: 'Days Overdue', flex: 1, sortable: true },
    { 
      field: 'riskScore', 
      headerName: 'AI Risk Score', 
      flex: 1.5,
      cellRenderer: RiskScoreRenderer,
      sortable: true
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      flex: 1,
      cellRenderer: StatusRenderer,
      filter: true
    }
  ], []);

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
  }), []);

  return (
    <div className="flex-1 bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">Outstanding Receivables</h2>
      </div>
      <div className="flex-1 w-full ag-theme-alpine">
        <AgGridReact
          rowData={invoices}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows={true}
          rowSelection="single"
          headerHeight={48}
          rowHeight={56}
          domLayout='normal'
        />
      </div>
    </div>
  );
}
