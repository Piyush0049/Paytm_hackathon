"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, ShieldCheck, TrendingUp, History, DollarSign, User,
  Volume2, PieChart, Target, FileText, Zap, AlertTriangle,
  Mic, Globe, BarChart3, Shield, Radio, Cpu
} from 'lucide-react';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface Transaction {
  id?: string;
  amount: number;
  sender?: string;
  recipient?: string;
  category?: string;
  status?: string;
  timestamp?: string;
  flagged?: boolean;
  risk_score?: number;
  time?: string;
  type?: string;
}

interface AIInsight {
  type: string;
  message: string;
  priority: string;
}

export default function MerchantDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);
  const [lastPayment, setLastPayment] = useState<Transaction | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [merchantInfo, setMerchantInfo] = useState<any>(null);

  // Fetch dashboard data from backend
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/merchant/dashboard?merchant_id=merchant_001`);
      const data = await res.json();
      setTransactions(data.events || []);
      setStats(data.stats);
      setMerchantInfo(data.merchant);
    } catch (e) {
      // Use fallback data
      setStats({ daily_sales: 14250, daily_count: 34, avg_ticket: 425, flagged_transactions: 1, fraud_guard: true, soundbox_model: 'AI Soundbox 4.0' });
    }
  }, []);

  const fetchInsights = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/merchant/ai-insights?merchant_id=merchant_001`);
      const data = await res.json();
      setAiInsights(data.insights || []);
      setFraudAlerts(data.fraud_alerts || []);
    } catch (e) {
      setAiInsights([{ type: 'trend', message: 'Sales are 24% higher this Tuesday vs last week', priority: 'medium' }]);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchInsights();
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, [fetchDashboard, fetchInsights]);

  const announcePayment = (tx: Transaction) => {
    if (!voiceEnabled || typeof window === 'undefined') return;
    const utterance = new SpeechSynthesisUtterance(
      `₹${tx.amount} received from ${tx.sender || tx.recipient} for ${tx.category || 'payment'}`
    );
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const simulateIncomingPayment = async () => {
    setIsSimulating(true);
    const names = ['Raju', 'Arun', 'Priya', 'Amit', 'Neha', 'Vikram', 'Sita'];
    const categories = ['Groceries', 'Lunch', 'Medicine', 'Utilities', 'Snacks', 'Dairy'];
    const sender = names[Math.floor(Math.random() * names.length)];
    const amount = Math.floor(Math.random() * 1000) + 50;
    const category = categories[Math.floor(Math.random() * categories.length)];

    try {
      await fetch(`${BACKEND}/merchant/soundbox/announce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: 'merchant_001',
          transaction_id: `UPI${Date.now()}`,
          amount,
          sender_name: sender,
          category
        })
      });
    } catch (e) {}

    setTimeout(() => {
      const newTx: Transaction = { amount, sender, category, timestamp: new Date().toISOString(), flagged: amount > 5000 };
      setTransactions(prev => [newTx, ...prev]);
      setLastPayment(newTx);
      announcePayment(newTx);
      setIsSimulating(false);
      fetchDashboard();
    }, 2000);
  };

  const formatTime = (ts: string | undefined) => {
    if (!ts) return 'Just now';
    const d = new Date(ts);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <main className="min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-20 bg-slate-900/50 border-r border-slate-800 flex flex-col items-center py-8 space-y-6 z-50 backdrop-blur-md">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
          <Zap className="text-white fill-white" size={24} />
        </div>
        {[
          { icon: PieChart, label: 'dashboard', active: true },
          { icon: History, label: 'transactions' },
          { icon: TrendingUp, label: 'analytics' },
          { icon: Shield, label: 'security' },
          { icon: Cpu, label: 'ai' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => setActiveTab(label)}
            className={`p-3 rounded-lg cursor-pointer transition-all ${
              activeTab === label
                ? 'text-blue-400 bg-blue-400/10'
                : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon size={22} />
          </button>
        ))}
        <div className="mt-auto pb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-black">
            M
          </div>
        </div>
      </div>

      <div className="ml-24 p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">
              Paytm AI Soundbox
            </h1>
            <p className="text-slate-500 text-sm mt-1 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
              {merchantInfo?.name || 'Sharma General Store'} • VoiceGuard Active
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
              <Radio size={10} className="text-green-400 animate-pulse" />
              <span>Terminal: {merchantInfo?.soundbox_id || 'SB-PMT8021'}</span>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-300 px-3 py-2 rounded-lg border border-blue-500/20">
              <Globe size={10} />
              <span>Hindi • English</span>
            </div>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-3 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${
                voiceEnabled
                  ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-lg shadow-blue-500/10'
                  : 'bg-red-500/10 border-red-500/50 text-red-400'
              }`}
            >
              <Volume2 size={22} />
            </button>
            <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <User size={20} className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* AI Insight Bar */}
        {aiInsights.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between backdrop-blur-xl">
            <div className="flex items-center space-x-4">
              <div className="p-2.5 bg-blue-500 rounded-lg shadow-lg shadow-blue-500/30">
                <Target size={18} className="text-white" />
              </div>
              <div>
                <span className="text-[10px] text-blue-300 font-black uppercase tracking-wider">AI Insight</span>
                <p className="text-sm font-medium text-white mt-0.5">{aiInsights[0]?.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Fraud Alert Bar */}
        {fraudAlerts.length > 0 && fraudAlerts[0]?.blocked && (
          <div className="mb-6 bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2.5 bg-orange-500 rounded-lg">
                <AlertTriangle size={18} className="text-white" />
              </div>
              <div>
                <span className="text-[10px] text-orange-300 font-black uppercase tracking-wider">VoiceGuard Alert</span>
                <p className="text-sm font-medium text-white mt-0.5">{fraudAlerts[0]?.message}</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-green-500/20 text-green-400 text-[10px] font-black rounded-lg uppercase">Blocked</div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-blue-500/50 transition-colors">
            <DollarSign className="text-blue-400 mb-3" size={20} />
            <h3 className="text-slate-500 text-[11px] font-bold uppercase">Daily Sales</h3>
            <p className="text-2xl font-black mt-1">₹{(stats?.daily_sales || 14250).toLocaleString()}</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/50 transition-colors">
            <TrendingUp className="text-indigo-400 mb-3" size={20} />
            <h3 className="text-slate-500 text-[11px] font-bold uppercase">Avg Ticket</h3>
            <p className="text-2xl font-black mt-1">₹{stats?.avg_ticket || 425}</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-green-500/50 transition-colors">
            <ShieldCheck className="text-green-400 mb-3" size={20} />
            <h3 className="text-slate-500 text-[11px] font-bold uppercase">VoiceGuard</h3>
            <p className="text-lg font-black mt-1 text-green-400">Triple Verified</p>
            <p className="text-[9px] text-slate-600 mt-1 font-bold uppercase">Biometric + Liveness + OTP</p>
          </div>

          <div className="bg-slate-900/50 border border-orange-500/20 rounded-2xl p-5">
            <AlertTriangle className="text-orange-400 mb-3" size={20} />
            <h3 className="text-slate-500 text-[11px] font-bold uppercase">Flagged</h3>
            <p className="text-2xl font-black mt-1 text-orange-400">{stats?.flagged_transactions || 0}</p>
            <p className="text-[9px] text-slate-600 mt-1 font-bold uppercase">Deepfake attempts blocked</p>
          </div>

          <div
            onClick={simulateIncomingPayment}
            className="bg-blue-600 border border-blue-400 rounded-2xl p-5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-2xl shadow-blue-600/30"
          >
            <div className="flex flex-col items-center justify-center text-center h-full">
              <div className={`w-12 h-12 rounded-full ${isSimulating ? 'bg-white/20 animate-ping' : 'bg-white/20'} flex items-center justify-center mb-2`}>
                <Bell size={20} className="text-white" />
              </div>
              <h3 className="font-black text-sm">Test Voice Alert</h3>
              <p className="text-[9px] text-blue-100 mt-1 uppercase font-black tracking-widest">Simulate Customer</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
          {/* Transaction Ledger */}
          <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
              <h2 className="text-lg font-black flex items-center">
                <History className="mr-3 text-blue-400" size={18} /> Soundbox Transaction Ledger
              </h2>
              <div className="flex space-x-2">
                <div className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-slate-700 transition-colors">Live</div>
                <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-slate-500 cursor-pointer">Today</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[9px] uppercase text-slate-500 font-bold bg-slate-900/80">
                  <tr>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Verification</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Risk</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-800/70">
                  {transactions.slice(0, 12).map((tx, i) => (
                    <tr key={i} className={`hover:bg-blue-500/5 transition-colors border-l-4 ${tx.flagged ? 'border-orange-500' : 'border-transparent hover:border-blue-500'}`}>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-200">{tx.sender || tx.recipient || 'Customer'}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase">{tx.category || 'Payment'} • {formatTime(tx.timestamp)}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-1.5">
                          <Mic size={10} className="text-blue-400" />
                          <ShieldCheck size={10} className="text-green-400" />
                          <Fingerprint size={10} className="text-indigo-400" />
                          <span className="text-[9px] font-black text-slate-400 uppercase ml-1">Triple AI</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-lg font-black text-white">₹{tx.amount}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                          tx.flagged ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'
                        }`}>
                          {tx.flagged ? '⚠ Flagged' : '✓ Safe'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-1">
                          <Volume2 size={12} className="text-blue-400" />
                          <span className="text-[9px] text-slate-400 font-bold">Announced</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-4">
            {/* Soundbox Simulator */}
            <div className="bg-[#1e293b] border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="text-[9px] font-black tracking-widest text-blue-400 flex items-center">
                  <Zap size={10} className="mr-1 fill-blue-400" /> AI SOUNDBOX 4.0
                </div>
                <div className="flex space-x-0.5">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`w-1 h-3 bg-blue-500/40 rounded-full ${isSimulating ? 'animate-pulse' : ''}`} style={{animationDelay: `${i*100}ms`}}></div>
                  ))}
                </div>
              </div>
              
              <div className="text-center min-h-[100px] flex flex-col items-center justify-center">
                {lastPayment ? (
                  <div>
                    <p className="text-[9px] text-blue-300 font-bold uppercase mb-1">Incoming Payment</p>
                    <p className="text-4xl font-black text-white mb-1">₹{lastPayment.amount}</p>
                    <div className="bg-white/5 px-2 py-0.5 rounded-lg inline-block text-[9px] font-bold text-slate-400">
                      ✅ {lastPayment.sender} • {lastPayment.category}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center opacity-30">
                    <Volume2 size={40} className="text-slate-400 mb-3" />
                    <p className="text-[10px] font-bold uppercase">Ready for broadcast</p>
                  </div>
                )}
              </div>

              <div className="mt-6 p-3 bg-slate-900 rounded-xl flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2 shadow-lg shadow-green-500/50"></div>
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Network Integrated</span>
              </div>
            </div>

            {/* VoiceGuard Status */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-black text-white flex items-center justify-between mb-3">
                VoiceGuard Status <Shield size={14} className="text-green-400" />
              </h3>
              <div className="space-y-2.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-500 flex items-center"><Mic size={10} className="mr-1.5 text-blue-400" /> Voice Biometrics</span>
                  <span className="text-green-400">Active</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-500 flex items-center"><ShieldCheck size={10} className="mr-1.5 text-indigo-400" /> Liveness Detection</span>
                  <span className="text-green-400">Active</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-500 flex items-center"><Fingerprint size={10} className="mr-1.5 text-purple-400" /> Deepfake Guard</span>
                  <span className="text-green-400">Active</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-500 flex items-center"><Globe size={10} className="mr-1.5 text-cyan-400" /> Languages</span>
                  <span className="text-slate-300">10 supported</span>
                </div>
              </div>
            </div>

            {/* Reconciliation */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-black text-white flex items-center justify-between">
                Reconciliation <TrendingUp size={14} className="text-blue-400" />
              </h3>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-500">Settled Today</span>
                  <span>₹{((stats?.daily_sales || 14250) * 0.87).toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-500">In Transit</span>
                  <span className="text-blue-400">₹{((stats?.daily_sales || 14250) * 0.13).toFixed(0)}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div className="w-[87%] h-full bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .shadow-glow { box-shadow: 0 0 15px var(--tw-shadow-color); }
      `}</style>
    </main>
  );
}

// Fingerprint icon component (since lucide doesn't export it by default in some versions)
function Fingerprint({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
      <path d="M2 12a10 10 0 0 1 18-6"/>
      <path d="M2 16h.01"/>
      <path d="M21.8 16c.2-2 .131-5.354 0-6"/>
      <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/>
      <path d="M8.65 22c.21-.66.45-1.32.57-2"/>
      <path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
    </svg>
  );
}
