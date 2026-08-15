import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp } from 'lucide-react';

const TrendChart = ({ title, data = [], subtitle, actionLabel, onAction }) => {
    const [range, setRange] = useState('6m');

    return (
        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-xl hover:shadow-blue-900/5 transition-all group flex flex-col min-h-[460px]">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-10 gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-primary rounded-2xl flex items-center justify-center border border-blue-100 group-hover:bg-primary group-hover:text-white transition-all shadow-sm shrink-0">
                        <TrendingUp size={22} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none truncate">{title}</h3>
                        {subtitle && <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">{subtitle}</p>}
                    </div>
                </div>

                <select
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-500 rounded-xl px-4 py-2 text-xs font-bold outline-none w-fit focus:border-primary transition-colors cursor-pointer"
                >
                    <option value="6m">Last 6 Months</option>
                    <option value="12m">Last 12 Months</option>
                    <option value="ytd">Year To Date</option>
                </select>
            </div>

            <div className="flex-1 overflow-x-auto hide-scrollbar">
                <div className="flex items-end justify-between gap-4 px-2 mt-4 min-w-[300px] h-[220px]">
                    {data.map((item, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-4 h-full">
                            <div className="w-full bg-slate-50 rounded-t-2xl relative group/bar h-full flex items-end overflow-hidden border border-slate-100/50">
                                <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${item.value}%` }}
                                    transition={{ delay: i * 0.1, duration: 0.8, ease: "easeOut" }}
                                    className={`w-full bg-gradient-to-t ${item.color || 'from-primary/80 to-primary'} rounded-t-xl relative`}
                                >
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black opacity-0 group-hover/bar:opacity-100 transition-all whitespace-nowrap z-10 shadow-xl translate-y-2 group-hover/bar:translate-y-0">
                                        {item.label || item.month}: {item.value}%
                                    </div>
                                </motion.div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] whitespace-nowrap">{item.month}</span>
                        </div>
                    ))}
                </div>
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
        </div>
    );
};

export default TrendChart;
