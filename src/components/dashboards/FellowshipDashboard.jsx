import React from 'react';
import StatWidget from '../widgets/StatWidget';
import QuickActions from '../widgets/QuickActions';
import ActivityFeed from '../widgets/ActivityFeed';
import { Users, UserPlus, Calendar, Mail, FileText, Send, PlusCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useIntelligence } from '../../hooks/useIntelligence';
import { useNavigate } from 'react-router-dom';

const FellowshipDashboard = () => {
    const { data, loading } = useIntelligence();
    const navigate = useNavigate();

    if (loading) return (
        <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-secondary animate-spin" />
        </div>
    );

    const stats = [
        { 
            title: 'Active Members', 
            value: data?.summary?.active_base || 0, 
            icon: Users, 
            trend: 'up', 
            trendValue: `${data?.summary?.new_signups || 0} this month` 
        },
        { 
            title: 'Weekly Active', 
            value: data?.summary?.weekly_active || 0, 
            icon: CheckCircle, 
            trend: 'up', 
            trendValue: 'Live' 
        },
        { 
            title: 'Departments', 
            value: data?.departments?.length || 0, 
            icon: Calendar 
        },
        { 
            title: 'Risk Members', 
            value: data?.summary?.retention_risk_count || 0, 
            icon: Mail, 
            color: 'red' 
        },
    ];

    const actions = [
        { label: 'Add Member', icon: UserPlus, onClick: () => navigate('/dashboard/members') },
        { label: 'Record Attendance', icon: PlusCircle, onClick: () => navigate('/dashboard/events') },
        { label: 'Intelligence', icon: Send, onClick: () => navigate('/dashboard/intelligence') },
        { label: 'Finance', icon: FileText, onClick: () => navigate('/dashboard/finance') },
    ];

    const activities = data?.recommendations?.map(rec => ({
        title: rec.title,
        description: rec.text,
        icon: rec.type === 'alert' ? CheckCircle : Mail,
        type: rec.type === 'alert' ? 'success' : 'info',
        time: 'JUST NOW'
    })) || [];

    return (
        <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-700">
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
