import React from 'react';
import StatWidget from '../widgets/StatWidget';
import TrendChart from '../widgets/TrendChart';
import ActivityFeed from '../widgets/ActivityFeed';
import { Users, Calendar, TrendingUp, DollarSign, Bell, ShieldAlert, Loader2, Sparkles } from 'lucide-react';
import AnnouncementFeed from '../notifications/AnnouncementFeed';
import { useIntelligence } from '../../hooks/useIntelligence';

const PastorDashboard = () => {
    const { data, loading } = useIntelligence();

    if (loading) return (
        <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-secondary animate-spin" />
        </div>
    );

    const stats = [
        { 
            title: 'Total Members', 
            value: data?.summary?.active_base || 0, 
            icon: Users, 
            trend: 'up', 
            trendValue: `${data?.summary?.new_signups || 0} new` 
        },
        { 
            title: 'Weekly Attendance', 
            value: data?.summary?.weekly_active || 0, 
            icon: Calendar, 
            trend: data?.summary?.health_indicator === 'Healthy' ? 'up' : 'down',
            trendValue: data?.summary?.health_indicator
        },
        { 
            title: 'Retention Risk', 
            value: data?.summary?.retention_risk_count || 0, 
            icon: ShieldAlert, 
            trend: 'down', 
            color: 'red' 
        },
        { 
            title: 'Total Giving', 
            value: new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(data?.trends?.financials?.reduce((acc, curr) => acc + curr.income, 0) || 0), 
            icon: DollarSign, 
            trend: 'up' 
        },
    ];

    const chartData = data?.trends?.growth?.map(d => ({
        month: d.month.split('-')[1],
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
            {/* Section 1: Key Metrics */}
            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-6">Key Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => <StatWidget key={i} {...stat} />)}
                </div>
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
