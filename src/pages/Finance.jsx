import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    DollarSign, Download, PieChart, CreditCard, 
    ChevronUp, ChevronDown, Plus, Filter,
    FileText, History, Wallet, ArrowUpRight, ArrowDownRight,
    Search, ShieldAlert
} from 'lucide-react';
import PermissionGate from '../components/PermissionGate';
import api from '../api/axios';
import SectionCard from '../components/ui/SectionCard';

const FinanceCard = ({ label, amount, icon: Icon, percentage, positive, color = 'primary' }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="section-card section-card-hover p-8 h-full flex flex-col justify-between"
  >
    <div className="flex justify-between items-start mb-8">
      <div className={`p-4 rounded-2xl border shadow-sm ${
          color === 'green' ? 'bg-emerald-50 text-secondary border-emerald-100' :
          color === 'red' ? 'bg-rose-50 text-rose-500 border-rose-100' :
          color === 'gold' ? 'bg-amber-50 text-accent border-amber-100' :
          'bg-blue-50 text-primary border-blue-100'
      }`}>
        <Icon className="w-6 h-6" />
      </div>
      {percentage && (
        <div className={`flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-xl border ${positive ? 'bg-emerald-50 text-secondary border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
          {positive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span className="uppercase tracking-widest">{percentage}%</span>
        </div>
      )}
    </div>
    <div>
        <div className="text-slate-400 text-[10px] mb-2 uppercase tracking-[0.3em] font-black ml-1">{label}</div>
        <div className="text-4xl font-black text-slate-900 tracking-tighter">
            {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount)}
        </div>
    </div>
  </motion.div>
);

const TransactionCard = ({ tx }) => {
    const isIncome = tx.type === 'income';
    return (
        <div className="flex flex-col p-8 section-card section-card-hover gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border ${isIncome ? 'bg-emerald-50 text-secondary border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'} shadow-sm`}>
                        {isIncome ? <ArrowUpRight className="w-8 h-8" /> : <ArrowDownRight className="w-8 h-8" />}
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-slate-900 tracking-tight leading-none">{tx.description || 'General Transfer'}</h4>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3">{new Date(tx.transaction_date).toLocaleDateString()} • {isIncome ? 'Money In' : 'Money Out'}</p>
                    </div>
                </div>
                <span className={`font-black text-2xl tracking-tighter ${isIncome ? 'text-secondary' : 'text-rose-500'}`}>
                    {isIncome ? '+' : '-'}
                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(tx.amount)}
                </span>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    <span className="text-sm text-slate-500 font-bold">{tx.member_name || 'System'}</span>
                </div>
                <span className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100">
                    {tx.category_name || 'Uncategorized'}
                </span>
            </div>
        </div>
    );
};

const Finance = () => {
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({ total_income: 0, total_expense: 0 });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchFinanceData();
    }, [filter]);

    const fetchFinanceData = async () => {
        setLoading(true);
        try {
            const [txRes, sumRes, catRes] = await Promise.all([
                api.get(`/finance/transactions?type=${filter === 'all' ? '' : filter}`),
                api.get('/finance/summary'),
                api.get('/finance/categories')
            ]);
            setTransactions(txRes.data);
            setSummary(sumRes.data || { total_income: 0, total_expense: 0 });
            setCategories(catRes.data);
        } catch (error) {
            console.error('Error fetching finance data', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Finances</h1>
                        <p className="text-sm text-slate-500 mt-3 font-medium max-w-md leading-relaxed">A simple view of your fellowship's money. Trustworthy and transparent.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <PermissionGate allowedRoles={['super_admin', 'pastor']}>
                            <button className="btn-outline w-full sm:w-auto">
                                <Plus className="w-4 h-4" />
                                <span>Add Expense</span>
                            </button>
                            <button className="btn-secondary w-full sm:w-auto">
                                <Plus className="w-4 h-4" />
                                <span>Add Income</span>
                            </button>
                        </PermissionGate>
                    </div>
                </div>

                <section>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FinanceCard 
                            label="Balance" 
                            amount={summary.total_income - summary.total_expense} 
                            icon={Wallet} 
                            color="gold" 
                        />
                        <FinanceCard 
                            label="Money In" 
                            amount={summary.total_income} 
                            icon={ArrowUpRight} 
                            percentage="12" 
                            positive={true} 
                            color="green" 
                        />
                        <FinanceCard 
                            label="Money Out" 
                            amount={summary.total_expense} 
                            icon={ArrowDownRight} 
                            percentage="5" 
                            positive={false} 
                            color="red" 
                        />
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Transaction History */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-6 sm:p-8">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-primary shadow-lg shadow-blue-900/5">
                                            <History size={28} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-2xl text-slate-900 tracking-tighter uppercase leading-none">Money Log</h3>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Every coin accounted for</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center bg-white p-2 rounded-[1.5rem] border border-slate-200 shadow-sm overflow-x-auto hide-scrollbar">
                                        <button 
                                            onClick={() => setFilter('all')}
                                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === 'all' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-400 hover:text-slate-900'}`}
                                        >
                                            Everything
                                        </button>
                                        <button 
                                            onClick={() => setFilter('income')}
                                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === 'income' ? 'bg-secondary text-white shadow-xl shadow-emerald-900/20' : 'text-slate-400 hover:text-secondary'}`}
                                        >
                                            In
                                        </button>
                                        <button 
                                            onClick={() => setFilter('expense')}
                                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === 'expense' ? 'bg-rose-500 text-white shadow-xl shadow-rose-900/20' : 'text-slate-400 hover:text-rose-500'}`}
                                        >
                                            Out
                                        </button>
                                    </div>
                                </div>
                            
                            <div className="space-y-3">
                                {loading ? (
                                    <div className="py-16 flex flex-col items-center justify-center gap-4">
                                        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
                                        <p className="text-sm font-bold text-slate-400">Loading transactions...</p>
                                    </div>
                                ) : transactions.length === 0 ? (
                                    <div className="py-16 flex flex-col items-center text-center max-w-sm mx-auto space-y-4">
                                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                                            <FileText size={32} className="text-slate-400" />
                                        </div>
                                        <p className="text-slate-500 font-medium">No transactions found for this period.</p>
                                    </div>
                                ) : (
                                    transactions.map((tx) => (
                                        <TransactionCard key={tx.id} tx={tx} />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Allocation & Security */}
                    <div className="space-y-8">
                        <SectionCard 
                            title="Fund Allocation" 
                            description="Distribution across financial categories."
                            icon={PieChart}
                        >
                            <div className="space-y-8">
                                {categories.slice(0, 5).map((cat) => (
                                    <div key={cat.id} className="group">
                                        <div className="flex justify-between items-center mb-3 text-xs font-black uppercase tracking-widest">
                                            <span className="text-slate-400 group-hover:text-primary transition-colors">{cat.name}</span>
                                            <span className="text-slate-900">₦{cat.type === 'income' ? '420k' : '150k'}</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden shadow-inner border border-slate-100">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.random() * 60 + 20}%` }}
                                                className={`h-full rounded-full ${cat.type === 'income' ? 'bg-secondary shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {categories.length === 0 && (
                                    <div className="text-center py-12">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No categories set</p>
                                    </div>
                                )}
                            </div>
                        </SectionCard>

                        <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl shadow-slate-900/30 text-center relative overflow-hidden group">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all" />
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/20 mx-auto mb-8 relative z-10">
                                <ShieldAlert size={32} />
                            </div>
                            <h4 className="font-black text-2xl text-white tracking-tighter mb-4 uppercase relative z-10">Secure Records</h4>
                            <p className="text-sm text-slate-400 leading-relaxed font-medium mb-10 opacity-80 relative z-10">
                                Every transaction is securely logged. Actions cannot be erased, ensuring complete trust and transparency.
                            </p>
                            <button className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl relative z-10">
                                View Security Logs
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Finance;
