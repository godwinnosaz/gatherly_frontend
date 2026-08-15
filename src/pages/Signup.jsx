import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Building2, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

// ─── Friendly messages for known backend error types ─────────────────────────
const friendlyMessage = (err) => {
    if (!err) return 'Registration failed. Please try again.';
    const msg = err.message || '';
    if (msg.includes('SQLSTATE') || msg.includes('database') || msg.includes('constraint') || msg.includes('foreign key') || msg.includes('child row')) {
        if (import.meta.env.DEV) {
            console.error("Technical database error during registration:", msg);
        }
        return 'Registration failed. Please try again or contact support.';
    }
    if (err.type === 'validation')      return err.message || 'Please check the details you entered.';
    if (err.type === 'bad_request')     return err.message || 'An account with this email may already exist.';
    if (err.type === 'cors_or_network') return 'Cannot reach the server. Please check your internet connection.';
    if (err.type === 'server_error')    return err.message || 'A server error occurred. Please try again in a moment.';
    return err.message || 'Registration failed. Please try again.';
};

const Signup = () => {
    const [formData, setFormData] = useState({
        organization_name: '',  // maps directly to Postman field
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, login } = useAuth();
    const navigate = useNavigate();

    const set = (field) => (e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side validation
        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match.');
        }
        if (formData.password.length < 8) {
            return setError('Password must be at least 8 characters.');
        }

        setIsSubmitting(true);
        try {
            // Step 1: Register — send ONLY the three Postman-documented fields
            await register({
                email: formData.email,
                password: formData.password,
                organization_name: formData.organization_name,
            });

            // Step 2: Auto-login with the same credentials
            await login(formData.email, formData.password);

            // Step 3: Send directly to dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(friendlyMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F9FAFB] p-6 overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-emerald-50/50 blur-[120px] -z-10" />
            <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-blue-50/50 blur-[120px] -z-10" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-[500px] relative z-10"
            >
                <div className="flex flex-col items-center mb-10 text-center">
                    <motion.div 
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="mb-6 p-4 bg-white rounded-[2rem] shadow-sm border border-slate-100"
                    >
                        <img src={logo} alt="Gatherly Logo" className="w-16 h-16 object-contain" />
                    </motion.div>
                    
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Create Account</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Join your fellowship today</p>
                </div>

                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
                    <div className="mb-8 text-center sm:text-left">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Get Started</h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Manage your church with modern, simple tools.</p>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold mb-6 flex items-center gap-3"
                        >
                            <div className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Organization Name — replaces "Full Name", maps to organization_name */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                Organization / Church Name
                            </label>
                            <div className="relative group">
                                <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                                <input 
                                    type="text" 
                                    required
                                    autoComplete="organization"
                                    value={formData.organization_name}
                                    onChange={set('organization_name')}
                                    className="input-field pl-14 h-14 text-sm"
                                    placeholder="e.g. Grace Fellowship Church"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                Email Address
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                                <input 
                                    type="email" 
                                    required
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={set('email')}
                                    className="input-field pl-14 h-14 text-sm"
                                    placeholder="admin@yourchurch.com"
                                />
                            </div>
                        </div>

                        {/* Password + Confirm */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Password
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                                    <input 
                                        type="password" 
                                        required
                                        autoComplete="new-password"
                                        value={formData.password}
                                        onChange={set('password')}
                                        className="input-field pl-14 h-14 text-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Confirm Password
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                                    <input 
                                        type="password" 
                                        required
                                        autoComplete="new-password"
                                        value={formData.confirmPassword}
                                        onChange={set('confirmPassword')}
                                        className="input-field pl-14 h-14 text-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="btn-primary w-full h-16 text-lg group mt-4 shadow-xl shadow-blue-900/10"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span>Create Account</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-50 text-center">
                        <p className="text-slate-500 text-sm font-medium">
                            Already registered?{' '}
                            <Link to="/login" className="text-primary hover:underline transition-colors font-black uppercase tracking-tight">
                                Sign In
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

export default Signup;
