export interface Invoice {
  id: string;
  clientName: string;
  invoiceAmount: number;
  daysOverdue: number;
  riskScore: number;
  status: string;
}

export const initialInvoices: Invoice[] = [
  { id: 'INV-001', clientName: 'Acme Corp', invoiceAmount: 4000, daysOverdue: 15, riskScore: 85, status: 'Overdue' },
  { id: 'INV-002', clientName: 'Globex Inc', invoiceAmount: 12500, daysOverdue: 5, riskScore: 45, status: 'Overdue' },
  { id: 'INV-003', clientName: 'Soylent Corp', invoiceAmount: 8000, daysOverdue: 0, riskScore: 10, status: 'Pending' },
  { id: 'INV-004', clientName: 'Initech', invoiceAmount: 2200, daysOverdue: 30, riskScore: 92, status: 'Critical' },
  { id: 'INV-005', clientName: 'Umbrella Corp', invoiceAmount: 15000, daysOverdue: -5, riskScore: 5, status: 'Upcoming' },
];

export interface CashFlowDataPoint {
  date: string;
  cashOnHand: number;
  projected: number;
  isForecast: boolean;
}

export const generateTimelineData = (isRecovered: boolean): CashFlowDataPoint[] => {
  const data: CashFlowDataPoint[] = [];
  const today = new Date();
  
  let currentCash = 15000;
  
  for (let i = -10; i <= 80; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Simulate some cash flow changes
    if (i < 0) {
      // Past
      data.push({
        date: dateStr,
        cashOnHand: currentCash - (i * 1000) + (Math.random() * 2000), // Faking past data
        projected: 0,
        isForecast: false,
      });
    } else {
      // Future
      // Trending down until day 18, then dipping below zero
      let projectedCash = currentCash - (i * 600);
      
      // The recovery action saves us $4000
      if (isRecovered && i >= 15) {
          projectedCash += 4000;
      }

      data.push({
        date: dateStr,
        cashOnHand: i === 0 ? currentCash : 0,
        projected: i === 0 ? currentCash : projectedCash,
        isForecast: true,
      });
    }
  }
  
  return data;
};
