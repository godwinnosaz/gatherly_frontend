import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Layout from '../components/Layout';
import { MemberService, DepartmentService, RolesService } from '../api/services';
import {
    Search, Plus, Mail, Phone, Edit, X,
    Users, UserPlus, Download, Loader2,
    CheckCircle2, AlertCircle, Lock, Copy, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PermissionGate from '../components/PermissionGate';
import MemberImport from '../components/members/MemberImport';
import SectionCard from '../components/ui/SectionCard';
import { normalizeArrayResponse, entityValue } from '../utils/apiResponse';
import { useAuth } from '../context/AuthContext';



// Updated to align with the four-tier hierarchy
const roleLabels = {
    super_admin: 'Super Admin',
    fellowship_admin: 'Fellowship Admin',
    leadership_committee: 'Leadership Committee',
    executive: 'Executive',
    general_member: 'General Member'
};

const formatInviteDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const getExpiryLabel = (value) => {
    if (!value) return '';
    const expiry = new Date(value);
    if (Number.isNaN(expiry.getTime())) return '';
    const today = new Date();
    const diffMs = expiry.getTime() - today.getTime();
    if (diffMs <= 0) return 'Expired';
    const days = Math.max(1, Math.ceil(diffMs / 86400000));
    return `Expires in ${days} day${days === 1 ? '' : 's'}`;
};

const normalizeInviteLink = (inviteLink) => {
    if (!inviteLink) return '';
    if (/^https?:\/\//i.test(inviteLink)) {
        return inviteLink.replace(/^https?:\/\/[^/]+/, window.location.origin);
    }
    return `${window.location.origin}/accept-invitation?token=${inviteLink}`;
};

const getInviteStatus = (member) => {
    const raw = String(member.invitation_status || member.invite_status || member.user_status || member.status || '').toLowerCase();
    const expiresAt = member.expires_at || member.invite_expires_at || member.invitation_expires_at;
    const expiry = expiresAt ? new Date(expiresAt) : null;
    const isExpired = expiry && !Number.isNaN(expiry.getTime()) && expiry.getTime() <= Date.now();

    if (member.accepted_at || raw === 'accepted') return { label: 'Accepted', tone: 'green', canResend: false, expiresAt };
    if (isExpired || raw === 'expired') return { label: 'Expired', tone: 'red', canResend: true, expiresAt };
    if (['pending', 'invited', 'invite_pending', 'pending_invite'].includes(raw)) {
        return { label: 'Pending Invite', tone: 'amber', canResend: true, expiresAt };
    }
    if (raw === 'active') return { label: 'Active', tone: 'green', canResend: false, expiresAt };
    if (!member.role && !member.roles?.length) return { label: 'No Login Access', tone: 'slate', canResend: false, expiresAt };
    return { label: raw ? raw.replace(/_/g, ' ') : 'Invite Status Unknown', tone: 'slate', canResend: false, expiresAt };
};

const InviteStatusBadge = ({ member }) => {
    const status = getInviteStatus(member);
    const toneClass = {
        green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
        red: 'bg-rose-50 text-rose-600 border-rose-100',
        slate: 'bg-slate-50 text-slate-500 border-slate-100'
    }[status.tone];
    const expiry = status.expiresAt ? getExpiryLabel(status.expiresAt) : '';

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${toneClass}`}>
                {status.label}
            </span>
            {expiry && (
                <span className="text-[10px] font-bold text-slate-400">
                    {expiry}
                </span>
            )}
        </div>
    );
};

const InviteLinkResult = ({ inviteResult, onDone }) => {
    const [copyMessage, setCopyMessage] = useState('');
    const link = normalizeInviteLink(inviteResult?.invite_link);
    const expiryLabel = inviteResult?.expires_at ? getExpiryLabel(inviteResult.expires_at) : '';
    const expiryDate = inviteResult?.expires_at ? formatInviteDate(inviteResult.expires_at) : '';

    const copyLink = async () => {
        if (!link) return;
        try {
            await navigator.clipboard.writeText(link);
            setCopyMessage('Invite link copied.');
        } catch {
            setCopyMessage('Copy manually from the field.');
        }
    };

    return (
        <div className="space-y-4 w-full">
            {inviteResult.email_sent ? (
                <p className="text-sm text-slate-500 font-medium">Invitation email sent.</p>
            ) : link ? (
                <p className="text-sm text-slate-500 font-medium">Email was not sent. Copy invite link.</p>
            ) : (
                <p className="text-sm text-amber-600 font-medium bg-amber-50 p-3 rounded-xl border border-amber-100">
                    Invitation created, but no invite link was returned. Check email delivery or backend response.
                </p>
            )}

            {expiryLabel && (
                <p className="text-xs font-bold text-slate-400">
                    {expiryLabel === 'Expired' ? 'This link has expired.' : `Invite link ${expiryLabel.toLowerCase()}.`}
                    {expiryDate ? ` Expires on ${expiryDate}.` : ''}
                </p>
            )}

            {link && (
                <div className="w-full space-y-3 mt-4 text-left">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Invite Link
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                        <input
                            type="text"
                            readOnly
                            value={link}
                            className="w-full bg-transparent text-xs font-mono text-slate-600 outline-none select-all overflow-hidden text-ellipsis"
                        />
                        <div className="flex gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={copyLink}
                                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                            >
                                <Copy size={12} />
                                <span>Copy</span>
                            </button>
                            <a
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
                            >
                                <ExternalLink size={12} />
                                <span>Open</span>
                            </a>
                        </div>
                    </div>
                    {copyMessage && <p className="text-xs font-bold text-emerald-600">{copyMessage}</p>}
                </div>
            )}

            <div className="pt-4">
                <button type="button" onClick={onDone} className="w-full btn-primary py-3.5 text-sm">
                    Done
                </button>
            </div>
        </div>
    );
};

const ResendInviteButton = ({ member, canManageInvites, onResend }) => {
    const inviteStatus = getInviteStatus(member);
    const hasLoginAccess = Boolean(member.role || member.roles?.length || member.user_id || member.invitation_status || member.invite_status);
    const canShow = canManageInvites && hasLoginAccess && inviteStatus.canResend && member.email;

    if (!canShow) return null;

    return (
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onResend?.(member); }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-blue-50 transition-colors"
        >
            <Mail size={12} />
            <span>Resend Invite</span>
        </button>
    );
};

const normalizeMembers = (response) => normalizeArrayResponse(response, ['members', 'items']).map((member) => ({
    ...member,
    value: entityValue(member, ['member_id', 'user_id', 'id']),
    first_name: member.first_name || member.name?.split(' ')?.[0] || '',
    last_name: member.last_name || member.name?.split(' ')?.slice(1).join(' ') || '',
    name: member.name || [member.first_name, member.last_name].filter(Boolean).join(' ')
}));

const normalizeMemberDetail = (response, fallback = {}) => {
    if (!response && !fallback) return null;

    let data = response;
    if (response && response.data) data = response.data;
    if (data && data.member) data = data.member;
    if (data && data.data) data = data.data;
    if (Array.isArray(data)) data = data[0] || null;

    const fields = [
        'member_id', 'user_id', 'first_name', 'last_name', 'name', 'email', 'phone', 'status', 'role', 'roles',
        'department_id', 'department_name', 'invitation_status', 'invite_status', 'expires_at', 'accepted_at', 'created_at', 'updated_at'
    ];

    const detail = {};
    if (data && typeof data === 'object') {
        fields.forEach((k) => {
            if (Object.prototype.hasOwnProperty.call(data, k) && data[k] !== undefined) {
                detail[k] = data[k];
            }
        });

        if (!detail.first_name && data.name) {
            const parts = String(data.name || '').split(' ');
            detail.first_name = parts[0] || '';
            detail.last_name = parts.slice(1).join(' ') || '';
        }
        if (!detail.name) {
            detail.name = [detail.first_name, detail.last_name].filter(Boolean).join(' ') || data.name || fallback.name;
        }
    }

    return { ...fallback, ...(detail || {}) };
};

const normalizeDepartments = (response) => normalizeArrayResponse(response, ['departments', 'items']).map((department) => ({
    ...department,
    value: entityValue(department, ['department_id', 'id']),
    name: department.name || department.department_name || 'Unnamed Department'
}));

const getMemberKey = (member) => (
    member?.value || member?.member_id || member?.user_id || member?.id || ''
);

// ─── Extracted Modals & Drawers ──────────────────────────────────────────

const ConfirmModal = ({ isOpen, onClose, title, message, onConfirm, confirmText = 'Confirm', destructive = false, performing = false }) => (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 bg-slate-900/50">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg bg-white rounded-2xl p-6">
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="text-sm text-slate-500 mt-2">{message}</p>
                    <div className="flex gap-2 mt-6">
                        <button onClick={onClose} className="flex-1 py-3 bg-white border rounded-xl">Cancel</button>
                        <button onClick={onConfirm} disabled={performing} className={`flex-1 py-3 rounded-xl ${destructive ? 'bg-rose-600 text-white' : 'bg-primary text-white'}`}>
                            {performing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : confirmText}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);

const EditMemberModal = ({ isOpen, onClose, member, departments = [], onSaveSuccess }) => {
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        status: 'active',
        department_id: ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (member && isOpen) {
            setForm({
                first_name: member.first_name || '',
                last_name: member.last_name || '',
                email: member.email || '',
                phone: member.phone || '',
                status: member.status || 'active',
                department_id: member.department_id || ''
            });
            setError('');
        }
    }, [member, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload = {
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                status: form.status
            };
            if (form.department_id) payload.department_id = form.department_id;
            await MemberService.update(member.value || member.id, payload);
            onClose();
            await onSaveSuccess();
        } catch (err) {
            console.error('Update failed', err);
            setError(err.message || 'Failed to update member.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/50">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl bg-white rounded-2xl p-6">
                <h3 className="text-lg font-bold">Edit Member</h3>
                {error && <p className="text-sm text-rose-600 mt-2">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-3 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="First name" className="p-3 border rounded-xl" />
                        <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last name" className="p-3 border rounded-xl" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="p-3 border rounded-xl" />
                        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="p-3 border rounded-xl" />
                    </div>
                    <div className="flex gap-3">
                        <select name="status" value={form.status} onChange={handleChange} className="p-3 border rounded-xl flex-1">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <select name="department_id" value={form.department_id} onChange={handleChange} className="p-3 border rounded-xl flex-1">
                            <option value="">No department</option>
                            {departments.map((d) => (
                                <option key={d.value} value={d.value}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border rounded-xl">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary text-white rounded-xl">Save</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const SetLoginAccessModal = ({ isOpen, onClose, member, departments = [], onSaveSuccess }) => {
    const [form, setForm] = useState({ role: '', department_id: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [inviteResult, setInviteResult] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setForm({ role: '', department_id: '' });
            setError('');
            setInviteResult(null);
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!form.role) {
            setError('Please select a role.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const payload = {
                member_id: member.value || member.id || member.member_id,
                role: form.role
            };
            if (form.department_id) payload.department_id = form.department_id;
            
            const res = await MemberService.setLoginAccess(payload);
            const data = res?.data || res;
            if (data?.invite_created || data?.invite_link) {
                setInviteResult({
                    invite_link: data.invite_link,
                    email_sent: !!data.email_sent,
                    expires_at: data.expires_at
                });
            } else {
                onClose();
                await onSaveSuccess();
            }
        } catch (err) {
            console.error('Set login access failed', err);
            setError(err.message || 'Failed to set login access.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/50">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl">
                {inviteResult ? (
                    <div className="space-y-4 w-full text-center">
                        <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-secondary border border-emerald-100 mb-4">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Login Access Granted</h3>
                        <InviteLinkResult inviteResult={inviteResult} onDone={() => { onClose(); onSaveSuccess(); }} />
                    </div>
                ) : (
                    <>
                        <h3 className="text-lg font-bold">Set Login Access</h3>
                        <div className="bg-slate-50 p-4 rounded-xl mt-4 border border-slate-100">
                            <p className="text-sm font-medium text-slate-700">{member?.first_name} {member?.last_name}</p>
                            <p className="text-xs text-slate-500 mt-1">{member?.email}</p>
                        </div>
                        {error && <p className="text-sm text-rose-600 mt-3 bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</p>}
                        <div className="mt-4 space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Role *</label>
                                <select name="role" value={form.role} onChange={handleChange} className="w-full p-3 border rounded-xl text-sm bg-white focus:outline-none focus:border-primary transition-colors">
                                    <option value="">Select a role...</option>
                                    <option value="leadership_committee">Leadership Committee</option>
                                    <option value="executive">Executive</option>
                                    <option value="fellowship_admin">Fellowship Admin</option>
                                    <option value="general_member">General Member</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Department (Optional)</label>
                                <select name="department_id" value={form.department_id} onChange={handleChange} className="w-full p-3 border rounded-xl text-sm bg-white focus:outline-none focus:border-primary transition-colors">
                                    <option value="">No department</option>
                                    {departments.map(d => (
                                        <option key={d.value} value={d.value}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2 mt-6 pt-2">
                                <button onClick={onClose} className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                                <button onClick={handleSubmit} disabled={saving} className="flex-1 py-3.5 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary/90 transition-colors flex justify-center items-center">
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Grant Access & Invite'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
};

const ChangeRoleModal = ({ isOpen, onClose, member, onSaveSuccess }) => {
    const [roleVal, setRoleVal] = useState('general_member');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (member && isOpen) setRoleVal(member.role || 'general_member');
    }, [member, isOpen]);

    const handleChangeRole = async () => {
        setSaving(true);
        setError('');
        try {
            if (!member?.user_id) {
                setError('Cannot change role: this member has no linked user account. Set login access first.');
                setSaving(false);
                return;
            }
            await RolesService.assign({ user_id: member.user_id, role: roleVal });
            onClose();
            await onSaveSuccess();
        } catch (err) {
            console.error('Change role failed', err);
            setError(err.message || 'Failed to change role.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/50">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white rounded-2xl p-6">
                <h3 className="text-lg font-bold">Change Role</h3>
                {error && <p className="text-sm text-rose-600 mt-2">{error}</p>}
                <div className="mt-4 space-y-3">
                    <select value={roleVal} onChange={(e) => setRoleVal(e.target.value)} className="w-full p-3 border rounded-xl">
                        <option value="leadership_committee">Leadership Committee</option>
                        <option value="executive">Executive</option>
                        <option value="fellowship_admin">Fellowship Admin</option>
                        <option value="general_member">General Member</option>
                    </select>
                    <div className="flex gap-2 mt-4">
                        <button onClick={onClose} className="flex-1 py-3 bg-white border rounded-xl">Cancel</button>
                        <button onClick={handleChangeRole} disabled={saving || !member?.user_id} className="flex-1 py-3 bg-primary text-white rounded-xl">Change Role</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const MemberDetailDrawer = ({ isOpen, onClose, member, detail, detailLoading, detailError, fetchMemberDetail, canManageMembers, actions }) => {
    if (!isOpen) return null;
    const base = member || {};
    const extra = detail || {};
    const m = {
        ...base,
        ...extra,
        first_name: base.first_name || extra.first_name || '',
        last_name: base.last_name || extra.last_name || '',
        email: base.email || extra.email || '',
        name: base.name || extra.name || [base.first_name || extra.first_name, base.last_name || extra.last_name].filter(Boolean).join(' ')
    };

    return (
        <div className="fixed inset-0 z-[250]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

            <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} className="ml-auto h-full w-full sm:w-[480px] bg-white border-l border-slate-100 p-6 overflow-y-auto relative z-10" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-primary text-lg">
                                {base.first_name?.[0] ?? '?'}{base.last_name?.[0] ?? ''}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{m?.first_name} {m?.last_name}</h3>
                                <p className="text-sm text-slate-500">{m?.email}</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full bg-slate-100"><X /></button>
                </div>

                <div className="mt-4 space-y-3">
                    <div>
                        <div className="text-xs text-slate-400">Status</div>
                        <div className="font-bold">{m?.status || 'N/A'}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400">Role</div>
                        <div className="font-bold">{roleLabels[m?.role] || (m?.role || 'No Login Access')}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400">Department</div>
                        <div className="font-bold">{m?.department_name || m?.department_label || '—'}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400">Phone</div>
                        <div className="font-bold">{m?.phone || '—'}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400">Joined</div>
                        <div className="font-bold">{m?.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400">Last updated</div>
                        <div className="font-bold">{m?.updated_at ? new Date(m.updated_at).toLocaleString() : '—'}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400">Invite status</div>
                        <div className="mt-2"><InviteStatusBadge member={m} /></div>
                    </div>

                    {detailLoading && (
                        <div className="text-sm text-slate-500">Loading full details…</div>
                    )}

                    {detailError && (
                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-sm">
                            <div className="font-bold text-amber-700">Could not load full member details.</div>
                            <div className="mt-2 flex gap-2">
                                <button onClick={() => fetchMemberDetail(member)} className="px-3 py-2 bg-white border rounded-xl">Retry</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 border-t pt-4 space-y-3">
                    {canManageMembers ? (
                        <>
                            <div className="flex gap-2">
                                <button onClick={() => actions.onEdit(m)} className="flex-1 py-2 bg-white border rounded-xl">Edit Details</button>
                                {(!m.user_id || m.role === '' || m.role == null) ? (
                                    <button
                                        onClick={() => actions.onSetLogin(m)}
                                        className="flex-1 py-2 bg-white border rounded-xl text-primary font-medium"
                                    >
                                        Set Login Access
                                    </button>
                                ) : (
                                    <button onClick={() => actions.onChangeRole(m)} className="flex-1 py-2 bg-white border rounded-xl">Change Role</button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => actions.onDeactivate(m)} className="flex-1 py-2 bg-amber-50 border rounded-xl">Deactivate</button>
                            </div>
                            <div>
                                <button onClick={() => actions.onDelete(m)} className="w-full py-2 bg-rose-600 text-white rounded-xl">Delete Permanently</button>
                            </div>
                        </>
                    ) : (
                        <div className="text-sm text-slate-500">You do not have permission to manage this member.</div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const AddMemberModal = ({ isOpen, onClose, onSuccess, departments }) => {
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        status: 'active',
        grant_login_access: false,
        role: '',
        department_id: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [inviteResult, setInviteResult] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
            ...(name === 'grant_login_access' && !checked ? { role: '', department_id: '' } : {})
        }));
    };

    const reset = () => {
        setForm({
            first_name: '', last_name: '', email: '', phone: '', status: 'active',
            grant_login_access: false, role: '', department_id: ''
        });
        setError('');
        setSuccess(false);
        setInviteResult(null);
    };

    const handleClose = () => { reset(); onClose(); };
    const handleDone = () => { onSuccess(); handleClose(); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const payload = {
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                status: form.status
            };

            if (form.grant_login_access) {
                if (!form.role) {
                    setError('Please select a role before granting login access.');
                    setSubmitting(false);
                    return;
                }
                payload.role = form.role;
                if (form.department_id) payload.department_id = form.department_id;
            }

            const response = await MemberService.create(payload);
            const data = response?.data || response;

            if (data?.invite_created) {
                setInviteResult({
                    invite_link: data.invite_link,
                    email_sent: !!data.email_sent,
                    invite_token: data.invite_token,
                    expires_at: data.expires_at
                });
                setSuccess(true);
            } else {
                setSuccess(true);
                setTimeout(() => {
                    onSuccess();
                    handleClose();
                }, 1200);
            }
        } catch (err) {
            setError(err.message || 'Failed to create member. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-8 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center text-primary border border-blue-100">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Add Member</h2>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">New fellowship member</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-8 max-h-[80vh] overflow-y-auto">
                    {success ? (
                        <div className="flex flex-col items-center gap-4 py-6 text-center">
                            <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-secondary border border-emerald-100">
                                <CheckCircle2 size={32} />
                            </div>
                            {inviteResult ? (
                                <div className="space-y-4 w-full">
                                    <h3 className="text-xl font-black text-slate-900">Member added and invitation created.</h3>
                                    <InviteLinkResult inviteResult={inviteResult} onDone={handleDone} />
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-xl font-black text-slate-900">Member Added!</h3>
                                    <p className="text-sm text-slate-500">Refreshing your member list...</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    {error}
                                </motion.div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">First Name *</label>
                                    <input type="text" required name="first_name" value={form.first_name} onChange={handleChange} className="input-field h-12 text-sm" placeholder="John" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Name *</label>
                                    <input type="text" required name="last_name" value={form.last_name} onChange={handleChange} className="input-field h-12 text-sm" placeholder="Doe" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors w-4 h-4" />
                                    <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field pl-11 h-12 text-sm" placeholder="john@example.com" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
                                <input type="tel" name="phone" value={form.phone} onChange={handleChange} className="input-field h-12 text-sm" placeholder="080..." />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Status *</label>
                                <select name="status" value={form.status} onChange={handleChange} className="input-field h-12 text-sm bg-white">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div>
                                    <label className="block text-xs font-bold text-slate-900">Grant Login Access</label>
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Enable login credentials and roles</p>
                                </div>
                                <input type="checkbox" name="grant_login_access" checked={form.grant_login_access} onChange={handleChange} className="w-5 h-5 accent-primary cursor-pointer rounded" />
                            </div>
                            {form.grant_login_access && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <p className="text-[10px] text-primary font-bold bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-1.5">
                                        <Lock size={12} />
                                        <span>Gatherly will create login access and send this person an invitation.</span>
                                    </p>
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">System Role *</label>
                                        <select name="role" value={form.role} onChange={handleChange} className="input-field h-12 text-sm bg-white">
                                            <option value="">Select role</option>
                                            <option value="fellowship_admin">Fellowship Admin</option>
                                            <option value="leadership_committee">Leadership Committee</option>
                                            <option value="executive">Executive</option>
                                            <option value="general_member">General Member</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Department / Unit</label>
                                        <select name="department_id" value={form.department_id} onChange={handleChange} className="input-field h-12 text-sm bg-white">
                                            <option value="">Select a department...</option>
                                            {departments.map((d) => (
                                                <option key={d.value} value={d.value}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={handleClose} className="flex-1 py-3.5 text-slate-500 font-bold border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors text-sm">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex-1 btn-primary py-3.5 text-sm">
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <span>Add Member</span>}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const MemberCard = ({ member, canManageInvites, onClick, onEdit, onResend }) => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onClick={() => onClick?.(member)} className="section-card section-card-hover p-8 group cursor-pointer">
        <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-primary text-lg">
                    {member.first_name?.[0] ?? '?'}{member.last_name?.[0] ?? ''}
                </div>
                <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
                        {member.first_name} {member.last_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-secondary' : 'bg-slate-300'}`} />
                        <span className="text-xs text-slate-400 capitalize">{member.status || 'active'}</span>
                    </div>
                    <div className="mt-2">
                        <InviteStatusBadge member={member} />
                    </div>
                </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); onEdit?.(member); }} className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-primary/20 rounded-xl text-slate-400 hover:text-primary transition-all" title="Edit member">
                    <Edit size={16} />
                </button>
            </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-50">
            {member.email && (
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <Mail size={16} className="text-slate-300 shrink-0" />
                    <span className="truncate">{member.email}</span>
                </div>
            )}
            {member.phone && (
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <Phone size={16} className="text-slate-300 shrink-0" />
                    <span>{member.phone}</span>
                </div>
            )}
            {!member.email && !member.phone && (
                <p className="text-sm text-slate-300 italic">No contact info added yet</p>
            )}
            <div className="flex items-center justify-between gap-3 pt-2">
                {member.role && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {roleLabels[member.role] || member.role.replace(/_/g, ' ')}
                    </span>
                )}
                <ResendInviteButton member={member} canManageInvites={canManageInvites} onResend={onResend} />
            </div>
        </div>
    </motion.div>
);

// ─── Main Component ──────────────────────────────────────────────────────

const Members = () => {
    const { user, role, roles } = useAuth();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [departments, setDepartments] = useState([]);

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        setApiError('');
        try {
            const response = await MemberService.getAll();
            setMembers(normalizeMembers(response));
        } catch (err) {
            console.error('Error fetching members', err);
            setApiError(err.type === 'cors_or_network' ? 'Cannot reach server. Check your connection.' : err.message || 'Failed to load members.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const res = await DepartmentService.getAll();
                if (!mounted) return;
                setDepartments(normalizeDepartments(res));
            } catch (err) {
                console.error('Failed to load departments', err);
            }
        };
        load();
        return () => { mounted = false; };
    }, []);

    const filteredMembers = members.filter((m) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return m.first_name?.toLowerCase().includes(q) || m.last_name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
    });

    const activeCount = members.filter((m) => m.status === 'active').length;
    const reachedCount = members.filter((m) => m.email || m.phone).length;
    const activeRoles = new Set([user?.role, role, ...(Array.isArray(user?.roles) ? user.roles : []), ...(Array.isArray(roles) ? roles : [])].filter(Boolean));
    const canManageInvites = ['super_admin', 'fellowship_admin'].some((allowedRole) => activeRoles.has(allowedRole));
    const canManageMembers = canManageInvites;

    const [selectedMember, setSelectedMember] = useState(null);
    const [memberDetail, setMemberDetail] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');
    const [activeDrawerMember, setActiveDrawerMember] = useState(null);
    const activeDrawerMemberRef = useRef(null);
    const detailRequestRef = useRef(0);

    const [confirmPerforming, setConfirmPerforming] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSetLoginOpen, setIsSetLoginOpen] = useState(false);
    const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmPayload, setConfirmPayload] = useState({});

    const [isResendInviteOpen, setIsResendInviteOpen] = useState(false);
    const [resendMember, setResendMember] = useState(null);
    const [resendResult, setResendResult] = useState(null);
    const [resending, setResending] = useState(false);

    const openResendInvite = (member) => {
        setResendMember(member);
        setIsResendInviteOpen(true);
        setResendResult(null);
    };

    const performResendInvite = async () => {
        setResending(true);
        try {
            const payload = { member_id: getMemberKey(resendMember) };
            const res = await MemberService.resendInvite(payload);
            const data = res?.data || res;
            setResendResult({
                invite_link: data.invite_link,
                email_sent: !!data.email_sent,
                expires_at: data.expires_at
            });
        } catch (err) {
            console.error('Resend failed', err);
            alert(err.message || 'Failed to resend invite.');
            setIsResendInviteOpen(false);
        } finally {
            setResending(false);
            afterSaveRefresh();
        }
    };

    const fetchMemberDetail = useCallback(async (member) => {
        if (!member) return;
        const memberKey = getMemberKey(member);
        const requestId = ++detailRequestRef.current;
        setDetailLoading(true);
        setDetailError('');
        try {
            const res = await MemberService.getById(memberKey);
            if (requestId !== detailRequestRef.current) return;
            if (getMemberKey(activeDrawerMemberRef.current) !== memberKey) return;
            const detail = normalizeMemberDetail(res, member);
            setMemberDetail(detail);
        } catch (err) {
            if (requestId !== detailRequestRef.current) return;
            console.error('Failed to load member detail', err);
            setDetailError(err.message || 'Failed to load member details.');
            setMemberDetail(null);
        } finally {
            if (requestId === detailRequestRef.current) setDetailLoading(false);
        }
    }, []);

    const openMemberDetail = (member) => {
        if (!member) return;
        const memberKey = getMemberKey(member);
        const currentKey = getMemberKey(activeDrawerMember);
        if (isDetailOpen && currentKey && memberKey && currentKey === memberKey) return;

        const stableMember = { ...member };
        setActiveDrawerMember(stableMember);
        activeDrawerMemberRef.current = stableMember;
        setSelectedMember(stableMember);
        setMemberDetail(null);
        setDetailError('');
        setIsDetailOpen(true);
        fetchMemberDetail(stableMember);
    };

    const closeMemberDetail = () => {
        detailRequestRef.current += 1;
        setIsDetailOpen(false);
        setSelectedMember(null);
        setActiveDrawerMember(null);
        activeDrawerMemberRef.current = null;
        setMemberDetail(null);
        setDetailError('');
        setDetailLoading(false);
    };

    const openEditMember = (member) => {
        setSelectedMember(member);
        setIsEditOpen(true);
    };

    const confirmActionFor = (action, member) => {
        setConfirmPayload({ action, member });
        setIsConfirmOpen(true);
    };

    const performConfirmAction = async () => {
        const { action, member } = confirmPayload;
        if (!member) return;
        setConfirmPerforming(true);
        const id = getMemberKey(member);
        try {
            if (action === 'deactivate') {
                await MemberService.update(id, { status: 'inactive' });
            } else if (action === 'activate') {
                await MemberService.update(id, { status: 'active' });
            } else if (action === 'delete') {
                await MemberService.delete(id);
            }
            setIsConfirmOpen(false);
            closeMemberDetail();
            await fetchMembers();
        } catch (err) {
            console.error('Action failed', err);
            alert(err.message || 'Action failed.');
        } finally {
            setConfirmPerforming(false);
        }
    };

    const afterSaveRefresh = async () => {
        await fetchMembers();
        if (activeDrawerMember) {
            try { await fetchMemberDetail(activeDrawerMember); } catch { /* ignore */ }
        }
    };

    // Derived state optimization applied using useMemo
    const modalMember = useMemo(() => {
        if (activeDrawerMember) {
            if (memberDetail && getMemberKey(memberDetail) === getMemberKey(activeDrawerMember)) return memberDetail;
            return activeDrawerMember;
        }
        return memberDetail || selectedMember;
    }, [activeDrawerMember, memberDetail, selectedMember]);

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Members</h1>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-lg">
                            Monitor and manage your fellowship base.
                        </p>
                    </div>

                    <PermissionGate allowedRoles={['super_admin', 'fellowship_admin']}>
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                            <button onClick={() => setIsImportOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                                <Download size={18} />
                                <span>Import</span>
                            </button>
                            <button onClick={() => setIsAddOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-blue-900/10">
                                <UserPlus size={18} />
                                <span>Add Member</span>
                            </button>
                        </div>
                    </PermissionGate>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SectionCard title="Total Members" description="Complete fellowship base" icon={Users}>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-slate-900 tracking-tighter">{members.length}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Members</span>
                        </div>
                    </SectionCard>
                    <SectionCard title="Active Status" description="Engaged members" icon={UserPlus}>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-secondary tracking-tighter">{activeCount}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Active</span>
                        </div>
                    </SectionCard>
                    <SectionCard title="Contact Reached" description="With valid email or phone" icon={Mail}>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-primary tracking-tighter">{reachedCount}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Reached</span>
                        </div>
                    </SectionCard>
                </div>

                <div className="relative w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={22} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name or email…"
                        className="bg-white border border-slate-200 rounded-3xl pl-16 pr-6 py-5 text-base text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all w-full placeholder:text-slate-400 shadow-sm"
                    />
                </div>

                {apiError && !loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 bg-red-50 border border-red-100 text-red-600 p-6 rounded-3xl">
                        <AlertCircle size={22} className="shrink-0" />
                        <div>
                            <p className="font-bold text-sm">Could not load members</p>
                            <p className="text-xs mt-1 font-medium opacity-80">{apiError}</p>
                        </div>
                        <button onClick={fetchMembers} className="ml-auto text-xs font-black uppercase tracking-widest text-red-600 hover:text-red-800 underline">Retry</button>
                    </motion.div>
                )}

                {loading ? (
                    <div className="py-24 flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-slate-400 font-medium">Loading members…</p>
                    </div>
                ) : filteredMembers.length === 0 && !apiError ? (
                    <div className="py-24 flex flex-col items-center text-center max-w-md mx-auto space-y-8">
                        <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center border border-blue-100 shadow-inner">
                            <Users size={40} className="text-primary/30" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                                {searchTerm ? 'No results found' : 'No members yet'}
                            </h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                {searchTerm ? 'Try a different name or email address.' : 'Add your first member to start managing your fellowship. You can add them one by one or import your existing list.'}
                            </p>
                        </div>
                        {!searchTerm && (
                            <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
                                <button onClick={() => setIsAddOpen(true)} className="btn-primary flex-1"><Plus size={18} /><span>Add First Member</span></button>
                                <button onClick={() => setIsImportOpen(true)} className="btn-outline flex-1"><Download size={18} /><span>Import List</span></button>
                            </div>
                        )}
                    </div>
                ) : !apiError ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <AnimatePresence>
                                {filteredMembers.map((member) => (
                                    <MemberCard
                                        key={member.value || member.id}
                                        member={member}
                                        canManageInvites={canManageInvites}
                                        onClick={(m) => openMemberDetail(m)}
                                        onEdit={(m) => openEditMember(m)}
                                        onResend={(m) => openResendInvite(m)}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                        <div className="text-center pt-4">
                            <p className="text-sm text-slate-400">
                                {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
                                {searchTerm ? ' found' : ' total'}
                            </p>
                        </div>
                    </>
                ) : null}
            </div>

            <AnimatePresence>
                {isDetailOpen && activeDrawerMember && (
                    <MemberDetailDrawer 
                        key={getMemberKey(activeDrawerMember)} 
                        isOpen={isDetailOpen} 
                        onClose={closeMemberDetail} 
                        member={activeDrawerMember} 
                        detail={memberDetail}
                        detailLoading={detailLoading}
                        detailError={detailError}
                        fetchMemberDetail={fetchMemberDetail}
                        canManageMembers={canManageMembers}
                        actions={{
                            onEdit: openEditMember,
                            onSetLogin: (m) => {
                                setIsSetLoginOpen(true);
                                setSelectedMember(m);
                            },
                            onChangeRole: (m) => {
                                setIsChangeRoleOpen(true);
                                setSelectedMember(m);
                            },
                            onDeactivate: (m) => confirmActionFor('deactivate', m),
                            onDelete: (m) => confirmActionFor('delete', m)
                        }}
                    />
                )}
            </AnimatePresence>

            <EditMemberModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} member={modalMember} departments={departments} onSaveSuccess={afterSaveRefresh} />
            <SetLoginAccessModal isOpen={isSetLoginOpen} onClose={() => setIsSetLoginOpen(false)} member={modalMember} />
            <ChangeRoleModal isOpen={isChangeRoleOpen} onClose={() => setIsChangeRoleOpen(false)} member={modalMember} onSaveSuccess={afterSaveRefresh} />
            
            <ConfirmModal 
                isOpen={isConfirmOpen} 
                onClose={() => setIsConfirmOpen(false)} 
                title={confirmPayload.action === 'delete' ? 'Delete member' : confirmPayload.action === 'deactivate' ? 'Change member status' : 'Confirm'} 
                message={confirmPayload.action === 'delete' ? 'Are you sure you want to remove this member? This action may affect reports and history.' : 'Are you sure you want to perform this action?'} 
                onConfirm={performConfirmAction} 
                confirmText={confirmPayload.action === 'delete' ? 'Delete Permanently' : 'Confirm'} 
                destructive={confirmPayload.action === 'delete'} 
                performing={confirmPerforming} 
            />

            <AnimatePresence>
                {isResendInviteOpen && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/50">
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl text-center">
                            {resendResult ? (
                                <div className="space-y-4">
                                    <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-secondary border border-emerald-100 mb-4">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900">Invite Resent Successfully</h3>
                                    <InviteLinkResult inviteResult={resendResult} onDone={() => setIsResendInviteOpen(false)} />
                                </div>
                            ) : (
                                <div className="space-y-4 text-left">
                                    <h3 className="text-lg font-bold">Resend Invitation</h3>
                                    <p className="text-sm text-slate-500">Are you sure you want to resend the invitation email to <strong>{resendMember?.first_name} {resendMember?.last_name}</strong>?</p>
                                    <div className="flex gap-2 mt-6">
                                        <button onClick={() => setIsResendInviteOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl">Cancel</button>
                                        <button onClick={performResendInvite} disabled={resending} className="flex-1 py-3 bg-primary text-white rounded-xl flex justify-center items-center">
                                            {resending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Resend Invite'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isAddOpen && (
                    <AddMemberModal
                        isOpen={isAddOpen}
                        onClose={() => setIsAddOpen(false)}
                        onSuccess={fetchMembers}
                        departments={departments}
                    />
                )}
            </AnimatePresence>

            <MemberImport
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onComplete={fetchMembers}
            />
        </Layout>
    );
};

export default Members;