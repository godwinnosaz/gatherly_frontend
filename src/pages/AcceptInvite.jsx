import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Briefcase, CheckCircle2, Lock, Mail, ShieldCheck, Users } from 'lucide-react';
import { AuthService } from '../api/services';
import { normalizeObjectResponse } from '../utils/apiResponse';

const roleLabels = {
    super_admin: 'Super Admin',
    fellowship_admin: 'Fellowship Admin',
    pastor: 'Pastor',
    president: 'President',
    secretary: 'General Secretary',
    finance_officer: 'Financial Secretary',
    unit_head: 'Unit Head',
    department_leader: 'Department Leader',
    member: 'Member'
};

const getInviteDisplayName = (invite = {}) => {
    if (invite.full_name) return invite.full_name;
    if (invite.name) return invite.name;
    return [invite.first_name, invite.last_name].filter(Boolean).join(' ');
};

const getOrganizationName = (invite = {}) => (
    invite.organization_name ||
    invite.tenant_name ||
    invite.fellowship_name ||
    invite.tenant?.name ||
    'this fellowship'
);

const friendlyInviteError = (err) => {
    const message = String(err?.message || '').toLowerCase();
    if (message.includes('expired')) return 'This invitation link has expired. Please ask your fellowship admin to resend it.';
    if (message.includes('accepted') || message.includes('already')) return 'This invitation has already been accepted. Please login instead.';
    if (message.includes('invalid') || err?.status === 400 || err?.status === 404) return 'This invitation link is invalid.';
    if (err?.type === 'cors_or_network' || err?.type === 'no_response') return 'Could not verify invitation. Please check your connection and retry.';
    return err?.message || 'Could not verify invitation. Please check your connection and retry.';
};

const InviteDetail = ({ icon: Icon, label, value }) => {
    if (!value) return null;
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-[#1E3A8A]">
                <Icon size={18} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                <p className="truncate text-sm font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );
};

const AcceptInvite = () => {
    const { inviteToken } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = inviteToken || searchParams.get('token');

    const [inviteData, setInviteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('This invitation link is invalid.');
            setLoading(false);
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await AuthService.verifyInvite(token);
                setInviteData(normalizeObjectResponse(response, ['invite', 'invitation', 'data']));
            } catch (err) {
                setError(friendlyInviteError(err));
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError('');

        if (!formData.password) {
            setFormError('Password is required.');
            return;
        }
        if (formData.password.length < 8) {
            setFormError('Use at least 8 characters.');
            return;
        }
        if (!formData.confirmPassword) {
            setFormError('Confirm password is required.');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setFormError('Passwords do not match.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await AuthService.acceptInvite({
                token,
                password: formData.password
            });
            const payload = response?.data || response;
            const tokenVal = payload?.access_token || payload?.token || response?.access_token || response?.token;
            const userVal = payload?.user || response?.user;
            const tenantVal = payload?.tenant || response?.tenant || payload?.organization || response?.organization;
            const roleVal = payload?.role || response?.role || userVal?.role;
            const rolesVal = payload?.roles || response?.roles || (roleVal ? [roleVal] : []);

            if (tokenVal) localStorage.setItem('gatherly_token', tokenVal);
            if (userVal) localStorage.setItem('gatherly_user', typeof userVal === 'object' ? JSON.stringify(userVal) : userVal);
            if (tenantVal) localStorage.setItem('gatherly_tenant', typeof tenantVal === 'object' ? JSON.stringify(tenantVal) : tenantVal);
            if (roleVal) localStorage.setItem('gatherly_role', roleVal);
            if (rolesVal) localStorage.setItem('gatherly_roles', typeof rolesVal === 'object' ? JSON.stringify(rolesVal) : rolesVal);

            setSuccess(true);
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1200);
        } catch (err) {
            setFormError(err.message || 'Failed to accept invitation.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F9FAFB]">
                <div className="w-12 h-12 border-4 border-[#1E3A8A] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Checking your invitation...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F9FAFB] p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Invitation Error</h2>
                    <p className="text-slate-500">{error}</p>
                    <button onClick={() => navigate('/login')} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F9FAFB] p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-50 text-[#10B981] rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Welcome Aboard!</h2>
                    <p className="text-slate-500">Your account has been set up successfully. Redirecting you to the dashboard...</p>
                </div>
            </div>
        );
    }

    const displayName = getInviteDisplayName(inviteData || {});
    const organizationName = getOrganizationName(inviteData || {});
    const roleLabel = roleLabels[inviteData?.role] || inviteData?.role?.replace(/_/g, ' ');

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl shadow-slate-200/50 overflow-hidden"
            >
                <div className="p-6 md:p-10 space-y-8">
                    <div className="space-y-2">
                        <div className="w-12 h-12 bg-[#1E3A8A] rounded-2xl flex items-center justify-center text-white mb-6">
                            <ShieldCheck size={24} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            {displayName ? `Set your password, ${displayName}` : 'Set your password'}
                        </h1>
                        <p className="text-slate-500">
                            You've been invited to join <strong>{organizationName}</strong> on Gatherly.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <InviteDetail icon={Mail} label="Email" value={inviteData?.email} />
                        <InviteDetail icon={Briefcase} label="Role" value={roleLabel} />
                        <InviteDetail icon={Users} label="Fellowship" value={organizationName} />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {formError && (
                            <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs font-bold text-rose-600">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1E3A8A] transition-colors" size={20} />
                                <input
                                    required
                                    minLength={8}
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-[#1E3A8A] transition-all outline-none"
                                    placeholder="Password"
                                />
                            </div>
                            <p className="ml-1 text-xs font-medium text-slate-400">Use at least 8 characters.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1E3A8A] transition-colors" size={20} />
                                <input
                                    required
                                    minLength={8}
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-[#1E3A8A] transition-all outline-none"
                                    placeholder="Confirm password"
                                />
                            </div>
                        </div>

                        <button
                            disabled={submitting}
                            type="submit"
                            className="w-full py-4 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-[0.98] disabled:opacity-50"
                        >
                            {submitting ? 'Setting up your account...' : 'Set Password'}
                            {!submitting && <ArrowRight size={20} />}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default AcceptInvite;
