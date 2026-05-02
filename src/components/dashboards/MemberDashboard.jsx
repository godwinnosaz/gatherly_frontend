import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageSquare, Sparkles, Calendar, Bell, ChevronRight, MapPin } from 'lucide-react';
import QuickActions from '../widgets/QuickActions';
import AnnouncementFeed from '../notifications/AnnouncementFeed';
import SectionCard from '../ui/SectionCard';

const MemberDashboard = () => {
    const actions = [
        { label: 'Prayer Request', icon: MessageSquare, onClick: () => {} },
        { label: 'My Growth', icon: Sparkles, onClick: () => {} },
        { label: 'Check-in', icon: Calendar, onClick: () => {} },
        { label: 'Join Dept', icon: Heart, onClick: () => {} },
    ];

    return (
        <div className="space-y-12 animate-in zoom-in-95 duration-700">
            {/* Section 1: Welcome Banner */}
            <section>
                <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.02)] bg-gradient-to-br from-blue-50/50 to-emerald-50/30 relative overflow-hidden group">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />
                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                        <div className="p-6 bg-primary rounded-3xl text-white transform -rotate-3 shadow-xl shadow-blue-900/20">
                            <Heart className="w-12 h-12 fill-white" />
                        </div>
                        <div className="text-center md:text-left">
                            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight uppercase">Shine Bright, Fellow</h2>
                            <p className="text-slate-500 font-medium max-w-md leading-relaxed">"Let your light so shine before men, that they may see your good works and glorify your Father in heaven."</p>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <SectionCard 
                        title="My Hub" 
                        description="Personal spiritual tools and engagement."
                        actionLabel="View All Activities"
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
                    
                    <SectionCard 
                        title="Upcoming Next" 
                        description="Your next point of fellowship contact."
                        actionLabel="Full Event Schedule"
                        onAction={() => {}}
                        icon={Calendar}
                    >
                        <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between group/item hover:bg-white hover:shadow-lg hover:border-primary/20 transition-all h-full">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary border border-slate-100 shadow-sm">
                                    <MapPin size={32} />
                                </div>
                                <div>
                                    <div className="text-[10px] text-primary font-black tracking-[0.2em] mb-2 uppercase">Sunday Service</div>
                                    <div className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Worship Encounter</div>
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-3">Starts in 3 days</div>
                                </div>
                            </div>
                        </div>
                    </SectionCard>
                </div>
            </section>

            {/* Section 3: Announcements */}
            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-6">Announcements</h2>
                <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.02)] max-w-4xl">
                    <AnnouncementFeed />
                </div>
            </section>
        </div>
    );
};

export default MemberDashboard;
