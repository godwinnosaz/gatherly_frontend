import React from 'react';
import StatWidget from '../widgets/StatWidget';
import QuickActions from '../widgets/QuickActions';
import ActivityFeed from '../widgets/ActivityFeed';
import SectionCard from '../ui/SectionCard';
import { 
  Users, UserPlus, Calendar, Mail, FileText, Send, 
  PlusCircle, CheckCircle, Loader2, AlertCircle, Landmark,
  ArrowUpRight, ArrowDownRight, DollarSign, Clock, ClipboardList
} from 'lucide-react';
import { useIntelligence } from '../../hooks/useIntelligence';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const FellowshipDashboard = () => {
    const { data, loading, error, refetch } = useIntelligence();
    const navigate = useNavigate();
    const { role } = useAuth();

    if (loading) return (
        <div className="space-y-8 animate-pulse pt-4">
            <div className="h-28 bg-slate-200/60 rounded-[2.5rem] w-full"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-slate-100 rounded-[2rem]"></div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-64 bg-slate-100 rounded-[2.5rem]"></div>
                <div className="h-64 bg-slate-100 rounded-[2.5rem]"></div>
            </div>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border border-red-200 text-red-800 p-8 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-center max-w-xl mx-auto my-12">
            <AlertCircle size={40} className="text-red-500" />
            <div className="space-y-1">
                <h3 className="text-xl font-black uppercase tracking-tight">Dashboard Sync Offline</h3>
                <p className="text-sm text-slate-500 font-medium">{error}</p>
            </div>
            <button 
                onClick={refetch}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all text-sm shadow-md"
            >
                Retry Sync
            </button>
        </div>
    );

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-NG', { 
            style: 'currency', 
            currency: 'NGN', 
            maximumFractionDigits: 0 
        }).format(value || 0);
    };

    const balance = data?.finance?.balance || data?.finance?.net_fund || 0;
    const monthlyIncome = data?.finance?.income || data?.finance?.total_income || 0;
    const monthlyExpense = data?.finance?.expense || data?.finance?.total_expense || 0;

    const stats = [
        { 
            title: 'Active Members', 
            value: data?.summary?.active_base || 0, 
            icon: Users, 
            trend: 'up', 
            trendValue: `${data?.summary?.new_signups || 0} this month` 
        },
        { 
            title: 'Attendance Rate', 
            value: `${data?.summary?.weekly_active || 0}%`, 
            icon: CheckCircle, 
            trend: 'up', 
            trendValue: 'Live' 
        },
        { 
            title: 'Treasury Balance', 
            value: formatCurrency(balance), 
            icon: DollarSign,
            trend: 'up'
        },
        { 
            title: 'Risk Members', 
            value: data?.summary?.retention_risk_count || 0, 
            icon: Mail, 
            color: 'red' 
        },
    ];

    let actions = [];
    if (role === 'president') {
        actions = [
            { label: 'Pending Approvals', icon: Clock, onClick: () => navigate('/dashboard/approvals') },
            { label: 'Finance Summary', icon: Landmark, onClick: () => navigate('/dashboard/finance') },
            { label: 'Approval Flow', icon: CheckCircle, onClick: () => navigate('/dashboard/approvals') },
        ];
    } else if (role === 'secretary') {
        actions = [
            { label: 'Requests for Review', icon: Clock, onClick: () => navigate('/dashboard/approvals') },
            { label: 'Budget Requests', icon: FileText, onClick: () => navigate('/dashboard/approvals') },
            { label: 'Reports', icon: FileText, onClick: () => navigate('/dashboard') },
        ];
    } else if (role === 'finance_officer') {
        actions = [
            { label: 'Record Income', icon: ArrowUpRight, onClick: () => navigate('/dashboard/finance') },
            { label: 'Record Expense', icon: ArrowDownRight, onClick: () => navigate('/dashboard/finance') },
            { label: 'Finance Accounts', icon: Landmark, onClick: () => navigate('/dashboard/finance') },
            { label: 'Finance Reports', icon: FileText, onClick: () => navigate('/dashboard/finance') },
        ];
    } else {
        // default / super_admin / fellowship_admin
        actions = [
            { label: 'Add Member', icon: UserPlus, onClick: () => navigate('/dashboard/members') },
            { label: 'Record Attendance', icon: PlusCircle, onClick: () => navigate('/dashboard/events') },
            { label: 'Manage Units', icon: Calendar, onClick: () => navigate('/dashboard/units') },
            { label: 'Finances', icon: FileText, onClick: () => navigate('/dashboard/finance') },
        ];
    }

    const renderPrioritySection = () => {
        if (role === 'president') {
            return (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-black text-blue-900 uppercase tracking-tight">Approval Priority Queue</h3>
                        <p className="text-xs text-blue-700 font-medium mt-1">You have pending budget requests awaiting your executive presidential sign-off.</p>
                    </div>
                    <button 
                        onClick={() => navigate('/dashboard/approvals')}
                        className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shrink-0"
                    >
                        Review Requests
                    </button>
                </div>
            );
        }
        if (role === 'secretary') {
            return (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 p-6 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-black text-purple-900 uppercase tracking-tight">Secretarial Review Queue</h3>
                        <p className="text-xs text-purple-700 font-medium mt-1">Review new member signups, department requests, and prepare minutes.</p>
                    </div>
                    <button 
                        onClick={() => navigate('/dashboard/approvals')}
                        className="px-5 py-2.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shrink-0"
                    >
                        Open Approvals
                    </button>
                </div>
            );
        }
        if (role === 'finance_officer') {
            return (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-6 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-black text-emerald-900 uppercase tracking-tight">Treasury & Finance Hub</h3>
                        <p className="text-xs text-emerald-700 font-medium mt-1">Audited double-entry ledger is active. Record collections and verify expenses.</p>
                    </div>
                    <button 
                        onClick={() => navigate('/dashboard/finance')}
                        className="px-5 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shrink-0"
                    >
                        Manage Ledgers
                    </button>
                </div>
            );
        }
        return null;
    };

    const activities = data?.recommendations?.map(rec => ({
        title: rec.title,
        description: rec.text,
        icon: rec.type === 'alert' ? CheckCircle : Mail,
        type: rec.type === 'alert' ? 'success' : 'info',
        time: 'JUST NOW'
    })) || [];

    return (
        <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-700">
            {/* Core Feature Focus: Double-Entry Financial Accountability Center */}
            <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-700/30 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700" />
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-400/20 text-blue-300 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest self-start">
                            <Landmark size={14} className="animate-pulse" />
                            Audited Financial Accounts
                        </div>
                        <h2 className="text-3xl font-black tracking-tight uppercase">Fellowship Accountability</h2>
                        <p className="text-slate-400 text-sm font-medium max-w-lg leading-relaxed">
                            Track live church collections, ministry expenses, and visual allocations with double-entry ledgers.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md w-full lg:w-auto shrink-0">
                        <div className="space-y-1 pr-4 sm:border-r border-white/10">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Net Ledger Balance</span>
                            <span className="text-2xl font-black text-emerald-400">{formatCurrency(balance)}</span>
                        </div>
                        <div className="space-y-1 pr-4 sm:border-r border-white/10">
                            <div className="flex items-center gap-1">
                                <ArrowUpRight size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Income</span>
                            </div>
                            <span className="text-xl font-black text-white">{formatCurrency(monthlyIncome)}</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-1">
                                <ArrowDownRight size={14} className="text-rose-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Expenses</span>
                            </div>
                            <span className="text-xl font-black text-white">{formatCurrency(monthlyExpense)}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Priority Actions section based on role */}
            {renderPrioritySection()}

            {/* Section 1: Overview */}
            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-6">Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => <StatWidget key={i} {...stat} />)}
                </div>
            </section>
            
            <section>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <SectionCard 
                        title="Action Hub" 
                        description="Direct access to core fellowship tools."
                        actionLabel="View All Tools"
                        onAction={() => {}}
                    >
                        <div className="grid grid-cols-2 gap-4">
                            {actions.map((action, i) => (
                                <button 
                                    key={i} 
                                    onClick={action.onClick}
                                    className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all group/btn flex flex-col items-center text-center gap-3"
                                >
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover/btn:text-primary transition-colors border border-slate-100 group-hover/btn:border-primary/20 shadow-sm">
                                        <action.icon size={22} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </SectionCard>
                    
                    <ActivityFeed 
                        title="Recent Activity" 
                        description="Tracking member engagement and signups."
                        items={activities} 
                        actionLabel="View History"
                        onAction={() => {}}
                    />
                </div>
            </section>
        </div>
    );
};

export default FellowshipDashboard;
