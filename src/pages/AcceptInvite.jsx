import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, User, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from '../api/axios';

const AcceptInvite = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [inviteData, setInviteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({ name: '', password: '', confirmPassword: '' });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Missing invitation token.');
            setLoading(false);
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await axios.get(`/auth/verify-invite/${token}`);
                setInviteData(response.data);
            } catch (err) {
                setError(err.response?.data?.error || 'Invalid or expired invitation.');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        setSubmitting(true);
        try {
            await axios.post('/auth/accept-invite', {
                token,
                name: formData.name,
                password: formData.password
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to accept invitation.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Verifying your invitation...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Invitation Error</h2>
                    <p className="text-slate-500">{error}</p>
                    <button 
                        onClick={() => navigate('/login')}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Welcome Aboard!</h2>
                    <p className="text-slate-500">Your account has been created successfully. Redirecting you to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden"
            >
                <div className="p-8 md:p-12 space-y-8">
                    <div className="space-y-2">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6">
                            <ShieldCheck size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900">Complete Your Setup</h2>
                        <p className="text-slate-500">
                            You've been invited to join <strong>{inviteData.organization_name}</strong> as a <strong>{inviteData.role.replace('_', ' ')}</strong>.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                <input 
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all outline-none"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                <input 
                                    required
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                <input 
                                    required
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button 
                            disabled={submitting}
                            type="submit"
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] disabled:opacity-50"
                        >
                            {submitting ? 'Creating Account...' : 'Join Organization'}
                            {!submitting && <ArrowRight size={20} />}
                        </button>
                    </form>

                    <div className="text-center pt-4">
                        <p className="text-sm text-slate-400">
                            By joining, you agree to the organization's rules and Gatherly's Terms of Service.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AcceptInvite;
