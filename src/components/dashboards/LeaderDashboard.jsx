import React from 'react';
import StatWidget from '../widgets/StatWidget';
import ActivityFeed from '../widgets/ActivityFeed';
import SectionCard from '../ui/SectionCard';
import { Users, ClipboardList, TrendingUp, AlertCircle, Clock, Calendar, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIntelligence } from '../../hooks/useIntelligence';

const LeaderDashboard = () => {
    const navigate = useNavigate();
    const { data, loading, error, refetch } = useIntelligence();

    if (loading) return (
        <div className="space-y-8 animate-pulse pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-slate-100 rounded-[2rem]"></div>
                ))}
            </div>
            <div className="h-64 bg-slate-100 rounded-[2.5rem]"></div>
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

    const stats = [
        { title: 'Unit Members', value: data?.summary?.active_base || 0, icon: Users },
        { title: 'Avg. Consistency', value: `${data?.summary?.weekly_active || 0}%`, icon: TrendingUp, trend: 'up', trendValue: 'Live' },
        { title: 'Retention Risk', value: data?.summary?.retention_risk_count || 0, icon: AlertCircle, color: data?.summary?.retention_risk_count > 0 ? 'red' : undefined },
        { title: 'Unit Health', value: data?.summary?.health_indicator || 'Good', icon: Clock },
    ];

    const actions = [
        { label: 'My Unit', icon: Calendar, onClick: () => navigate('/dashboard/units') },
        { label: 'Create Budget Request', icon: FileText, onClick: () => navigate('/dashboard/finance') },
        { label: 'My Requests', icon: ClipboardList, onClick: () => navigate('/dashboard/approvals') },
    ];

    const alerts = data?.notifications?.slice(0, 3)?.map(n => ({
        title: n.title || 'System Notification',
        description: n.message || n.description || '',
        icon: AlertCircle,
        type: n.type || 'info',
        time: 'Recent'
    })) || [
        { title: 'Schedule Updated', description: 'Upcoming service unit roster is live.', icon: ClipboardList, type: 'info', time: 'Today' },
    ];

    return (
        <div className="space-y-12 animate-in slide-in-from-left-4 duration-700">
            {/* Section 1: Department Health */}
            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-6">Department Health</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => <StatWidget key={i} {...stat} />)}
                </div>
            </section>

            {/* Action Hub */}
            <section>
                <SectionCard 
                    title="Action Hub" 
                    description="Direct access to core leader tools."
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
                <SectionCard 
                    title="Staff Performance" 
                    description="Operational health across departmental sub-groups."
                    actionLabel="Performance Audit"
                    onAction={() => {}}
                >
                    <div className="space-y-8">
                        {[
                            { name: 'Media Dept', health: 92, status: 'Optimal' },
                            { name: 'Music Ministry', health: 78, status: 'Needs Follow-up' },
                            { name: 'Ushering', health: 85, status: 'Stable' },
                        ].map((d, i) => (
                            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-3">
                                        <span className="text-slate-400">{d.name}</span>
                                        <span className="text-slate-900">{d.health}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                                        <div className="h-full bg-secondary" style={{ width: `${d.health}%` }} />
                                    </div>
                                </div>
                                <div className="w-full sm:w-32 text-left sm:text-right">
                                    <span className={`inline-block text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border ${
                                        d.status === 'Optimal' ? 'bg-emerald-50 text-secondary border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                                    }`}>{d.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            </section>

            <section>
                <div className="max-w-4xl">
                    <ActivityFeed 
                        title="Department Pulse" 
                        description="Recent alerts and critical staff updates."
                        items={alerts} 
                        actionLabel="Full Activity Log"
                        onAction={() => {}}
                    />
                </div>
            </section>
        </div>
    );
};

export default LeaderDashboard;
