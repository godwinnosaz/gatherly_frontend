import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Failed to login. Please check your credentials.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F9FAFB] p-6 overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-50/50 blur-[120px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-emerald-50/50 blur-[120px] -z-10" />
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-[460px] relative z-10"
            >
                <div className="flex flex-col items-center mb-10">
                    <motion.div 
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="mb-6 p-4 bg-white rounded-[2rem] shadow-sm border border-slate-100"
                    >
                        <img src={logo} alt="Gatherly Logo" className="w-16 h-16 object-contain" />
                    </motion.div>
                    
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Gatherly</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Your fellowship, simplified</p>
                </div>

                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Access your administrative dashboard.</p>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold mb-6 flex items-center gap-3"
                        >
                            <div className="w-2 h-2 rounded-full bg-red-600" />
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field pl-14 h-16"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                                <Link to="#" className="text-[10px] font-black text-primary hover:underline transition-colors uppercase tracking-widest">Forgot?</Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                                <input 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pl-14 h-16"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="btn-primary w-full h-16 text-lg mt-4 shadow-xl shadow-blue-900/10 group"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span>Login</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-slate-50 text-center">
                        <p className="text-slate-500 text-sm font-medium">
                            New administrator?{' '}
                            <Link to="/signup" className="text-primary hover:underline transition-colors font-black uppercase tracking-tight">
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer Attribution */}
                <div className="mt-12 flex items-center justify-center gap-3 opacity-40 hover:opacity-100 transition-opacity cursor-default group">
                    <Sparkles size={16} className="text-accent group-hover:animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Gatherly</span>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
