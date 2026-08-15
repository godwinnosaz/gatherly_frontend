import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BellRing } from 'lucide-react';

const ActivityFeed = ({ title, items = [], description, actionLabel, onAction }) => (
    <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.02)] h-full flex flex-col relative overflow-hidden group hover:shadow-xl hover:shadow-blue-900/5 transition-all">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 text-primary rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all shadow-sm shrink-0">
                    <BellRing size={22} />
                </div>
                <div className="min-w-0">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none truncate">{title || 'Recent Activity'}</h3>
                    {description && <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">{description}</p>}
                </div>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">Live</span>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-6 py-12">
                    <div className="w-16 h-16 rounded-[2rem] border-2 border-dashed border-slate-100 flex items-center justify-center">
                        <div className="w-2 h-2 bg-slate-200 rounded-full animate-ping" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Monitoring System Engine...</p>
                </div>
            ) : (
                items.map((item, i) => (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="flex gap-5 items-start p-5 rounded-[2rem] hover:bg-slate-50 transition-all group/item border border-transparent hover:border-slate-100"
                    >
                        <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center border shadow-sm ${
                            item.type === 'alert' ? 'bg-red-50 text-red-600 border-red-100' : 
                            item.type === 'success' ? 'bg-emerald-50 text-secondary border-emerald-100' :
                            'bg-blue-50 text-primary border-blue-100'
                        }`}>
                            <item.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1.5">
                                <h4 className="text-sm font-black text-slate-900 tracking-tight truncate group-hover/item:text-primary transition-colors">{item.title}</h4>
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter shrink-0">{item.time}</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2">{item.description}</p>
                        </div>
                    </motion.div>
                ))
            )}
        </div>

        {actionLabel && (
            <div className="mt-8 pt-6 border-t border-slate-50">
                <button 
                    onClick={onAction}
                    className="flex items-center gap-2 text-xs font-black text-primary hover:gap-3 transition-all uppercase tracking-widest w-fit"
                >
                    <span>{actionLabel}</span>
                    <ArrowRight size={16} />
                </button>
            </div>
        )}
        
        <div className="absolute bottom-16 left-0 right-0 h-12 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
    </div>
);

export default ActivityFeed;
