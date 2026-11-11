import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { TopBar } from "./components/TopBar";
import ReceivablesGrid from "./components/ReceivablesGrid";
import TimelineChart from "./components/TimelineChart";
import { AgentConsole } from "./components/AgentConsole";
import { getInvoices, createInvoice, InvoiceRecord } from "./services/api";

export default function App() {
  const { loginWithRedirect, logout, user, isAuthenticated, isLoading } = useAuth0();

  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getInvoices();
      setInvoices(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load database records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber || !customerName || !amount || !dueDate) return;

    try {
      setSubmitting(true);
      await createInvoice({
        invoice_number: invoiceNumber,
        business_id: 3,
        customer_name: customerName,
        amount: Number(amount),
        due_date: new Date(dueDate).toISOString(),
      });
      setShowModal(false);
      setInvoiceNumber("");
      setCustomerName("");
      setAmount("");
      setDueDate("");
      await loadData();
    } catch (err: any) {
      alert("Error adding invoice: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Session Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 font-sans">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm">Verifying FlowSync Admin Session...</p>
      </div>
    );
  }

  // 2. Unauthenticated Admin Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="inline-flex p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl">
            <span className="text-3xl">🔐</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">FlowSync Admin Portal</h1>
            <p className="text-sm text-slate-400 mt-2">
              Autonomous SME Working Capital & Default Risk Engine
            </p>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-400 text-left space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Protected by Auth0 Enterprise Identity</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Encrypted connection to Render PostgreSQL & ANN Model</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Direct PayPal Sandbox Payments & Autonomous Actions</span>
            </div>
          </div>

          <button
            onClick={() => loginWithRedirect()}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition duration-200 shadow-lg text-sm"
          >
            Sign In with Admin Account
          </button>
        </div>
      </div>
    );
  }

  // 3. Authenticated Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Admin Status Header Strip */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-6 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-slate-300 font-medium">Logged in as {user?.email || user?.name}</span>
          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
            Admin Verified
          </span>
        </div>
        <button
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
        >
          Sign Out
        </button>
      </div>

      <TopBar />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {error && (
          <div className="p-4 bg-red-950/60 border border-red-500 rounded-lg text-red-200 text-sm">
            Backend Connection Warning: {error}
          </div>
        )}

        {/* Action Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Cash Flow Forecasting & SME Risk Engine
            </h1>
            <p className="text-sm text-slate-400">
              Live data from Render PostgreSQL & TensorFlow ANN
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadData}
              className="text-xs px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-medium transition"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="text-xs px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition"
            >
              + New Invoice
            </button>
          </div>
        </div>

        {/* Cash Flow Timeline Chart */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg">
          <TimelineChart invoices={invoices} loading={loading} />
        </section>

        {/* Receivables Data Grid */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg">
          <ReceivablesGrid invoices={invoices} loading={loading} />
        </section>

        {/* AI Agent Console */}
        <AgentConsole onActionTriggered={loadData} />
      </main>

      {/* Modal for New Invoice */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold text-white mb-4">Add New Invoice</h2>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Invoice Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-2026-200"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Customer / Client Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nexus Corp"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="15000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-500 font-semibold rounded"
                >
                  {submitting ? "Analyzing Risk..." : "Save Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}