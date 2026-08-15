import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MetricCard = ({ title, value, delta, unit, icon: Icon, color = 'blue' }) => {
    const isPositive = delta > 0;
    const isNegative = delta < 0;

    const colors = {
        blue: 'bg-blue-50 text-primary border-blue-100 shadow-blue-900/5',
        emerald: 'bg-emerald-50 text-secondary border-emerald-100 shadow-emerald-900/5',
        amber: 'bg-amber-50 text-accent border-amber-100 shadow-amber-900/5',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-900/5',
    };

    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className="p-6 bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-xl hover:shadow-blue-900/5"
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]} border shadow-sm`}>
                    <Icon size={24} />
                </div>
                {delta !== undefined && (
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isPositive ? 'bg-emerald-50 text-secondary border border-emerald-100' : 
                        isNegative ? 'bg-red-50 text-red-600 border border-red-100' : 
                        'bg-slate-50 text-slate-500 border border-slate-100'
                    }`}>
                        {isPositive ? <TrendingUp size={10} /> : isNegative ? <TrendingDown size={10} /> : <Minus size={10} />}
                        {Math.abs(delta)}%
                    </div>
                )}
            </div>
            
            <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-0.5">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
                    {unit && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{unit}</span>}
                </div>
            </div>
        </motion.div>
    );
};

export default MetricCard;
