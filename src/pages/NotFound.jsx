import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFound = () => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-primary p-4 overflow-hidden relative">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]" />

            <div className="text-center relative z-10 space-y-8 max-w-md">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-32 h-32 bg-accent/50 border border-slate-700/50 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-secondary/10"
                >
                    <Compass size={64} className="text-secondary animate-[spin_10s_linear_infinite]" />
                </motion.div>
                
                <div className="space-y-4">
                    <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter">404</h1>
                    <h2 className="text-2xl font-bold text-slate-300">You've reached a blind spot</h2>
                    <p className="text-slate-500 leading-relaxed px-4">
                        The fellowship link you followed might be broken or the page has been archived.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <button 
                        onClick={() => window.history.back()}
                        className="btn-outline w-full sm:w-auto flex items-center justify-center gap-2 px-8 h-12"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>
                    <Link 
                        to="/dashboard" 
                        className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-8 h-12"
                    >
                        <Home size={18} />
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
