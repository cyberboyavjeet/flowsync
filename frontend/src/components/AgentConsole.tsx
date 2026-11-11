import React, { useEffect, useState } from "react";
import { getAgentRecommendations, AgentRecommendation, payInvoice } from "../services/api";

interface AgentConsoleProps {
  onActionTriggered?: () => void;
}

export const AgentConsole: React.FC<AgentConsoleProps> = ({ onActionTriggered }) => {
  const [recommendations, setRecommendations] = useState<AgentRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const data = await getAgentRecommendations();
      setRecommendations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleExecute = async (rec: AgentRecommendation) => {
    if (rec.action_type === "OFFER_DISCOUNT") {
      setActiveMessage(`Generating discounted PayPal order for ${rec.customer_name}...`);
      try {
        const res = await payInvoice(rec.invoice_id);
        if (res.approval_url) {
          window.open(res.approval_url, "_blank");
          setActiveMessage(`Discount payment link opened for ${rec.invoice_number}!`);
        }
      } catch (err: any) {
        setActiveMessage(`Action failed: ${err.message}`);
      }
    } else {
      setActiveMessage(`Automated reminder dispatched to ${rec.customer_name} for ${rec.invoice_number}.`);
    }

    if (onActionTriggered) onActionTriggered();
    setTimeout(() => setActiveMessage(null), 5000);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <h2 className="text-base font-semibold text-white">FlowSync Autonomous Action Agent</h2>
        </div>
        <button
          onClick={fetchActions}
          className="text-xs text-slate-400 hover:text-slate-200 transition"
        >
          Re-evaluate
        </button>
      </div>

      {activeMessage && (
        <div className="mt-3 p-3 bg-blue-950/60 border border-blue-500/50 rounded text-blue-200 text-xs">
          {activeMessage}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="text-slate-500 text-xs py-4 text-center">Agent scanning active ledger risk...</div>
        ) : recommendations.length === 0 ? (
          <div className="text-slate-400 text-xs py-4 text-center">
            Ledger stable: No elevated default risks detected across pending invoices.
          </div>
        ) : (
          recommendations.map((rec) => (
            <div
              key={rec.invoice_id}
              className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs"
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-300 font-semibold">{rec.invoice_number}</span>
                  <span className="text-slate-400">({rec.customer_name})</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    rec.risk_tier === "HIGH" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {rec.risk_tier} RISK ({rec.risk_score})
                  </span>
                </div>
                <p className="text-slate-300">{rec.recommended_action}</p>
              </div>

              <button
                onClick={() => handleExecute(rec)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded transition text-xs whitespace-nowrap ml-4"
              >
                Execute Agent Action
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AgentConsole;