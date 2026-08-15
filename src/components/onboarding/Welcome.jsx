import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, ShieldCheck, Zap } from 'lucide-react';

const Welcome = ({ onNext }) => {
    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-sm"
                >
                    <Sparkles size={32} />
                </motion.div>
                <h2 className="text-3xl font-bold text-slate-900">Welcome to Gatherly!</h2>
                <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
                We're excited to help you streamline your ministry operations. This quick setup will capture your organization profile, then you can configure members, units, events, and finances from the dashboard.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 py-4">
                <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-primary shrink-0">
                        <Clock size={20} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900">~1 min setup</h4>
                        <p className="text-sm text-slate-500 mt-1">Quick and painless configuration to get you running today.</p>
                    </div>
                </div>
                <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-secondary shrink-0">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900">Secure & Private</h4>
                        <p className="text-sm text-slate-500 mt-1">Your data is isolated and protected with enterprise-grade security.</p>
                    </div>
                </div>
            </div>

            <div className="pt-6">
                <button 
                    onClick={() => onNext({})}
                    className="group flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-bold transition-all hover:gap-3 hover:shadow-lg hover:shadow-blue-900/10 active:scale-95"
                >
                    Let's Get Started
                    <Zap size={18} className="fill-current" />
                </button>
            </div>

            <div className="pt-12 border-t border-slate-100">
                <p className="text-sm text-slate-500 font-medium">TRUSTED BY 500+ MINISTRIES GLOBALLY</p>
                <div className="flex gap-8 mt-4 opacity-40 grayscale">
                    {/* Placeholder for logos */}
                    <div className="h-6 w-24 bg-slate-200 rounded"></div>
                    <div className="h-6 w-20 bg-slate-200 rounded"></div>
                    <div className="h-6 w-28 bg-slate-200 rounded"></div>
                </div>
            </div>
        </div>
    );
};

export default Welcome;
