const API_BASE = "http://127.0.0.1:8000/api";

export interface InvoiceRecord {
  id: number;
  invoice_number: string;
  business_id: number;
  customer_name: string;
  amount: number;
  due_date: string;
  status: string;
  paypal_order_id: string | null;
  risk_score: number;
  risk_tier: string;
  created_at: string;
}

export async function getInvoices(): Promise<InvoiceRecord[]> {
  const res = await fetch(`${API_BASE}/invoices`);
  if (!res.ok) {
    throw new Error(`Failed to fetch invoices: ${res.statusText}`);
  }
  return res.json();
}
export async function payInvoice(invoiceId: number): Promise<{ approval_url: string; order_id: string }> {
  const res = await fetch(`${API_BASE}/invoices/${invoiceId}/pay`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Payment initiation failed");
  }
  return res.json();
}
export interface AgentRecommendation {
  invoice_id: number;
  invoice_number: string;
  customer_name: string;
  amount: number;
  risk_score: number;
  risk_tier: string;
  recommended_action: string;
  discount_amount: number;
  action_type: "OFFER_DISCOUNT" | "SEND_REMINDER";
}

export async function getAgentRecommendations(): Promise<AgentRecommendation[]> {
  const res = await fetch(`${API_BASE}/agent/recommendations`);
  if (!res.ok) {
    throw new Error("Failed to load agent recommendations");
  }
  return res.json();
}

export async function createInvoice(invoiceData: {
  invoice_number: string;
  business_id: number;
  customer_name: string;
  amount: number;
  due_date: string;
}): Promise<InvoiceRecord> {
  const res = await fetch(`${API_BASE}/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invoiceData),
  });
  if (!res.ok) {
    throw new Error(`Failed to create invoice: ${res.statusText}`);
  }
  return res.json();
}