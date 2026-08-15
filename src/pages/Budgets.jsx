import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, X, FileText, CheckCircle2, AlertCircle, Loader2, ChevronRight,
    Info, Coins, Briefcase, Clock, ArrowRight, ChevronLeft, UserCheck,
    Send, TrendingUp, Check, Slash, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { BudgetRequestsService, DepartmentService, FinanceAccountsService } from '../api/services';
import { normalizeArrayResponse, sameApiId, entityValue } from '../utils/apiResponse';
import { ConfirmModal, AlertModal } from '../components/ui/Modal';

const fmt = (n) => new Intl.NumberFormat('en-NG', { minimumFractionDigits: 0 }).format(n);

const friendlyError = (err) => {
    return err?.response?.data?.message || err?.message || 'Something went wrong';
};

const normalizeBudgetRequests = (response) => normalizeArrayResponse(response, ['requests', 'budget_requests', 'items']).map((request) => ({
    ...request,
    value: entityValue(request, ['request_id', 'budget_request_id', 'id']),
    title: request.title || request.name || 'Untitled Request',
    status: request.status || request.current_stage || 'draft'
}));

const normalizeDepartments = (response) => normalizeArrayResponse(response, ['departments', 'items']).map((department) => ({
    ...department,
    value: entityValue(department, ['department_id', 'id']),
    name: department.name || department.department_name || 'Unnamed Unit'
}));

const normalizeAccounts = (response) => normalizeArrayResponse(response, ['accounts', 'items']).map((account) => ({
    ...account,
    value: entityValue(account, ['account_id', 'id']),
    account_name: account.account_name || account.name || 'Unnamed Account',
    balance: Number(account.current_balance ?? account.balance ?? account.opening_balance ?? 0)
}));

const getStatusStyles = (status = 'draft') => {
    const s = status.toLowerCase();
    switch (s) {
        case 'draft':
            return 'bg-slate-100 text-slate-600 border-slate-200';
        case 'submitted':
            return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'under_review':
        case 'under review':
            return 'bg-amber-50 text-amber-600 border-amber-100';
        case 'approved':
            return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'declined':
            return 'bg-rose-50 text-rose-600 border-rose-100';
        case 'returned':
            return 'bg-orange-50 text-orange-600 border-orange-100';
        case 'completed':
            return 'bg-indigo-50 text-indigo-600 border-indigo-100';
        default:
            return 'bg-slate-100 text-slate-500 border-slate-100';
    }
};

const Budgets = () => {
    const { user, role, roles } = useAuth();
    const [requests, setRequests] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    
    // Creation Guide Form States
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        title: '',
        description: '',
        purpose: 'Event preparation',
        amount: '',
        department_id: '',
        account_id: '',
        items: [{ item_name: '', quantity: 1, unit_cost: '' }]
    });

    const [submitting, setSubmitting] = useState(false);
    const [actionSuccess, setActionSuccess] = useState('');
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const fetchBudgetsData = useCallback(async () => {
        setLoading(true);
        setApiError('');
        try {
            const [reqsData, deptsData, acctsData] = await Promise.all([
                BudgetRequestsService.getAll(),
                DepartmentService.getAll().catch(() => []),
                FinanceAccountsService.getAll().catch(() => [])
            ]);

            setRequests(normalizeBudgetRequests(reqsData));
            setDepartments(normalizeDepartments(deptsData));
            setAccounts(normalizeAccounts(acctsData));
        } catch (err) {
            console.error('Error fetching budgets data', err);
            setApiError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBudgetsData();
    }, [fetchBudgetsData]);

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        setApiError('');
        setSubmitting(true);
        try {
            // Map items correctly and calculate final sum
            const parsedItems = form.items.map(it => ({
                item_name: it.item_name.trim(),
                quantity: Number(it.quantity) || 1,
                unit_cost: Number(it.unit_cost) || 0
            }));
            
            const calculatedTotal = parsedItems.reduce((acc, curr) => acc + (curr.quantity * curr.unit_cost), 0);

            const payload = {
                title: form.title.trim(),
                description: form.description.trim(),
                purpose: form.purpose,
                amount: calculatedTotal || Number(form.amount) || 0,
                department_id: form.department_id,
                account_id: form.account_id,
                items: parsedItems
            };

            await BudgetRequestsService.create(payload);
            setActionSuccess('Budget request saved as Draft!');
            setTimeout(() => {
                setActionSuccess('');
                setIsCreateOpen(false);
                setStep(1);
                setForm({
                    title: '',
                    description: '',
                    purpose: 'Event preparation',
                    amount: '',
                    department_id: '',
                    account_id: '',
                    items: [{ item_name: '', quantity: 1, unit_cost: '' }]
                });
                fetchBudgetsData();
            }, 1200);
        } catch (err) {
            setApiError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    };

    // Budget Action triggers
    const triggerSubmit = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Submit Request?',
            message: 'Submit this budget request for verification?',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setSubmitting(true);
                try {
                    await BudgetRequestsService.submit(id);
                    setActionSuccess('Budget submitted for review!');
                    setTimeout(() => {
                        setActionSuccess('');
                        setSelectedRequest(null);
                        fetchBudgetsData();
                    }, 1000);
                } catch (err) {
                    setAlertModal({ isOpen: true, title: 'Submission Failed', message: friendlyError(err) });
                } finally {
                    setSubmitting(false);
                }
            }
        });
    };

    const triggerReview = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Verify Request?',
            message: 'Verify and mark this request as "Under Review"?',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setSubmitting(true);
                try {
                    await BudgetRequestsService.review(id, { notes: 'Verified by secretary.' });
                    setActionSuccess('Marked as Under Review!');
                    setTimeout(() => {
                        setActionSuccess('');
                        setSelectedRequest(null);
                        fetchBudgetsData();
                    }, 1000);
                } catch (err) {
                    setAlertModal({ isOpen: true, title: 'Verification Failed', message: friendlyError(err) });
                } finally {
                    setSubmitting(false);
                }
            }
        });
    };

    const triggerApprove = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Authorize Disbursements?',
            message: 'Approve and authorize disbursements for this budget request?',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setSubmitting(true);
                try {
                    await BudgetRequestsService.approve(id, { notes: 'Approved for event preparations.' });
                    setActionSuccess('Budget approved successfully!');
                    setTimeout(() => {
                        setActionSuccess('');
                        setSelectedRequest(null);
                        fetchBudgetsData();
                    }, 1000);
                } catch (err) {
                    setAlertModal({ isOpen: true, title: 'Approval Failed', message: friendlyError(err) });
                } finally {
                    setSubmitting(false);
                }
            }
        });
    };

    const triggerDecline = async (id) => {
        const reason = window.prompt('Provide decline reason/feedback notes:');
        if (reason === null) return; // Cancelled prompt
        setSubmitting(true);
        try {
            await BudgetRequestsService.decline(id, { notes: reason || 'Declined' });
            setActionSuccess('Budget request declined.');
            setTimeout(() => {
                setActionSuccess('');
                setSelectedRequest(null);
                fetchBudgetsData();
            }, 1000);
        } catch (err) {
            setAlertModal({ isOpen: true, title: 'Decline Failed', message: friendlyError(err) });
        } finally {
            setSubmitting(false);
        }
    };

    // Item form line manipulation
    const handleAddItemLine = () => {
        setForm(prev => ({
            ...prev,
            items: [...prev.items, { item_name: '', quantity: 1, unit_cost: '' }]
        }));
    };

    const handleRemoveItemLine = (idx) => {
        if (form.items.length === 1) return;
        setForm(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== idx)
        }));
    };

    const handleItemChange = (idx, field, value) => {
        setForm(prev => {
            const list = [...prev.items];
            list[idx][field] = value;
            return { ...prev, items: list };
        });
    };

    const calculateFormSum = () => {
        return form.items.reduce((acc, curr) => {
            return acc + ((Number(curr.quantity) || 0) * (Number(curr.unit_cost) || 0));
        }, 0);
    };

    // Render step content inside Create Wizard
    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                        <div className="space-y-1">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Step 1: Core Details</h3>
                            <p className="text-[10px] text-slate-400 font-bold">What is this budget request for?</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Title <span className="text-rose-400">*</span></label>
                            <input
                                type="text"
                                required
                                value={form.title}
                                onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                                className="input-field h-12 text-sm font-bold animate-none"
                                placeholder="e.g. Choir Sound System Upgrade"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Purpose <span className="text-rose-400">*</span></label>
                            <select
                                value={form.purpose}
                                onChange={(e) => setForm(p => ({ ...p, purpose: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white rounded-2xl px-5 py-3.5 outline-none font-bold text-sm text-slate-800 transition-all cursor-pointer animate-none"
                            >
                                <option value="Event preparation">Event Preparation</option>
                                <option value="Equipment purchase">Equipment Purchase</option>
                                <option value="Operational expense">Operational Expense</option>
                                <option value="Welfare">Welfare & Support</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Request Description <span className="text-rose-400">*</span></label>
                            <textarea
                                required
                                rows={3}
                                value={form.description}
                                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white rounded-2xl p-5 outline-none font-bold text-sm text-slate-800 transition-all placeholder:text-slate-300 resize-none"
                                placeholder="Please explain why these budget funds are required..."
                            />
                        </div>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                        <div className="space-y-1 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Step 2: Expenditure Breakdown</h3>
                                <p className="text-[10px] text-slate-400 font-bold">List the items you need to pay for.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddItemLine}
                                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1"
                            >
                                <Plus size={12} />
                                <span>Add Line</span>
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {form.items.map((item, idx) => (
                                <div key={idx} className="flex gap-2 items-center bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                                    <div className="flex-1 space-y-1">
                                        <input
                                            type="text"
                                            required
                                            placeholder="Item Name"
                                            value={item.item_name}
                                            onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                                            className="w-full bg-white border border-slate-150 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="w-20 space-y-1">
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            placeholder="Qty"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                            className="w-full bg-white border border-slate-150 rounded-xl px-3 py-2 text-xs font-bold text-center outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="w-28 space-y-1">
                                        <input
                                            type="number"
                                            required
                                            placeholder="Cost (â‚¦)"
                                            value={item.unit_cost}
                                            onChange={(e) => handleItemChange(idx, 'unit_cost', e.target.value)}
                                            className="w-full bg-white border border-slate-150 rounded-xl px-3 py-2 text-xs font-bold text-right outline-none focus:border-primary"
                                        />
                                    </div>
                                    {form.items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItemLine(idx)}
                                            className="p-2 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Total Sum Required:</span>
                            <span className="font-mono text-lg font-black text-secondary">â‚¦{fmt(calculateFormSum())}</span>
                        </div>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                        <div className="space-y-1">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Step 3: Fellowship Units & Accounts</h3>
                            <p className="text-[10px] text-slate-400 font-bold">Assign this budget request to the correct account.</p>
                        </div>
                        
                        {/* Department ID */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Fellowship Unit (Department) <span className="text-rose-400">*</span></label>
                            <select
                                required
                                value={form.department_id}
                                onChange={(e) => setForm(p => ({ ...p, department_id: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white rounded-2xl px-5 py-3.5 outline-none font-bold text-sm text-slate-800 transition-all cursor-pointer"
                            >
                                <option value="">Select Fellowship Unit</option>
                                {departments.map(dept => (
                                    <option key={dept.value} value={dept.value}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Account ID */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Ledger Source Account <span className="text-rose-400">*</span></label>
                            <select
                                required
                                value={form.account_id}
                                onChange={(e) => setForm(p => ({ ...p, account_id: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white rounded-2xl px-5 py-3.5 outline-none font-bold text-sm text-slate-800 transition-all cursor-pointer"
                            >
                                <option value="">Select Ledger Account</option>
                                {accounts.map(acct => (
                                    <option key={acct.value} value={acct.value}>
                                        {acct.account_name || acct.name} (â‚¦{fmt(acct.balance ?? 0)})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </motion.div>
                );
            case 4:
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                        <div className="space-y-1">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Step 4: Request Verification</h3>
                            <p className="text-[10px] text-slate-400 font-bold">Please verify all values before saving.</p>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4 text-xs font-bold text-slate-700">
                            <div className="flex justify-between border-b border-slate-100 pb-2.5">
                                <span className="text-slate-400 uppercase tracking-wider text-[9px]">Title:</span>
                                <span>{form.title}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2.5">
                                <span className="text-slate-400 uppercase tracking-wider text-[9px]">Fellowship Unit:</span>
                                <span>{departments.find(d => sameApiId(d.value, form.department_id))?.name || 'Not Selected'}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2.5">
                                <span className="text-slate-400 uppercase tracking-wider text-[9px]">Account Source:</span>
                                <span>{accounts.find(a => sameApiId(a.value, form.account_id))?.account_name || 'Not Selected'}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2.5">
                                <span className="text-slate-400 uppercase tracking-wider text-[9px]">Total Allocation Requested:</span>
                                <span className="font-mono text-emerald-600">â‚¦{fmt(calculateFormSum())}</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 text-amber-900 p-4 rounded-xl text-xs font-bold">
                            <AlertCircle size={16} className="shrink-0 text-amber-500 mt-0.5" />
                            <span>This request will be initially saved as a "Draft". You can submit it for approval from the budgets table afterwards.</span>
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    // Role verification utilities
    const activeRoles = new Set([user?.role, role, ...(Array.isArray(user?.roles) ? user.roles : []), ...(Array.isArray(roles) ? roles : [])].filter(Boolean));
    const isSecretary = ['secretary', 'pastor', 'super_admin', 'fellowship_admin'].some((allowedRole) => activeRoles.has(allowedRole));
    const isPresident = ['president', 'pastor', 'super_admin'].some((allowedRole) => activeRoles.has(allowedRole));

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Budget Requests</h1>
                        <p className="text-sm text-slate-500 mt-3 font-medium max-w-md leading-relaxed">
                            Draft, review, and authorize fellowship budget allocations in a secure double-entry environment.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="btn-secondary self-start md:self-auto"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Budget Request</span>
                    </button>
                </div>

                {/* API Error Notification */}
                {apiError && !loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-4 bg-red-50 border border-red-100 text-red-600 p-6 rounded-3xl"
                    >
                        <AlertCircle size={22} className="shrink-0" />
                        <div>
                            <p className="font-bold text-sm">Failed to sync budgets</p>
                            <p className="text-xs mt-1 opacity-80">{apiError}</p>
                        </div>
                        <button onClick={fetchBudgetsData} className="ml-auto text-xs font-black uppercase tracking-widest underline shrink-0">
                            Retry
                        </button>
                    </motion.div>
                )}

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Pane: Requests Master List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-6 sm:p-8">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-primary shadow-lg shadow-blue-900/5">
                                    <Briefcase size={28} />
                                </div>
                                <div>
                                    <h3 className="font-black text-2xl text-slate-900 tracking-tighter uppercase leading-none">All Allocations</h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Treasury Request Log</p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="py-24 flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    <p className="text-sm font-bold text-slate-400">Syncing allocations logâ€¦</p>
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="py-24 flex flex-col items-center text-center max-w-sm mx-auto space-y-6">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                                        <Briefcase size={32} className="text-slate-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-slate-500 font-black">No budget requests yet</p>
                                        <p className="text-xs text-slate-400 leading-normal font-medium">
                                            Create a structured allocation draft for your first fellowship event or unit ministration.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3.5">
                                    {requests.map((req) => {
                                        const currentStatus = req.status || 'draft';
                                        
                                        // Determine who acts next based on status
                                        let nextActor = 'Unit Head (Submit)';
                                        if (currentStatus === 'submitted') nextActor = 'Secretary (Review)';
                                        else if (currentStatus === 'under_review' || currentStatus === 'under review') nextActor = 'President (Approve)';
                                        else if (currentStatus === 'approved') nextActor = 'Finance (Disburse)';
                                        else if (currentStatus === 'declined') nextActor = 'Request Completed';
                                        else if (currentStatus === 'completed') nextActor = 'Ledger Archived';

                                        return (
                                            <div
                                                key={req.value || req.id}
                                                onClick={() => setSelectedRequest(req)}
                                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:shadow-md transition-all gap-4 ${
                                                    selectedRequest?.id === req.id ? 'ring-2 ring-primary/20 bg-slate-50 border-slate-300' : ''
                                                }`}
                                            >
                                                <div className="space-y-2.5">
                                                    <div className="flex items-center gap-2.5 flex-wrap">
                                                        <span className="font-black text-sm text-slate-900 tracking-tight">
                                                            {req.title}
                                                        </span>
                                                        <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-md ${getStatusStyles(currentStatus)}`}>
                                                            {currentStatus}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold flex-wrap">
                                                        <span>Unit: {departments.find(d => sameApiId(d.value, req.department_id))?.name || `Unit #${req.department_id}`}</span>
                                                        <span>â€¢</span>
                                                        <span>Next: <strong className="text-slate-600">{nextActor}</strong></span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between sm:justify-end gap-6">
                                                    <span className="font-mono text-sm font-black text-slate-800">
                                                        â‚¦{fmt(req.amount)}
                                                    </span>
                                                    <ChevronRight size={16} className="text-slate-400 hidden sm:block" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Pane: Budget Detail View & Actions */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 sm:p-8 space-y-6 sticky top-8">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Request Detail View</h3>
                            
                            {selectedRequest ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <div className="space-y-3">
                                        <h4 className="font-black text-xl text-slate-900 tracking-tight leading-snug">
                                            {selectedRequest.title}
                                        </h4>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border rounded-md ${getStatusStyles(selectedRequest.status)}`}>
                                                {selectedRequest.status || 'draft'}
                                            </span>
                                            <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 rounded-md">
                                                ID #{selectedRequest.id}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Financial Allocation stats */}
                                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Cost</p>
                                            <p className="font-mono text-lg font-black text-slate-900 mt-1">â‚¦{fmt(selectedRequest.amount)}</p>
                                        </div>
                                        <Coins className="w-8 h-8 text-primary opacity-30" />
                                    </div>

                                    {/* Visual Status Timeline Progress */}
                                    <div className="space-y-4">
                                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline Progress</span>
                                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-400 gap-1">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                                                    <Check size={10} />
                                                </div>
                                                <span>Draft</span>
                                            </div>
                                            <div className="h-0.5 bg-slate-200 flex-1 -mt-4" />
                                            
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                                    ['submitted', 'under_review', 'under review', 'approved', 'declined'].includes(selectedRequest.status?.toLowerCase())
                                                        ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'
                                                }`}>
                                                    {['submitted', 'under_review', 'under review', 'approved', 'declined'].includes(selectedRequest.status?.toLowerCase()) ? <Check size={10} /> : '2'}
                                                </div>
                                                <span>Submitted</span>
                                            </div>
                                            <div className="h-0.5 bg-slate-200 flex-1 -mt-4" />

                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                                    ['under_review', 'under review', 'approved', 'declined'].includes(selectedRequest.status?.toLowerCase())
                                                        ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'
                                                }`}>
                                                    {['under_review', 'under review', 'approved', 'declined'].includes(selectedRequest.status?.toLowerCase()) ? <Check size={10} /> : '3'}
                                                </div>
                                                <span>Review</span>
                                            </div>
                                            <div className="h-0.5 bg-slate-200 flex-1 -mt-4" />

                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                                    ['approved', 'declined'].includes(selectedRequest.status?.toLowerCase())
                                                        ? selectedRequest.status?.toLowerCase() === 'approved' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                                                        : 'bg-slate-200 text-slate-400'
                                                }`}>
                                                    {['approved', 'declined'].includes(selectedRequest.status?.toLowerCase()) ? <Check size={10} /> : '4'}
                                                </div>
                                                <span>Decision</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Breakdown Items List */}
                                    <div className="space-y-3">
                                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Expenditure Breakdown</span>
                                        {Array.isArray(selectedRequest.items) && selectedRequest.items.length > 0 ? (
                                            <div className="space-y-2 border border-slate-100 p-4 rounded-2xl bg-slate-50">
                                                {selectedRequest.items.map((it, i) => (
                                                    <div key={i} className="flex justify-between text-xs font-bold text-slate-700 py-1 border-b border-slate-100 last:border-b-0">
                                                        <span>{it.item_name || it.name} (x{it.quantity})</span>
                                                        <span className="font-mono text-slate-900">â‚¦{fmt(it.quantity * (it.unit_cost || it.cost || 0))}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 border border-dashed border-slate-200 text-center rounded-2xl text-[10px] text-slate-400 font-bold">
                                                No breakdown line items uploaded.
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-slate-50 pt-6 space-y-3">
                                        <div className="flex justify-between text-xs font-bold text-slate-500">
                                            <span>Fellowship Unit:</span>
                                            <span className="text-slate-800">{departments.find(d => sameApiId(d.value, selectedRequest.department_id))?.name || 'Linked Unit'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold text-slate-500">
                                            <span>Ledger Source:</span>
                                            <span className="text-slate-800">{accounts.find(a => sameApiId(a.value, selectedRequest.account_id))?.account_name || 'Virtual Account'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold text-slate-500">
                                            <span>Purpose Category:</span>
                                            <span className="text-slate-800 capitalize">{selectedRequest.purpose || 'Operations'}</span>
                                        </div>
                                        {selectedRequest.description && (
                                            <div className="pt-2 text-xs font-medium text-slate-400 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <strong className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Description:</strong>
                                                {selectedRequest.description}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons Trigger */}
                                    <div className="border-t border-slate-50 pt-6 space-y-2.5">
                                        {/* Submit Action for Drafts */}
                                        {selectedRequest.status?.toLowerCase() === 'draft' && (
                                            <button
                                                onClick={() => triggerSubmit(selectedRequest.value)}
                                                disabled={submitting}
                                                className="w-full btn-primary py-4 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                            >
                                                <Send size={14} />
                                                <span>Submit for Verification</span>
                                            </button>
                                        )}

                                        {/* Secretary Review buttons */}
                                        {selectedRequest.status?.toLowerCase() === 'submitted' && (
                                            <div className="space-y-2">
                                                {isSecretary ? (
                                                    <>
                                                        <button
                                                            onClick={() => triggerReview(selectedRequest.value)}
                                                            disabled={submitting}
                                                            className="w-full bg-slate-900 text-white hover:bg-slate-800 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                                                        >
                                                            <UserCheck size={14} className="text-secondary" />
                                                            <span>Mark Under Review</span>
                                                        </button>
                                                        <button
                                                            onClick={() => triggerDecline(selectedRequest.value)}
                                                            disabled={submitting}
                                                            className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                                                        >
                                                            <X size={14} />
                                                            <span>Decline Request</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-4 rounded-xl text-[10px] text-slate-400 font-bold justify-center">
                                                        <ShieldCheck size={14} />
                                                        <span>Pending Review (Secretary/Admin Action)</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* President/Pastor final approvals */}
                                        {(selectedRequest.status?.toLowerCase() === 'under_review' || selectedRequest.status?.toLowerCase() === 'under review') && (
                                            <div className="space-y-2">
                                                {isPresident ? (
                                                    <>
                                                        <button
                                                            onClick={() => triggerApprove(selectedRequest.value)}
                                                            disabled={submitting}
                                                            className="w-full btn-secondary py-3.5 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                                        >
                                                            <CheckCircle2 size={14} />
                                                            <span>Approve & Disburse</span>
                                                        </button>
                                                        <button
                                                            onClick={() => triggerDecline(selectedRequest.value)}
                                                            disabled={submitting}
                                                            className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                                                        >
                                                            <X size={14} />
                                                            <span>Decline Request</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-4 rounded-xl text-[10px] text-slate-400 font-bold justify-center">
                                                        <ShieldCheck size={14} />
                                                        <span>Pending Authorization (President/Pastor Action)</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-24 text-center text-slate-400 border border-dashed border-slate-150 rounded-3xl h-64 flex flex-col items-center justify-center">
                                    <Info size={24} className="mb-3 text-slate-300 animate-pulse" />
                                    <p className="text-xs font-bold px-6 leading-relaxed">
                                        Click on any allocation draft or pending request to inspect timeline history and authorize disbursements.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Creation Guide Form Modal */}
            <AnimatePresence>
                {isCreateOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-8 border-b border-slate-100 shrink-0 bg-slate-50/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20">
                                        <Briefcase size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">New Allocation Request</h2>
                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Create and save a budget request</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                                {actionSuccess ? (
                                    <div className="flex flex-col items-center gap-4 py-8 text-center animate-in fade-in">
                                        <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-secondary border border-emerald-100">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900">{actionSuccess}</h3>
                                        <p className="text-sm text-slate-500 font-medium">Refreshing budget requests...</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleCreateRequest} className="space-y-6">
                                        {/* Step Progress indicators */}
                                        <div className="flex items-center justify-between gap-1 mb-4 text-[9px] font-black uppercase tracking-wider text-slate-300">
                                            {[1, 2, 3, 4].map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => s < step && setStep(s)}
                                                    className={`px-3 py-1.5 rounded-lg border transition-all ${
                                                        step === s 
                                                            ? 'bg-slate-900 text-white border-slate-900 scale-105 shadow-md shadow-slate-900/10' 
                                                            : s < step 
                                                                ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-pointer hover:bg-slate-200' 
                                                                : 'bg-white border-slate-100 cursor-not-allowed'
                                                    }`}
                                                >
                                                    Step {s}
                                                </button>
                                            ))}
                                        </div>

                                        {renderStepContent()}

                                        {/* Step Navigation Controls */}
                                        <div className="flex gap-3 pt-6 border-t border-slate-50 shrink-0">
                                            {step > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setStep(prev => prev - 1)}
                                                    className="px-6 py-3.5 text-slate-500 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors text-sm font-black flex items-center gap-2"
                                                >
                                                    <ChevronLeft size={16} />
                                                    <span>Back</span>
                                                </button>
                                            )}
                                            
                                            {step < 4 ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        // Simple verification per step
                                                        if (step === 1 && (!form.title.trim() || !form.description.trim())) {
                                                            setAlertModal({ isOpen: true, title: 'Incomplete Fields', message: 'Please fill in Title and Description.' });
                                                            return;
                                                        }
                                                        if (step === 2) {
                                                            const invalid = form.items.some(it => !it.item_name.trim() || !it.unit_cost);
                                                            if (invalid) {
                                                                setAlertModal({ isOpen: true, title: 'Incomplete Items', message: 'Please fill in Item Name and Cost for all items.' });
                                                                return;
                                                            }
                                                        }
                                                        if (step === 3 && (!form.department_id || !form.account_id)) {
                                                            setAlertModal({ isOpen: true, title: 'Incomplete Allocation', message: 'Please choose fellowship unit and account.' });
                                                            return;
                                                        }
                                                        setStep(prev => prev + 1);
                                                    }}
                                                    className="flex-1 btn-primary py-3.5 text-sm font-black flex items-center justify-center gap-2 ml-auto"
                                                >
                                                    <span>Continue</span>
                                                    <ChevronRight size={16} />
                                                </button>
                                            ) : (
                                                <button
                                                    type="submit"
                                                    disabled={submitting}
                                                    className="flex-1 btn-secondary py-3.5 text-sm font-black flex items-center justify-center gap-2 ml-auto"
                                                >
                                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                                        <>
                                                            <CheckCircle2 size={16} />
                                                            <span>Create Draft</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
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
        </Layout>
    );
};

export default Budgets;

