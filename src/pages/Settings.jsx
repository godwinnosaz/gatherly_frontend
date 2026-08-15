import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings as SettingsIcon, Bell, Shield, Database, Globe, Mail,
    ArrowLeft, ShieldAlert, UserCheck, Trash2, HelpCircle, CheckCircle2,
    AlertCircle, Loader2, Info, Users, ChevronRight, GitPullRequest, GitMerge, Check
} from 'lucide-react';
import { RolesService, MemberService, FlowService } from '../api/services';
import { normalizeArrayResponse, entityValue, sameApiId, normalizeObjectResponse } from '../utils/apiResponse';
import { ConfirmModal, AlertModal } from '../components/ui/Modal';

const friendlyError = (err) => {
    return err?.response?.data?.message || err?.message || 'Something went wrong';
};

const PLATFORM_ROLES = [
    { code: 'platform_admin', name: 'Platform Admin', desc: 'Full global platform system setup' },
    { code: 'super_admin', name: 'Super Admin', desc: 'Fellowship-wide system and settings control' },
    { code: 'pastor', name: 'Pastor / Elder', desc: 'Over-arching spiritual and operational visibility' },
    { code: 'fellowship_admin', name: 'Fellowship Admin', desc: 'Fellowship management and department setup' },
    { code: 'president', name: 'Fellowship President', desc: 'Final financial approval and authorization' },
    { code: 'secretary', name: 'Fellowship Secretary', desc: 'Verify and review budget allocation drafts' },
    { code: 'finance_officer', name: 'Finance Officer', desc: 'Double-entry ledgers, reports, and records' },
    { code: 'unit_head', name: 'Unit Head', desc: 'Creates budget requests for fellowship units' },
    { code: 'department_leader', name: 'Department Leader', desc: 'Directs choir, youth, and other ministry setups' },
    { code: 'member', name: 'Regular Member', desc: 'Basic attendance and directory view-only access' }
];

const normalizeMembers = (response) => normalizeArrayResponse(response, ['members', 'items']).map((member) => ({
    ...member,
    value: entityValue(member, ['member_id', 'user_id', 'id']),
    name: member.name || [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email || 'Unnamed Member'
}));

const SettingsCard = ({ icon: Icon, title, description, onClick }) => (
    <div 
        onClick={onClick}
        className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all cursor-pointer group hover:shadow-xl hover:shadow-blue-900/5 hover:border-primary/20"
    >
        <div className="flex items-start gap-6">
            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-blue-50 group-hover:border-blue-100 transition-all shrink-0 shadow-sm">
                <Icon size={24} />
            </div>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight uppercase group-hover:text-primary transition-colors">{title}</h3>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                </div>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{description}</p>
            </div>
        </div>
    </div>
);

const Settings = () => {
    const { user, role, roles } = useAuth();
    
    // Page view state: null (grid view) or 'roles'
    const [activePanel, setActivePanel] = useState(null);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    // Roles panel states
    const [myRoleData, setMyRoleData] = useState(null);
    const [members, setMembers] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [apiError, setApiError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Assign Role Form state
    const [assignForm, setAssignForm] = useState({
        member_id: '',
        role: 'unit_head'
    });
    const [submittingAssign, setSubmittingAssign] = useState(false);

    const fetchRolesData = useCallback(async () => {
        setLoadingRoles(true);
        setApiError('');
        try {
            const [myRoleRes, memsRes] = await Promise.all([
                RolesService.getMyRole().catch(() => ({ role: user?.role || 'member' })),
                MemberService.getAll().catch(() => [])
            ]);

            const roleData = normalizeObjectResponse(myRoleRes, ['data', 'role']);
            setMyRoleData(roleData?.role || myRoleRes?.role || myRoleRes || user?.role || 'member');
            
            setMembers(normalizeMembers(memsRes));
        } catch (err) {
            console.error('Error fetching roles and members data', err);
            setApiError(friendlyError(err));
        } finally {
            setLoadingRoles(false);
        }
    }, [user]);

    useEffect(() => {
        if (activePanel === 'roles') {
            fetchRolesData();
        }
    }, [activePanel, fetchRolesData]);

    // Flows panel states
    const [flowData, setFlowData] = useState(null);
    const [loadingFlow, setLoadingFlow] = useState(false);
    const [savingFlow, setSavingFlow] = useState(false);

    const fetchFlowData = useCallback(async () => {
        setLoadingFlow(true);
        setApiError('');
        try {
            const res = await FlowService.getByKey('budget_approval');
            setFlowData(normalizeObjectResponse(res, ['flow', 'data']) || null);
        } catch (err) {
            console.error('Error fetching budget approval flow:', err);
            setFlowData(null);
        } finally {
            setLoadingFlow(false);
        }
    }, []);

    useEffect(() => {
        if (activePanel === 'flows') {
            fetchFlowData();
        }
    }, [activePanel, fetchFlowData]);

    const handleSaveDefaultFlow = async () => {
        setSavingFlow(true);
        setApiError('');
        try {
            const defaultFlowPayload = {
                key: 'budget_approval',
                name: 'Budget Approval Workflow',
                steps: ['unit_head', 'secretary', 'president'],
                is_active: true
            };
            const saved = await FlowService.save(defaultFlowPayload);
            setFlowData(saved || defaultFlowPayload);
            setSuccessMsg('Default approval flow successfully saved & published!');
            setTimeout(() => setSuccessMsg(''), 2000);
        } catch (err) {
            console.error('Error saving default flow:', err);
            setApiError(friendlyError(err));
        } finally {
            setSavingFlow(false);
        }
    };

    const handleAssignRoleSubmit = async (e) => {
        e.preventDefault();
        if (!assignForm.member_id || !assignForm.role) {
            setAlertModal({ isOpen: true, title: 'Incomplete Selection', message: 'Please select both a member and a role.' });
            return;
        }
        setSubmittingAssign(true);
        setApiError('');
        try {
            await RolesService.assign({
                member_id: assignForm.member_id,
                role: assignForm.role
            });
            setSuccessMsg('Role assigned successfully!');
            setAssignForm(prev => ({ ...prev, member_id: '' }));
            setTimeout(() => {
                setSuccessMsg('');
                fetchRolesData();
            }, 1200);
        } catch (err) {
            setApiError(friendlyError(err));
        } finally {
            setSubmittingAssign(false);
        }
    };

    const handleRemoveRole = (memberId, roleName) => {
        const mem = members.find(m => sameApiId(m.value, memberId));
        setConfirmModal({
            isOpen: true,
            title: 'Revoke Role?',
            message: `Are you absolutely sure you want to revoke the "${roleName.replace(/_/g, ' ')}" role from ${mem?.name || 'this member'}?`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setLoadingRoles(true);
                setApiError('');
                try {
                    await RolesService.remove({
                        member_id: memberId,
                        role: roleName
                    });
                    setSuccessMsg('Role revoked successfully!');
                    setTimeout(() => {
                        setSuccessMsg('');
                        fetchRolesData();
                    }, 1000);
                } catch (err) {
                    setApiError(friendlyError(err));
                    setLoadingRoles(false);
                }
            }
        });
    };

    // Determine current user permissions
    const activeRoles = new Set([user?.role, role, ...(Array.isArray(user?.roles) ? user.roles : []), ...(Array.isArray(roles) ? roles : [])].filter(Boolean));
    const canManageRoles = ['platform_admin', 'super_admin', 'pastor'].some((allowedRole) => activeRoles.has(allowedRole));

    return (
        <Layout>
            <div className="max-w-5xl mx-auto space-y-12">
                <AnimatePresence mode="wait">
                    {activePanel === null ? (
                        // Master Settings Panel Card Grid
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-12"
                        >
                            <div className="space-y-2">
                                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Settings</h1>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-lg mt-3">
                                    Manage your fellowship details, team members, and preferences.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
                                <SettingsCard 
                                    icon={SettingsIcon} 
                                    title="General" 
                                    description="Update your church name, logo, and basic contact information."
                                    onClick={() => setAlertModal({ isOpen: true, title: 'Feature Coming Soon', message: 'General settings will be available in future releases.' })}
                                />
                                <SettingsCard 
                                    icon={Shield} 
                                    title="Roles & Permissions" 
                                    description="Invite leaders, assign roles, and manage who has access to the dashboard."
                                    onClick={() => setActivePanel('roles')}
                                />
                                <SettingsCard 
                                    icon={GitPullRequest} 
                                    title="Approval Flows" 
                                    description="Configure multi-step tenant workflows such as budget approval stages."
                                    onClick={() => setActivePanel('flows')}
                                />
                                <SettingsCard 
                                    icon={Bell} 
                                    title="Notifications" 
                                    description="Choose how and when you receive alerts and summaries from the platform."
                                    onClick={() => setAlertModal({ isOpen: true, title: 'Feature Coming Soon', message: 'Notification preferences will be available in future releases.' })}
                                />
                                <SettingsCard 
                                    icon={Database} 
                                    title="Data & Export" 
                                    description="Download your member lists and attendance history for your records."
                                    onClick={() => setAlertModal({ isOpen: true, title: 'Feature Coming Soon', message: 'Data backups and export systems will be available in future releases.' })}
                                />
                                <SettingsCard 
                                    icon={Globe} 
                                    title="Public Page" 
                                    description="Customize the link you share with members to join your fellowship."
                                    onClick={() => setAlertModal({ isOpen: true, title: 'Feature Coming Soon', message: 'Public share links configurations will be available in future releases.' })}
                                />
                                <SettingsCard 
                                    icon={Mail} 
                                    title="Messaging" 
                                    description="Set up automatic welcome emails and service reminders for your members."
                                    onClick={() => setAlertModal({ isOpen: true, title: 'Feature Coming Soon', message: 'Communication reminders system will be available in future releases.' })}
                                />
                            </div>
                        </motion.div>
                    ) : activePanel === 'roles' ? (
                        // Active Panel view: Roles & Permissions Manager
                        <motion.div
                            key="roles"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-10 pb-20"
                        >
                            {/* Panel Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <button
                                    onClick={() => { setActivePanel(null); setApiError(''); }}
                                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-black text-xs uppercase tracking-widest self-start"
                                >
                                    <ArrowLeft size={16} />
                                    <span>Back to Settings</span>
                                </button>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Settings / Roles & Permissions</span>
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Roles & Permissions</h2>
                                <p className="text-sm text-slate-500 font-medium">Configure roles and organize who has clearance to submit or approve budgets.</p>
                            </div>

                            {/* API Error Notification */}
                            {apiError && (
                                <div className="flex items-center gap-4 bg-red-50 border border-red-100 text-red-600 p-6 rounded-3xl">
                                    <AlertCircle size={20} className="shrink-0" />
                                    <div className="text-xs font-bold leading-normal">{apiError}</div>
                                </div>
                            )}

                            {/* Success Notification */}
                            {successMsg && (
                                <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 text-emerald-600 p-5 rounded-3xl animate-in fade-in">
                                    <CheckCircle2 size={20} className="shrink-0" />
                                    <div className="text-xs font-bold">{successMsg}</div>
                                </div>
                            )}

                            {loadingRoles && members.length === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    <p className="text-sm font-bold text-slate-400">Syncing roles directory…</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Grid Content: My Current Role & Details */}
                                    <div className="lg:col-span-2 space-y-8">
                                        {/* User Role Card */}
                                        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                                            <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                                            <div className="flex items-start gap-4">
                                                <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center border border-white/20">
                                                    <UserCheck size={28} />
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black text-secondary uppercase tracking-[0.2em]">Authorized Credential Scope</span>
                                                    <h3 className="text-2xl font-black tracking-tight mt-1 capitalize">{String(myRoleData || user?.role || 'member').replace(/_/g, ' ')}</h3>
                                                    <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">
                                                        You currently possess organization clearance. Your privileges are assigned and verified by global system platform audits.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Members list with Roles Assignment Table */}
                                        <div className="bg-slate-50 border border-slate-100 p-6 sm:p-8 rounded-[2.5rem] space-y-6">
                                            <div className="flex items-center gap-3">
                                                <Users size={22} className="text-primary" />
                                                <h4 className="font-black text-lg text-slate-950 uppercase tracking-tight">Active Assignments</h4>
                                            </div>

                                            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                                {members.length === 0 ? (
                                                    <p className="text-xs text-slate-400 font-bold text-center py-8">No organization members found.</p>
                                                ) : (
                                                    members.map(m => {
                                                        const activeRole = m.role || 'member';
                                                        return (
                                                            <div key={m.value || m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl gap-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-primary font-black text-xs">
                                                                        {m.name?.[0]}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-black text-slate-800 leading-none">{m.name}</p>
                                                                        <p className="text-[9px] text-slate-400 font-bold mt-1.5">{m.email}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between sm:justify-end gap-4">
                                                                    <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-500 rounded-md">
                                                                        {activeRole.replace(/_/g, ' ')}
                                                                    </span>
                                                                    
                                                                    {canManageRoles && !sameApiId(m.value, user?.member_id || user?.user_id || user?.id) && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveRole(m.value, activeRole)}
                                                                            className="p-2.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-100 rounded-xl transition-all"
                                                                            title="Revoke Role"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Grid Content: Assign Forms & Explanations */}
                                    <div className="lg:col-span-1 space-y-8">
                                        {/* Assign Role Form */}
                                        <div className="bg-white border border-slate-150 p-6 sm:p-8 rounded-[2.5rem] space-y-5">
                                            <div className="space-y-1">
                                                <h4 className="font-black text-lg text-slate-900 uppercase tracking-tight">Assign Role</h4>
                                                <p className="text-[10px] text-slate-400 font-bold">Grant administrative credentials to organization members.</p>
                                            </div>

                                            {canManageRoles ? (
                                                <form onSubmit={handleAssignRoleSubmit} className="space-y-4">
                                                    {/* Select Member */}
                                                    <div className="space-y-1.5">
                                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Member</label>
                                                        <select
                                                            required
                                                            value={assignForm.member_id}
                                                            onChange={(e) => setAssignForm(p => ({ ...p, member_id: e.target.value }))}
                                                            className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white rounded-xl px-4 py-3 outline-none font-bold text-xs text-slate-800 transition-all cursor-pointer"
                                                        >
                                                            <option value="">Choose Fellowship Member</option>
                                                            {members.map(m => (
                                                                <option key={m.value} value={m.value}>
                                                                    {m.name} ({m.role || 'member'})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Select Role */}
                                                    <div className="space-y-1.5">
                                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Role</label>
                                                        <select
                                                            required
                                                            value={assignForm.role}
                                                            onChange={(e) => setAssignForm(p => ({ ...p, role: e.target.value }))}
                                                            className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white rounded-xl px-4 py-3 outline-none font-bold text-xs text-slate-800 transition-all cursor-pointer"
                                                        >
                                                            {PLATFORM_ROLES.map(r => (
                                                                <option key={r.code} value={r.code}>
                                                                    {r.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <button
                                                        type="submit"
                                                        disabled={submittingAssign}
                                                        className="w-full btn-secondary py-3.5 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                                    >
                                                        {submittingAssign ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck size={14} />}
                                                        <span>Assign Role</span>
                                                    </button>
                                                </form>
                                            ) : (
                                                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 text-amber-900 p-4 rounded-xl text-xs font-bold">
                                                    <ShieldAlert size={16} className="shrink-0 text-amber-500 mt-0.5" />
                                                    <span>View-Only Mode. Managing roles requires platform Platform Admin or Pastor oversight credentials.</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Explanations of Finance-related roles */}
                                        <div className="bg-slate-50 border border-slate-100 p-6 sm:p-8 rounded-[2.5rem] space-y-6">
                                            <div className="flex items-center gap-2.5">
                                                <HelpCircle size={20} className="text-primary" />
                                                <h4 className="font-black text-lg text-slate-900 uppercase tracking-tight leading-none">Financial Clearances</h4>
                                            </div>

                                            <div className="space-y-4 text-xs font-bold text-slate-700">
                                                {/* President */}
                                                <div className="space-y-1 border-l-2 border-primary pl-3">
                                                    <h5 className="text-[11px] font-black uppercase text-slate-900">President</h5>
                                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                                        Authorized for final expenditures approval. Releases ledger disbursements.
                                                    </p>
                                                </div>

                                                {/* Secretary */}
                                                <div className="space-y-1 border-l-2 border-emerald-500 pl-3">
                                                    <h5 className="text-[11px] font-black uppercase text-slate-900">Secretary</h5>
                                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                                        Responsible for verification checks. Reviews raw drafts to verify item lists.
                                                    </p>
                                                </div>

                                                {/* Finance Officer */}
                                                <div className="space-y-1 border-l-2 border-indigo-500 pl-3">
                                                    <h5 className="text-[11px] font-black uppercase text-slate-900">Finance Officer</h5>
                                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                                        Controls platform accounts and records. Manages summaries, audits, and transactions.
                                                    </p>
                                                </div>

                                                {/* Unit Head */}
                                                <div className="space-y-1 border-l-2 border-amber-500 pl-3">
                                                    <h5 className="text-[11px] font-black uppercase text-slate-900">Unit Head</h5>
                                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                                        Originator level. Drafts and submits expenditure breakdowns for ministry departments.
                                                    </p>
                                                </div>

                                                {/* Pastor */}
                                                <div className="space-y-1 border-l-2 border-slate-400 pl-3">
                                                    <h5 className="text-[11px] font-black uppercase text-slate-900">Pastor</h5>
                                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                                        Administrative oversight and audit visibility without direct transaction origination duties.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        // Active Panel view: Approval Flows Manager
                        <motion.div
                            key="flows"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-10 pb-20"
                        >
                            {/* Panel Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <button
                                    onClick={() => { setActivePanel(null); setApiError(''); }}
                                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-black text-xs uppercase tracking-widest self-start"
                                >
                                    <ArrowLeft size={16} />
                                    <span>Back to Settings</span>
                                </button>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Settings / Approval Flows</span>
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Approval Flows</h2>
                                <p className="text-sm text-slate-500 font-medium">Define custom multi-stage approval workflows for your fellowship financial operations.</p>
                            </div>

                            {/* API Error Notification */}
                            {apiError && (
                                <div className="flex items-center gap-4 bg-red-50 border border-red-100 text-red-600 p-6 rounded-3xl animate-in fade-in">
                                    <AlertCircle size={20} className="shrink-0" />
                                    <div className="text-xs font-bold leading-normal">{apiError}</div>
                                </div>
                            )}

                            {/* Success Notification */}
                            {successMsg && (
                                <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 text-emerald-600 p-5 rounded-3xl animate-in fade-in">
                                    <CheckCircle2 size={20} className="shrink-0" />
                                    <div className="text-xs font-bold">{successMsg}</div>
                                </div>
                            )}

                            {loadingFlow ? (
                                <div className="py-24 flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    <p className="text-sm font-bold text-slate-400">Loading flow definition...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Area: Flow Diagram stepper and Info */}
                                    <div className="lg:col-span-2 space-y-8">
                                        <div className="bg-white border border-slate-100 p-8 sm:p-10 rounded-[2.5rem] shadow-sm space-y-10">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-6">
                                                <div>
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Workflow Key: budget_approval</span>
                                                    <h3 className="text-2xl font-black tracking-tight mt-1 text-slate-900">Budget Approval stages</h3>
                                                </div>
                                                <div>
                                                    {flowData ? (
                                                        <span className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
                                                            Active & Published
                                                        </span>
                                                    ) : (
                                                        <span className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider bg-amber-50 border border-amber-100 text-amber-600 rounded-xl">
                                                            Default In Use
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="text-sm text-slate-500 font-medium leading-relaxed font-bold">
                                                Approval flows ensure complete financial security, governance, and audit trails. Currently, all budget requests traverse this automated three-stage review protocol safely and securely.
                                            </p>

                                            {/* Stepper Steps UI */}
                                            <div className="relative pt-6 pb-2">
                                                {/* Connecting horizontal line */}
                                                <div className="absolute top-[2.75rem] left-[15%] right-[15%] h-0.5 bg-slate-100 pointer-events-none hidden sm:block" />
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4 relative z-10">
                                                    {/* Step 1: Unit Head */}
                                                    <div className="flex flex-col items-center text-center space-y-4">
                                                        <div className="w-14 h-14 rounded-[1.25rem] bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-black text-sm shadow-sm">
                                                            1
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-950 uppercase tracking-tight">Unit Head</p>
                                                            <p className="text-[10px] text-slate-400 mt-1 font-bold">Originate & Draft Request</p>
                                                        </div>
                                                    </div>

                                                    {/* Step 2: Secretary */}
                                                    <div className="flex flex-col items-center text-center space-y-4">
                                                        <div className="w-14 h-14 rounded-[1.25rem] bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black text-sm shadow-sm">
                                                            2
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-950 uppercase tracking-tight">Secretary</p>
                                                            <p className="text-[10px] text-slate-400 mt-1 font-bold">Review & Verify Allocation</p>
                                                        </div>
                                                    </div>

                                                    {/* Step 3: President */}
                                                    <div className="flex flex-col items-center text-center space-y-4">
                                                        <div className="w-14 h-14 rounded-[1.25rem] bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-black text-sm shadow-sm">
                                                            3
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-950 uppercase tracking-tight">President</p>
                                                            <p className="text-[10px] text-slate-400 mt-1 font-bold">Final Authorization & Release</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Area: Save / Setup Card */}
                                    <div className="lg:col-span-1 space-y-8">
                                        <div className="bg-slate-50 border border-slate-100 p-6 sm:p-8 rounded-[2.5rem] space-y-6">
                                            <div className="flex items-center gap-2.5">
                                                <GitMerge size={20} className="text-primary" />
                                                <h4 className="font-black text-lg text-slate-950 uppercase tracking-tight">Flow Setup</h4>
                                            </div>

                                            {flowData ? (
                                                <div className="space-y-4 animate-in fade-in">
                                                    <div className="bg-white border border-slate-100 p-5 rounded-2xl space-y-3 shadow-sm">
                                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">Flow Entity Synced</span>
                                                        <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                                            <span>Flow Key:</span>
                                                            <span className="font-mono text-slate-900">{flowData.key}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                                            <span>Name:</span>
                                                            <span className="text-slate-900">{flowData.name || flowData.key}</span>
                                                        </div>
                                                        {flowData.id && (
                                                            <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                                                <span>Database ID:</span>
                                                                <span className="font-mono text-slate-900">#{flowData.id}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={handleSaveDefaultFlow}
                                                        disabled={savingFlow}
                                                        className="w-full bg-white border border-slate-200 hover:border-primary text-slate-800 hover:text-primary py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                                    >
                                                        {savingFlow ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={14} />}
                                                        <span>Reset / Re-save Flow</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-5">
                                                    <p className="text-xs text-slate-500 font-medium leading-relaxed font-bold">
                                                        The server does not have a custom flow mapped to the <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-150">budget_approval</code> key yet.
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-medium leading-relaxed font-bold">
                                                        Click below to register the default three-stage workflow to the database to ensure persistent flow controls.
                                                    </p>

                                                    <button
                                                        onClick={handleSaveDefaultFlow}
                                                        disabled={savingFlow}
                                                        className="w-full btn-secondary py-3.5 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/10"
                                                    >
                                                        {savingFlow ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitMerge size={14} />}
                                                        <span>Save Default Flow</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Security Notice */}
                                        <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-[2.5rem] relative overflow-hidden">
                                            <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
                                            <span className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] block">Governance & Trust</span>
                                            <h5 className="font-black text-sm uppercase mt-1 tracking-tight">Immutable Audit Trails</h5>
                                            <p className="text-[10px] text-slate-400 mt-2 font-medium leading-normal">
                                                Approval flows ensure full oversight. Any modifications made here are securely audited and registered permanently.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={confirmModal.onConfirm}
                    title={confirmModal.title}
                    message={confirmModal.message}
                />
                <AlertModal
                    isOpen={alertModal.isOpen}
                    onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                    title={alertModal.title}
                    message={alertModal.message}
                />
            </div>
        </Layout>
    );
};

export default Settings;
