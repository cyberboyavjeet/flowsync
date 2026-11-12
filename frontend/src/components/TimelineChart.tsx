import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { InvoiceRecord } from "../services/api";

interface TimelineChartProps {
  invoices: InvoiceRecord[];
  loading?: boolean;
}

export default function TimelineChart({ invoices, loading }: TimelineChartProps) {
  const chartData = useMemo(() => {
    const aggregates: { [key: string]: { date: string; amount: number; highRiskAmount: number } } = {};

    invoices.forEach((inv) => {
      const dateKey = new Date(inv.due_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      if (!aggregates[dateKey]) {
        aggregates[dateKey] = { date: dateKey, amount: 0, highRiskAmount: 0 };
      }

      aggregates[dateKey].amount += inv.amount;
      if (inv.risk_tier === "HIGH") {
        aggregates[dateKey].highRiskAmount += inv.amount;
      }
    });

    return Object.values(aggregates);
  }, [invoices]);

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Loading cash flow projection...</div>;
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-slate-400 mb-4">
        Projected Receivables Timeline & Risk Exposure
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Bar dataKey="amount" name="Total Inflow" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="highRiskAmount" name="At-Risk Inflow" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}