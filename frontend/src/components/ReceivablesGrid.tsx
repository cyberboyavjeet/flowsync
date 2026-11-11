import React, { useState } from "react";
import { InvoiceRecord, payInvoice } from "../services/api";

interface ReceivablesGridProps {
  invoices: InvoiceRecord[];
  loading?: boolean;
}


export default function ReceivablesGrid({ invoices, loading }: ReceivablesGridProps) {
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handlePay = async (invoiceId: number) => {
    try {
      setProcessingId(invoiceId);
      const res = await payInvoice(invoiceId);
      if (res.approval_url) {
        window.open(res.approval_url, "_blank");
      }
    } catch (err: any) {
      alert("Payment Error: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="text-slate-400 py-8 text-center text-sm">Loading records from PostgreSQL...</div>;
  }

  if (invoices.length === 0) {
    return <div className="text-slate-500 py-8 text-center text-sm">No invoices recorded in database yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
            <th className="py-3 px-4">Invoice #</th>
            <th className="py-3 px-4">Customer</th>
            <th className="py-3 px-4">Amount</th>
            <th className="py-3 px-4">Due Date</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Risk Tier</th>
            <th className="py-3 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-slate-200">
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-slate-800/40 transition">
              <td className="py-3 px-4 font-mono font-medium">{inv.invoice_number}</td>
              <td className="py-3 px-4">{inv.customer_name}</td>
              <td className="py-3 px-4 font-semibold text-emerald-400">
                ${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="py-3 px-4 text-slate-400">
                {new Date(inv.due_date).toLocaleDateString()}
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  inv.status === "PAID"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800 border border-slate-700 text-slate-300"
                }`}>
                  {inv.status}
                </span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    inv.risk_tier === "HIGH"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : inv.risk_tier === "MEDIUM"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {inv.risk_tier} ({inv.risk_score})
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                {inv.status !== "PAID" ? (
                  <button
  onClick={() => handlePay(inv.id)}
  disabled={processingId === inv.id}
  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-700/50 disabled:cursor-not-allowed text-slate-950 font-semibold text-xs rounded transition shadow-sm flex items-center gap-1.5 ml-auto"
>
  {processingId === inv.id ? (
    <>
      <span className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
      <span>Generating Checkout...</span>
    </>
  ) : (
    "Pay via PayPal"
  )}
</button>
                ) : (
                  <span className="text-xs text-slate-500 italic">Settled</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}