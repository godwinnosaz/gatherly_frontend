import React from 'react';
import StatWidget from '../widgets/StatWidget';
import ActivityFeed from '../widgets/ActivityFeed';
import SectionCard from '../ui/SectionCard';
import { Users, ClipboardList, TrendingUp, AlertCircle, Clock } from 'lucide-react';

const LeaderDashboard = () => {
    const stats = [
        { title: 'Dept Staff', value: '42', icon: Users },
        { title: 'Avg. Consistency', value: '88%', icon: TrendingUp, trend: 'up', trendValue: '+2%' },
        { title: 'Pending Absences', value: '4', icon: AlertCircle, color: 'red' },
        { title: 'Next Training', value: '3d', icon: Clock },
    ];

    const alerts = [
        { title: 'Absent Alert', description: 'Member John Doe has missed 2 consecutive rehearsals.', icon: AlertCircle, type: 'alert', time: '1H AGO' },
        { title: 'Schedule Updated', description: 'Sunday Service roster for Oct 27 is live.', icon: ClipboardList, type: 'info', time: '5H AGO' },
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
