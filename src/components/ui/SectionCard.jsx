import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/**
 * SectionCard Component
 * 
 * Standardized card for major UI sections.
 * Props:
 * - title: Card title
 * - description: Optional small description
 * - children: Content of the card
 * - actionLabel: Optional label for the action button
 * - onAction: Function to call when action button is clicked
 * - icon: Optional icon component
 */
const SectionCard = ({ title, description, children, actionLabel, onAction, icon: Icon }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-xl hover:shadow-blue-900/5 transition-all group flex flex-col h-full"
    >
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                {Icon && (
                    <div className="w-12 h-12 bg-slate-50 text-primary rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all shadow-sm shrink-0">
                        <Icon size={22} />
                    </div>
                )}
                <div className="min-w-0">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none truncate">{title}</h3>
                    {description && <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">{description}</p>}
                </div>
            </div>
        </div>

        <div className="flex-1">
            {children}
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
    </motion.div>
);

export default SectionCard;
