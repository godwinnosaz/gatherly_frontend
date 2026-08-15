import React from 'react';
import StatWidget from '../widgets/StatWidget';
import TrendChart from '../widgets/TrendChart';
import ActivityFeed from '../widgets/ActivityFeed';
import { 
  Users, Calendar, DollarSign, Bell, 
  ShieldAlert, Loader2, Sparkles, AlertCircle, ArrowUpRight, 
  ArrowDownRight, Landmark 
} from 'lucide-react';
import AnnouncementFeed from '../notifications/AnnouncementFeed';
import { useIntelligence } from '../../hooks/useIntelligence';
import SetupChecklistCard from '../widgets/SetupChecklistCard';
import { useNavigate } from 'react-router-dom';
import SectionCard from '../ui/SectionCard';

const PastorDashboard = () => {
    const { data, loading, error, refetch } = useIntelligence();
    const navigate = useNavigate();
    
    const actions = [
        { label: 'Leadership Overview', icon: Users, onClick: () => navigate('/dashboard') },
        { label: 'Finance Visibility', icon: Landmark, onClick: () => navigate('/dashboard/finance') },
        { label: 'Attendance/Growth Summary', icon: Calendar, onClick: () => navigate('/dashboard/events') },
    ];

    if (loading) return (
        <div className="space-y-8 animate-pulse pt-4">
            <div className="h-28 bg-slate-200/60 rounded-[2.5rem] w-full"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-slate-100 rounded-[2rem]"></div>
                ))}
            </div>
            <div className="h-96 bg-slate-100 rounded-[2.5rem]"></div>
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

    // Format currencies consistently
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
            title: 'Total Members', 
            value: data?.summary?.active_base || 0, 
            icon: Users, 
            trend: 'up', 
            trendValue: `${data?.summary?.new_signups || 0} new` 
        },
        { 
            title: 'Attendance Rate', 
            value: `${data?.summary?.weekly_active || 0}%`, 
            icon: Calendar, 
            trend: 'up',
            trendValue: 'Target 90%'
        },
        { 
            title: 'Retention Risk', 
            value: data?.summary?.retention_risk_count || 0, 
            icon: ShieldAlert, 
            trend: 'down', 
            color: 'red' 
        },
        { 
            title: 'Treasury Balance', 
            value: formatCurrency(balance), 
            icon: DollarSign, 
            trend: 'up' 
        },
    ];

    const chartData = data?.trends?.growth?.map(d => ({
        month: d.month.includes('-') ? d.month.split('-')[1] : d.month,
        value: d.count
    })) || [];

    const alerts = data?.recommendations?.map(rec => ({
        title: rec.title,
        description: rec.text,
        icon: rec.type === 'alert' ? ShieldAlert : Sparkles,
        type: rec.type,
        time: 'JUST NOW'
    })) || [];

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <SetupChecklistCard />
            {/* Core Feature Focus: Double-Entry Financial Accountability Center */}
            <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-700/30 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700" />
                <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-400/20 text-blue-300 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest self-start">
                            <Landmark size={14} className="animate-pulse" />
                            Double-Entry Ledger Active
                        </div>
                        <h2 className="text-3xl font-black tracking-tight uppercase">Financial Accountability Center</h2>
                        <p className="text-slate-400 text-sm font-medium max-w-lg leading-relaxed">
                            Gatherly's secure dual-ledger accounting safeguards fellowship resources with strict audit accountability.
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

            {/* Key Metrics */}
            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-6">Key Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => <StatWidget key={i} {...stat} />)}
                </div>
            </section>

            {/* Leadership Action Hub */}
            <section>
                <SectionCard 
                    title="Leadership Action Hub" 
                    description="Executive oversight tools for pastoral administration."
                >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
            </section>
            
            <section>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ActivityFeed 
                        title="Intelligence Pulse" 
                        description="Real-time alerts and engagement insights."
                        items={alerts} 
                        actionLabel="View All Alerts"
                        onAction={() => {}}
                    />
                    <div className="bg-white border border-slate-100 p-1 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.02)] h-full overflow-hidden">
                        <AnnouncementFeed />
                    </div>
                </div>
            </section>

            <section>
                <TrendChart 
                    title="Attendance & Growth" 
                    subtitle="Engagement trends across all fellowship groups."
                    data={chartData.length > 0 ? chartData : [{ month: 'N/A', value: 0 }]} 
                    actionLabel="Detailed Analysis"
                    onAction={() => {}}
                />
            </section>
        </div>
    );
};

export default PastorDashboard;
