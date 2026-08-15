import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const QuickActions = ({ title, actions = [] }) => (
    <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col h-full relative overflow-hidden group">
        <div className="flex items-center gap-3 mb-10">
            <div className="w-2 h-6 bg-primary rounded-full shadow-sm" />
            <h3 className="text-slate-900 font-black text-xl tracking-tight">{title || 'Quick Actions'}</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 flex-1">
            {actions.map((action, i) => (
                <motion.button
                    key={i}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={action.onClick}
                    className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-blue-50 hover:border-primary/20 transition-all text-center group/btn relative overflow-hidden shadow-sm"
                >
                    <div className="p-4 bg-white rounded-2xl mb-4 group-hover/btn:bg-white transition-all border border-slate-100 group-hover/btn:border-primary/20 relative z-10 shadow-sm">
                        <action.icon className="w-6 h-6 text-slate-400 group-hover/btn:text-primary group-hover/btn:scale-110 transition-all" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/btn:text-primary transition-colors relative z-10">{action.label}</span>
                </motion.button>
            ))}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-50" />
    </div>
);

export default QuickActions;
