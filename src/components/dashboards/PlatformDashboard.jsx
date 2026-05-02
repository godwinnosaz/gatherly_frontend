import React from 'react';
import StatWidget from '../widgets/StatWidget';
import ActivityFeed from '../widgets/ActivityFeed';
import SectionCard from '../ui/SectionCard';
import { Database, Users, ShieldCheck, Activity, Globe, Zap, ExternalLink } from 'lucide-react';

const PlatformDashboard = () => {
    const stats = [
        { title: 'Total Tenants', value: '124', icon: Globe },
        { title: 'Total Users', value: '42,850', icon: Users, trend: 'up', trendValue: '+5%' },
        { title: 'Avg. Tenant Health', value: '98.2%', icon: Activity, trend: 'up' },
        { title: 'System Uptime', value: '99.99%', icon: Zap, color: 'secondary' },
    ];

    const activities = [
        { title: 'New Tenant Boarded', description: 'Grace House Fellowship just signed up on Enterprise.', icon: Zap, type: 'success', time: '5M AGO' },
        { title: 'DB Optimization', description: 'Auto-scaling triggered for Cluster A.', icon: Database, type: 'info', time: '1H AGO' },
        { title: 'Security Sweep', description: 'Zero vulnerabilities found in weekly scan.', icon: ShieldCheck, type: 'success', time: '4H AGO' },
    ];

    return (
        <div className="space-y-12 animate-in slide-in-from-top-4 duration-700">
            {/* Section 1: System Overview */}
            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-6">System Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => <StatWidget key={i} {...stat} />)}
                </div>
            </section>
            
            <section>
                <SectionCard 
                    title="Organizations" 
                    description="Global fellowship tenants and infrastructure status."
                    actionLabel="Global Infrastructure Audit"
                    onAction={() => {}}
                >
                    <div className="space-y-6">
                        {[
                            { name: 'Redeemed Christian Church', growth: 12, users: '12.4k', status: 'Enterprise' },
                            { name: 'House on the Rock', growth: 8, users: '8.2k', status: 'Optimal' },
                            { name: 'Covenant Nation', growth: 15, users: '5.1k', status: 'Ramping' },
                        ].map((t, i) => (
                            <div key={i} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem] group hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-black text-primary shadow-sm group-hover:scale-105 transition-transform">
                                        {t.name[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 tracking-tight leading-none uppercase">{t.name}</h4>
                                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3">{t.users} ENTITIES • {t.growth}% VELOCITY</div>
                                    </div>
                                </div>
                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                    t.status === 'Enterprise' ? 'bg-blue-50 text-primary border-blue-100' :
                                    t.status === 'Optimal' ? 'bg-emerald-50 text-secondary border-emerald-100' :
                                    'bg-amber-50 text-accent border-amber-100'
                                }`}>
                                    {t.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            </section>

            <section>
                <div className="max-w-4xl">
                    <ActivityFeed 
                        title="System Engine Log" 
                        description="Real-time monitoring of global infrastructure events."
                        items={activities} 
                        actionLabel="Full System Audit"
                        onAction={() => {}}
                    />
                </div>
            </section>
        </div>
    );
};

export default PlatformDashboard;
