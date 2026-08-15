import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Sparkles, Users, Calendar, BarChart3, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

const features = [
    { icon: Users,      label: 'Member Management'    },
    { icon: Calendar,   label: 'Event Planning'        },
    { icon: BarChart3,  label: 'Finance Tracking'      },
    { icon: Shield,     label: 'Role-Based Access'     },
];

const Splash = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    // Redirect authenticated users straight to the dashboard
    useEffect(() => {
        if (!loading && user) navigate('/dashboard', { replace: true });
    }, [user, loading, navigate]);

    if (loading) return null;

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F9FAFB] p-6 overflow-hidden relative">

            {/* Ambient background blobs */}
            <div className="absolute top-0 right-0 w-[45%] h-[45%] bg-blue-50/60 blur-[140px] -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-emerald-50/60 blur-[140px] -z-10 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-amber-50/20 blur-[180px] -z-10 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="w-full max-w-[480px] flex flex-col items-center text-center"
            >
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                    className="mb-8 p-5 bg-white rounded-[2rem] shadow-sm border border-slate-100"
                >
                    <img src={logo} alt="Gatherly Logo" className="w-20 h-20 object-contain" />
                </motion.div>

                {/* Wordmark */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-3">
                        Gatherly
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.25em] text-[10px]">
                        Your fellowship, simplified
                    </p>
                </motion.div>

                {/* Feature pills */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="flex flex-wrap justify-center gap-2 mt-10 mb-10"
                >
                    {features.map(({ icon: Icon, label }, i) => (
                        <motion.div
                            key={label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 + i * 0.08 }}
                            className="flex items-center gap-2 bg-white border border-slate-100 rounded-2xl px-4 py-2.5 shadow-sm"
                        >
                            <Icon className="w-3.5 h-3.5 text-[#1E3A8A]" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
                        </motion.div>
                    ))}
                </motion.div>

                {/* CTA Card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.55 }}
                    className="w-full bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)]"
                >
                    <p className="text-slate-500 text-sm font-medium mb-6">
                        Manage your church or fellowship with a single, powerful platform built for administrators.
                    </p>

                    <div className="flex flex-col gap-3">
                        <Link to="/login" className="btn-primary w-full h-14 text-xs group">
                            <span>Sign In</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link to="/signup" className="btn-outline w-full h-14 text-xs">
                            <span>Create Organisation</span>
                        </Link>
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-10 flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity cursor-default group"
                >
                    <Sparkles size={14} className="text-accent group-hover:animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Gatherly © 2026</span>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Splash;
