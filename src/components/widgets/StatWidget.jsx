import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatWidget = ({ title, value, icon: Icon, trend, trendValue, color }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all hover:shadow-xl hover:shadow-blue-900/5 relative group overflow-hidden h-full flex flex-col justify-between"
    >
        <div className="flex justify-between items-start mb-6 relative z-10">
            <div className={`p-4 rounded-2xl ${color === 'red' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-primary border-blue-100'} border shadow-sm`}>
                <Icon size={24} />
            </div>
            {trendValue && (
                <div className={`flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-xl border ${trend === 'up' ? 'bg-emerald-50 text-secondary border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <span className="uppercase tracking-widest">{trendValue}</span>
                </div>
            )}
        </div>
        
        <div className="relative z-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">{title}</h4>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tighter">{value}</span>

            </div>
        </div>
    </motion.div>
);

export default StatWidget;
