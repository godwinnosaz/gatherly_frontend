import React from 'react';
import { motion } from 'framer-motion';

const ParticipationBar = ({ data, title, color = 'blue' }) => {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    
    const colors = {
        blue: 'bg-primary',
        emerald: 'bg-secondary',
        rose: 'bg-red-500',
    };

    return (
        <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] space-y-8">
            <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-900 tracking-tight">{title}</h4>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Velocity</span>
            </div>

            <div className="space-y-5">
                {data.map((item, i) => (
                    <div key={i} className="space-y-2 group">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-400 group-hover:text-primary transition-colors">{item.label}</span>
                            <span className="text-slate-900">{item.value}</span>
                        </div>
                        <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.value / maxVal) * 100}%` }}
                                transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                                className={`h-full rounded-full ${colors[color]}`}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ParticipationBar;
