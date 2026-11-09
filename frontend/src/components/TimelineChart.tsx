import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, ReferenceLine } from 'recharts';
import { CashFlowDataPoint } from '../data/mockData';

interface TimelineChartProps {
  data: CashFlowDataPoint[];
  isRecovered: boolean;
}

export function TimelineChart({ data, isRecovered }: TimelineChartProps) {
  // Find where it dips below zero for the reference area
  const today = new Date().toISOString().split('T')[0];
  
  let dipStart = '';
  let dipEnd = '';
  
  for (const point of data) {
    if (point.isForecast && point.projected < 0) {
      if (!dipStart) dipStart = point.date;
      dipEnd = point.date;
    }
  }

  return (
    <div className="bg-card p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">90-Day Cash Flow Forecast</h2>
          <p className="text-sm text-slate-500">Predict & Reforecast Loop</p>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-slate-800 mr-2"></div> Actual</div>
          <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-primary mr-2"></div> Projected</div>
        </div>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(tick) => {
                const d = new Date(tick);
                return `${d.getMonth()+1}/${d.getDate()}`;
              }}
              minTickGap={30}
              stroke="#94a3b8"
            />
            <YAxis 
              tickFormatter={(tick) => `$${tick/1000}k`}
              stroke="#94a3b8"
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cash']}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <ReferenceLine x={today} stroke="#4f46e5" strokeDasharray="3 3" label="Today" />
            
            {/* Highlight Red Zone if not recovered */}
            {!isRecovered && dipStart && dipEnd && (
              <ReferenceArea x1={dipStart} x2={dipEnd} fill="#fee2e2" fillOpacity={0.5} />
            )}
            
            <Line 
              type="monotone" 
              dataKey="cashOnHand" 
              stroke="#1e293b" 
              strokeWidth={3} 
              dot={false}
              connectNulls
            />
            <Line 
              type="monotone" 
              dataKey="projected" 
              stroke={isRecovered ? "#10b981" : "#4f46e5"} 
              strokeWidth={3} 
              strokeDasharray="5 5" 
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
