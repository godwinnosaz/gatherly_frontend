import React from 'react';
import { CheckCircle2, ArrowRight, PartyPopper } from 'lucide-react';

const Review = ({ onNext, onBack, formData }) => {
    const summaryItems = [
        { label: 'Organization', value: formData.name || 'Not set' },
        { label: 'Ministry Type', value: formData.ministry_type || 'Not set' },
        { label: 'Location', value: formData.location || 'Not set' },
        { label: 'Dashboard Setup', value: 'Available after deploy' }
    ];

    return (
        <div className="space-y-8">
            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 text-secondary rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <PartyPopper size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Mission Ready!</h2>
                <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                    Review your organization profile below. Once you deploy the dashboard, you can add members, units, events, attendance, and finance records from their dedicated pages.
                </p>
            </div>

            <div className="grid gap-4">
                {summaryItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-white shadow-sm group hover:border-primary/20 transition-all">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.value}</span>
                            <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                <CheckCircle2 size={12} className="text-secondary" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-10 rounded-[2.5rem] bg-primary text-white relative overflow-hidden group shadow-2xl shadow-blue-900/20">
                <div className="relative z-10">
                    <h3 className="text-2xl font-black tracking-tight uppercase">Deploy Dashboard</h3>
                    <p className="text-blue-100 text-sm mt-2 max-w-xs font-medium leading-relaxed">
                        Your workspace is ready. Continue setup from the dashboard tools.
                    </p>
                    <button 
                        onClick={() => onNext({})}
                        className="mt-8 flex items-center gap-3 bg-white text-primary px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:gap-4 transition-all active:scale-95 shadow-xl shadow-blue-900/10"
                    >
                        Deploy Dashboard
                        <ArrowRight size={20} />
                    </button>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700"></div>
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <CheckCircle2 size={100} />
                </div>
            </div>

            <div className="flex justify-center pt-2">
                <button 
                    onClick={onBack}
                    className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-all"
                >
                    Back to make changes
                </button>
            </div>
        </div>
    );
};

export default Review;
