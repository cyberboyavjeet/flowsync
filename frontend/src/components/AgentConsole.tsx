import { useState } from 'react';
import { Bot, Info, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

interface AgentConsoleProps {
  onTakeAction: () => void;
  isActionTaken: boolean;
}

export function AgentConsole({ onTakeAction, isActionTaken }: AgentConsoleProps) {
  const [isExecuting, setIsExecuting] = useState(false);

  const handleAction = () => {
    setIsExecuting(true);
    // Simulate API Call delay
    setTimeout(() => {
      setIsExecuting(false);
      onTakeAction();
    }, 2000);
  };

  return (
    <div className="w-[350px] bg-slate-50 border-l border-slate-200 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 bg-white flex items-center space-x-2">
        <Bot className="text-primary" size={24} />
        <h2 className="text-lg font-semibold text-slate-800">AI Recovery Agent</h2>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {!isActionTaken && !isExecuting && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-slate-500 mb-4 animate-pulse">
              <Loader2 className="animate-spin" size={16} />
              <span>Investigating Cash-Flow Alert...</span>
            </div>
            
            <div className="bg-white border border-red-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
              <h3 className="font-semibold text-slate-800 mb-2">High Default Risk Detected</h3>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Client <strong className="text-slate-900">Acme Corp</strong> has an 85% default risk. 
                A projected <strong className="text-red-600">$4,000 shortfall</strong> is expected on the 15th due to this unpaid invoice.
              </p>
              
              <div className="flex space-x-3 mt-4">
                <button className="flex-1 flex items-center justify-center space-x-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                  <Info size={16} />
                  <span>Explain</span>
                </button>
                <button 
                  onClick={handleAction}
                  className="flex-[2] bg-primary hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  Approve & Send PayPal Reminder
                </button>
              </div>
            </div>
          </div>
        )}

        {isExecuting && (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
            <Loader2 className="animate-spin text-primary" size={40} />
            <div>
              <p className="font-semibold text-slate-800">Executing via PayPal API...</p>
              <p className="text-sm text-slate-500">Dispatching intelligent reminder sequence</p>
            </div>
          </div>
        )}

        {isActionTaken && !isExecuting && (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-lg">Action Successful</p>
              <p className="text-sm text-slate-500 mb-6">Payment plan activated via PayPal.</p>
              <button className="flex items-center space-x-2 text-primary hover:text-indigo-700 font-medium text-sm mx-auto">
                <span>View Transaction Log</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
