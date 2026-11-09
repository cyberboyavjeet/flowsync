import { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { 
  AlertTriangle, DollarSign, TrendingUp, Activity, CheckCircle, Loader2
} from 'lucide-react';

// Types
interface Invoice {
  id: string;
  customer_id: string;
  client_name: string;
  total_amount: number;
  invoice_date: string;
  due_date: string;
  days_overdue: number;
  status: string;
  risk_score: number | null;
  recommended_action?: string;
}

// Mock Data
const initialInvoices: Invoice[] = [
  { id: 'INV-1001', customer_id: 'CUST-A1', client_name: 'Acme Corp', total_amount: 45000, invoice_date: '2026-09-01', due_date: '2026-10-01', days_overdue: 9, status: 'Outstanding', risk_score: 42 },
  { id: 'INV-1002', customer_id: 'CUST-B2', client_name: 'Globex Inc', total_amount: 120000, invoice_date: '2026-08-15', due_date: '2026-09-15', days_overdue: 25, status: 'Outstanding', risk_score: 85 },
  { id: 'INV-1003', customer_id: 'CUST-C3', client_name: 'Soylent Corp', total_amount: 8500, invoice_date: '2026-09-20', due_date: '2026-10-20', days_overdue: -10, status: 'Pending', risk_score: 15 },
  { id: 'INV-1004', customer_id: 'CUST-D4', client_name: 'Initech', total_amount: 34000, invoice_date: '2026-09-05', due_date: '2026-10-05', days_overdue: 5, status: 'Outstanding', risk_score: 60 },
  { id: 'INV-1005', customer_id: 'CUST-E5', client_name: 'Umbrella Corp', total_amount: 250000, invoice_date: '2026-07-10', due_date: '2026-08-10', days_overdue: 61, status: 'Outstanding', risk_score: 95 },
];

// Generate 90-day cash flow forecast
const generateChartData = () => {
  const data = [];
  let currentCash = 500000;
  for (let i = 0; i < 90; i++) {
    const day = `Day ${i + 1}`;
    // Simulating a dip into negative at day 18
    const drop = i === 18 ? 200000 : (i > 15 && i < 25 ? 50000 : Math.random() * 20000 - 10000);
    currentCash -= drop;
    
    data.push({
      day,
      Actual: i <= 10 ? currentCash + (Math.random() * 10000) : null,
      Projected: currentCash
    });
  }
  return data;
};

const chartData = generateChartData();

export default function App() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoadingRisk, setIsLoadingRisk] = useState(false);
  
  // New States for PayPal Integration
  const [isGeneratingPayment, setIsGeneratingPayment] = useState<boolean>(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  const evaluateRisk = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsLoadingRisk(true);
    setPaymentLink(null); // Reset link when a new invoice is clicked

    try {
      const response = await fetch('http://localhost:8000/predict_risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_amount: invoice.total_amount,
          invoice_date: invoice.invoice_date,
          due_date: invoice.due_date,
          customer_id: invoice.customer_id
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        updateInvoiceRisk(invoice.id, data.risk_score, data.recommended_action);
      } else {
        throw new Error('API failed');
      }
    } catch (error) {
      // Mock fallback if backend is not available
      setTimeout(() => {
        const mockScore = invoice.days_overdue > 20 ? 88 : invoice.days_overdue > 0 ? 65 : 20;
        const mockAction = mockScore > 75 
          ? "High risk of default. Send urgent PayPal reminder and consider halting services."
          : mockScore > 40
            ? "Moderate risk. Send standard PayPal payment reminder."
            : "Low risk. No immediate action required.";
            
        updateInvoiceRisk(invoice.id, mockScore, mockAction);
      }, 1000);
    }
  };

  const updateInvoiceRisk = (id: string, score: number, action: string) => {
    setInvoices(prev => prev.map(inv => 
      inv.id === id ? { ...inv, risk_score: score, recommended_action: action } : inv
    ));
    setSelectedInvoice(prev => prev && prev.id === id ? { ...prev, risk_score: score, recommended_action: action } : prev);
    setIsLoadingRisk(false);
  };

  const getRiskColor = (score: number | null) => {
    if (score === null) return 'bg-gray-200';
    if (score < 40) return 'bg-emerald-500';
    if (score <= 75) return 'bg-amber-400';
    return 'bg-rose-500';
  };

  // New function to handle PayPal link generation
  const handleGeneratePayment = async () => {
    if (!selectedInvoice) return;
  
    setIsGeneratingPayment(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/generate_payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(selectedInvoice.total_amount),
          invoice_id: String(selectedInvoice.id),
        }),
      });
  
      const data = await response.json();
  
      if (data.status === "success" && data.payment_link) {
        setPaymentLink(data.payment_link);
      } else {
        alert("Failed to create PayPal invoice: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Could not reach backend at http://127.0.0.1:8000");
    } finally {
      setIsGeneratingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">FlowSync</h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <span>Admin</span>
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">A</div>
        </div>
      </header>

      <main className="p-6 max-w-[1600px] mx-auto space-y-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-4">
              <span className="font-semibold text-sm uppercase tracking-wider">Current Cash</span>
              <DollarSign className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-3xl font-bold">$1,245,000</div>
            <div className="text-emerald-600 text-sm font-medium mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> +2.4% from last month
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-4">
              <span className="font-semibold text-sm uppercase tracking-wider">30-Day Projection</span>
              <Activity className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-3xl font-bold text-rose-600">-$150,000</div>
            <div className="text-rose-600 text-sm font-medium mt-2 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> Deficit expected in 18 days
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-4">
              <span className="font-semibold text-sm uppercase tracking-wider">Active Alerts</span>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-3xl font-bold">3</div>
            <div className="text-slate-500 text-sm font-medium mt-2">
              Requires immediate action
            </div>
          </div>
        </div>

        {/* Cash-Flow Forecast Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">90-Day Cash-Flow Forecast</h2>
            <div className="flex gap-4 text-sm font-medium">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-400"></div>Actual</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div>Projected</div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} minTickGap={30} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip 
                  formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideBottomRight', value: 'Red Zone', fill: '#ef4444', fontSize: 12 }} />
                <Line type="monotone" dataKey="Actual" stroke="#94a3b8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Projected" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lower Section: Grid & Console */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Receivables Grid */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Outstanding Receivables</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold border-b border-slate-200">Client Name</th>
                    <th className="px-6 py-4 font-semibold border-b border-slate-200">Amount</th>
                    <th className="px-6 py-4 font-semibold border-b border-slate-200">Days Overdue</th>
                    <th className="px-6 py-4 font-semibold border-b border-slate-200 min-w-[150px]">AI Risk Score</th>
                    <th className="px-6 py-4 font-semibold border-b border-slate-200">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {invoices.map(inv => (
                    <tr 
                      key={inv.id} 
                      onClick={() => evaluateRisk(inv)}
                      className={`hover:bg-indigo-50/50 cursor-pointer transition-colors ${selectedInvoice?.id === inv.id ? 'bg-indigo-50/80' : ''}`}
                    >
                      <td className="px-6 py-4 font-medium text-slate-800">{inv.client_name}</td>
                      <td className="px-6 py-4 text-slate-600">${inv.total_amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${inv.days_overdue > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                          {inv.days_overdue > 0 ? `${inv.days_overdue} days` : 'Not overdue'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getRiskColor(inv.risk_score)} transition-all duration-500`}
                              style={{ width: `${inv.risk_score || 0}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-slate-700 text-xs w-6">{inv.risk_score ?? '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${inv.status === 'Outstanding' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Agent Console */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px] overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
              <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">AI Agent Console</h2>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              {!selectedInvoice ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center space-y-3">
                  <Activity className="w-10 h-10 text-slate-200" />
                  <p>Select an invoice from the grid<br/>to view AI analysis.</p>
                </div>
              ) : isLoadingRisk ? (
                <div className="flex-1 flex flex-col items-center justify-center text-indigo-600 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-sm font-medium animate-pulse">Evaluating risk profile...</p>
                </div>
              ) : (
                <div className="space-y-6 flex-1 flex flex-col animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900">{selectedInvoice.client_name}</h3>
                    <p className="text-sm text-slate-500">Invoice {selectedInvoice.id}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="text-xs text-slate-500 font-medium mb-1">Total Amount</div>
                      <div className="font-bold text-slate-800">${selectedInvoice.total_amount.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="text-xs text-slate-500 font-medium mb-1">Due Date</div>
                      <div className="font-bold text-slate-800">{new Date(selectedInvoice.due_date).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white rounded-xl p-5 space-y-4 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full"></div>
                    
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-300">AI Risk Assessment</span>
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${getRiskColor(selectedInvoice.risk_score)} text-white`}>
                        Score: {selectedInvoice.risk_score}
                      </span>
                    </div>
                    
                    <div className="relative z-10 space-y-2">
                      <div className="text-xs text-slate-400">Recommended Action</div>
                      <p className="text-sm font-medium leading-relaxed">
                        {selectedInvoice.recommended_action || "Analyzing optimal action plan..."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-6">
                    {paymentLink ? (
                      <a
                        href={paymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Open PayPal Checkout ↗
                      </a>
                    ) : (
                      <button 
                        onClick={handleGeneratePayment}
                        disabled={isGeneratingPayment || !selectedInvoice}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-semibold py-3 px-4 rounded-lg shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                      >
                        {isGeneratingPayment ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating Order...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Approve & Send Reminder
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}