import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, CheckCircle2, AlertCircle, Loader2, ChevronRight,
    Info, Clock, UserCheck, Check, X, RotateCcw, MessageSquare,
    DollarSign, Briefcase, FileText, ArrowRight
} from 'lucide-react';
import { ApprovalsService, BudgetRequestsService, DepartmentService } from '../api/services';
import { normalizeArrayResponse, entityValue, sameApiId } from '../utils/apiResponse';

const fmt = (n) => new Intl.NumberFormat('en-NG', { minimumFractionDigits: 0 }).format(n);

const friendlyError = (err) => {
    return err?.response?.data?.message || err?.message || 'Something went wrong';
};

const normalizeDepartments = (response) => normalizeArrayResponse(response, ['departments', 'items']).map((department) => ({
    ...department,
    value: entityValue(department, ['department_id', 'id']),
    name: department.name || department.department_name || 'Unnamed Unit'
}));

const normalizeApprovals = (response) => normalizeArrayResponse(response, ['approvals', 'requests', 'budget_requests', 'items']).map(item => {
    const value = entityValue(item, ['request_id', 'budget_request_id', 'entity_id', 'id']);
    return {
        ...item,
        id: item.id,
        value,
        title: item.title || item.name || item.entity_name || 'Budget Request Allocation',
        amount: item.amount || 0,
        status: item.status || item.current_stage || 'submitted',
        department_id: item.department_id,
        entity_type: item.entity_type || 'budget_request',
        entity_id: item.entity_id || value,
        requester: item.requester || item.user || { name: 'Unit Fellowship Head' },
        items: item.items || [],
        description: item.description || item.purpose || '',
        purpose: item.purpose || '',
        created_at: item.created_at || new Date().toISOString()
    };
});

const getStageDetails = (status = 'draft') => {
    const s = status.toLowerCase();
    switch (s) {
        case 'draft':
            return {
                label: 'Draft Mode',
                color: 'bg-slate-100 text-slate-600 border-slate-200',
                desc: 'Waiting for Unit Head to submit'
            };
        case 'submitted':
            return {
                label: 'Waiting for Secretary Review',
                color: 'bg-blue-50 text-blue-600 border-blue-100',
                desc: 'Submitted to Secretary for verification'
            };
        case 'under_review':
        case 'under review':
            return {
                label: 'Waiting for President Approval',
                color: 'bg-amber-50 text-amber-600 border-amber-100',
                desc: 'Under review by President for final sign-off'
            };
        case 'approved':
            return {
                label: 'Approved',
                color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                desc: 'Authorized and approved for disbursement'
            };
        case 'declined':
            return {
                label: 'Declined',
                color: 'bg-rose-50 text-rose-600 border-rose-100',
                desc: 'Declined by fellowship leadership'
            };
        case 'returned':
            return {
                label: 'Returned for Correction',
                color: 'bg-orange-50 text-orange-600 border-orange-100',
                desc: 'Sent back to Unit Head for corrections'
            };
        default:
            return {
                label: status,
                color: 'bg-slate-50 text-slate-500 border-slate-100',
                desc: 'Unknown state'
            };
    }
};

const Approvals = () => {
    const { user, role, roles } = useAuth();
    const [approvals, setApprovals] = useState([]);
    const [historyTimeline, setHistoryTimeline] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
    const [loading, setLoading] = useState(true);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [apiError, setApiError] = useState('');
    
    // Comment feedback box
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const fetchApprovalsData = useCallback(async () => {
        setLoading(true);
        setApiError('');
        try {
            // Fetch raw approvals list and departments for reference
            const [appvsData, deptsData] = await Promise.all([
                ApprovalsService.getAll().catch(async () => {
                    // Fallback to fetch budget requests if /approvals endpoint has CORS/permission limits
                    return await BudgetRequestsService.getAll();
                }),
                DepartmentService.getAll().catch(() => [])
            ]);

            setApprovals(normalizeApprovals(appvsData));
            setDepartments(normalizeDepartments(deptsData));
        } catch (err) {
            console.error('Error fetching approvals data', err);
            setApiError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchApprovalsData();
    }, [fetchApprovalsData]);

    // Fetch details timeline when item is clicked
    const fetchHistoryTimeline = async (entityType, entityId) => {
        setLoadingTimeline(true);
        setHistoryTimeline([]);
        try {
            const res = await ApprovalsService.getHistory(entityType, entityId);
            setHistoryTimeline(normalizeArrayResponse(res, ['history', 'timeline', 'items']));
        } catch (err) {
            console.warn('Could not load formal history timeline. Using client fallback tracker.', err);
            setHistoryTimeline([]); // Fallback handled in render
        } finally {
            setLoadingTimeline(false);
        }
    };

    const handleSelectApproval = (item) => {
        setSelectedItem(item);
        setComment('');
        setSuccessMessage('');
        const eType = item.entity_type || 'budget_request';
        const eId = item.entity_id || item.value || item.id;
        fetchHistoryTimeline(eType, eId);
    };

    // ACTION: Review (Secretary Action)
    const handleReview = async (id) => {
        if (!comment.trim()) {
            alert('Please leave review notes or feedback comments.');
            return;
        }
        setSubmitting(true);
        setApiError('');
        try {
            await BudgetRequestsService.review(id, { notes: comment.trim() });
            setSuccessMessage('Approved & marked Under Review successfully!');
            setTimeout(() => {
                setSelectedItem(null);
                fetchApprovalsData();
            }, 1200);
        } catch (err) {
            setApiError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    };

    // ACTION: Approve (President Action)
    const handleApprove = async (id) => {
        if (!comment.trim()) {
            alert('Please add authorization notes or remarks.');
            return;
        }
        setSubmitting(true);
        setApiError('');
        try {
            await BudgetRequestsService.approve(id, { notes: comment.trim() });
            setSuccessMessage('Request approved & funds authorized!');
            setTimeout(() => {
                setSelectedItem(null);
                fetchApprovalsData();
            }, 1200);
        } catch (err) {
            setApiError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    };

    // ACTION: Decline/Reject
    const handleDecline = async (id) => {
        if (!comment.trim()) {
            alert('Please state a reason for declining the request.');
            return;
        }
        setSubmitting(true);
        setApiError('');
        try {
            await BudgetRequestsService.decline(id, { notes: comment.trim() });
            setSuccessMessage('Budget request declined.');
            setTimeout(() => {
                setSelectedItem(null);
                fetchApprovalsData();
            }, 1200);
        } catch (err) {
            setApiError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    };

    // ACTION: Return for Correction
    const handleReturn = async (item) => {
        if (!comment.trim()) {
            alert('Please provide specific correction instructions.');
            return;
        }
        setSubmitting(true);
        setApiError('');
        const eType = item.entity_type || 'budget_request';
        const eId = item.entity_id || item.value || item.id;
        try {
            await ApprovalsService.returnItem(eType, eId, { notes: comment.trim() });
            setSuccessMessage('Request returned for correction.');
            setTimeout(() => {
                setSelectedItem(null);
                fetchApprovalsData();
            }, 1200);
        } catch (err) {
            setApiError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    };

    // Filter items based on selected Tab
    const filteredApprovals = approvals.filter(appv => {
        const s = appv.status?.toLowerCase();
        if (activeTab === 'pending') {
            return s === 'submitted' || s === 'under_review' || s === 'under review';
        } else {
            return s === 'approved' || s === 'declined' || s === 'returned' || s === 'completed';
        }
    });

    // Check privileges. Keep existing admin/pastor oversight while enabling the real workflow roles.
    const activeRoles = new Set([user?.role, role, ...(Array.isArray(user?.roles) ? user.roles : []), ...(Array.isArray(roles) ? roles : [])].filter(Boolean));
    const isSecretary = ['secretary', 'pastor', 'super_admin', 'fellowship_admin'].some((allowedRole) => activeRoles.has(allowedRole));
    const isPresident = ['president', 'pastor', 'super_admin'].some((allowedRole) => activeRoles.has(allowedRole));

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Page Title Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Approvals Center</h1>
                        <p className="text-sm text-slate-500 mt-3 font-medium max-w-md leading-relaxed">
                            Verify and audit administrative expenditures. Ensure double-entry governance across fellowship units.
                        </p>
                    </div>
                </div>

                {/* API Error Box */}
                {apiError && !loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-4 bg-red-50 border border-red-100 text-red-600 p-6 rounded-3xl"
                    >
                        <AlertCircle size={22} className="shrink-0" />
                        <div>
                            <p className="font-bold text-sm">Approvals system exception</p>
                            <p className="text-xs mt-1 opacity-80">{apiError}</p>
                        </div>
                        <button onClick={fetchApprovalsData} className="ml-auto text-xs font-black uppercase tracking-widest underline shrink-0">
                            Retry
                        </button>
                    </motion.div>
                )}

                {/* Tabs & Overview Statistics */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
                    {/* Tab Navigation buttons */}
                    <div className="flex items-center bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200 shadow-sm overflow-x-auto self-start">
                        <button
                            onClick={() => { setActiveTab('pending'); setSelectedItem(null); }}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeTab === 'pending'
                                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10'
                                    : 'text-slate-400 hover:text-slate-900'
                            }`}
                        >
                            Pending Actions
                        </button>
                        <button
                            onClick={() => { setActiveTab('history'); setSelectedItem(null); }}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeTab === 'history'
                                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10'
                                    : 'text-slate-400 hover:text-slate-900'
                            }`}
                        >
                            History Logs
                        </button>
                    </div>

                    {/* Simple summary counts */}
                    <div className="flex gap-4">
                        <div className="bg-white border border-slate-150 px-5 py-3 rounded-2xl flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Required Attention</span>
                            <span className="font-mono text-lg font-black text-slate-800 mt-0.5">
                                {approvals.filter(a => ['submitted', 'under_review', 'under review'].includes(a.status?.toLowerCase())).length}
                            </span>
                        </div>
                        <div className="bg-white border border-slate-150 px-5 py-3 rounded-2xl flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Authorized</span>
                            <span className="font-mono text-lg font-black text-emerald-600 mt-0.5">
                                {approvals.filter(a => a.status?.toLowerCase() === 'approved').length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Master Grid Container */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Panel: Approvals List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-6 sm:p-8">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-primary shadow-lg shadow-blue-900/5">
                                    <ShieldCheck size={28} />
                                </div>
                                <div>
                                    <h3 className="font-black text-2xl text-slate-900 tracking-tighter uppercase leading-none">
                                        {activeTab === 'pending' ? 'Pending Authorizations' : 'Archived Audit Trail'}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Governance Board</p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="py-24 flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    <p className="text-sm font-bold text-slate-400">Syncing audit boards…</p>
                                </div>
                            ) : filteredApprovals.length === 0 ? (
                                <div className="py-24 flex flex-col items-center text-center max-w-sm mx-auto space-y-6">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                                        <ShieldCheck size={32} className="text-slate-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-slate-500 font-black">No approvals found</p>
                                        <p className="text-xs text-slate-400 font-medium leading-normal">
                                            {activeTab === 'pending' 
                                                ? 'All outstanding fellowship budget requests are fully authorized. Good work!' 
                                                : 'No historical approvals found in your organization ledger.'
                                            }
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3.5">
                                    {filteredApprovals.map((item) => {
                                        const stage = getStageDetails(item.status);
                                        return (
                                            <div
                                                key={item.value || item.id}
                                                onClick={() => handleSelectApproval(item)}
                                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:shadow-md transition-all gap-4 ${
                                                    selectedItem?.value === item.value ? 'ring-2 ring-primary/20 bg-slate-50 border-slate-300' : ''
                                                }`}
                                            >
                                                <div className="space-y-2.5">
                                                    <div className="flex items-center gap-2.5 flex-wrap">
                                                        <span className="font-black text-sm text-slate-900 tracking-tight">
                                                            {item.title}
                                                        </span>
                                                        <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-md ${stage.color}`}>
                                                            {stage.label}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold flex-wrap">
                                                        <span>Unit: {departments.find(d => sameApiId(d.value, item.department_id))?.name || `Unit #${item.department_id}`}</span>
                                                        <span>•</span>
                                                        <span>Requester: <strong className="text-slate-600">{item.requester?.name || 'Unit Head'}</strong></span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between sm:justify-end gap-6">
                                                    <span className="font-mono text-sm font-black text-slate-800">
                                                        ₦{fmt(item.amount)}
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

                    {/* Right Panel: Detail Panel & Audit Trails */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 sm:p-8 space-y-6 sticky top-8">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Inspection Panel</h3>

                            {selectedItem ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    {/* Action Header */}
                                    <div className="space-y-3">
                                        <h4 className="font-black text-xl text-slate-900 tracking-tight leading-snug">
                                            {selectedItem.title}
                                        </h4>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border rounded-md ${getStageDetails(selectedItem.status).color}`}>
                                                {getStageDetails(selectedItem.status).label}
                                            </span>
                                            <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 rounded-md">
                                                Entity #{selectedItem.value || selectedItem.id}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Financial cards */}
                                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Requested Sum</p>
                                            <p className="font-mono text-lg font-black text-slate-900 mt-1">₦{fmt(selectedItem.amount)}</p>
                                        </div>
                                        <DollarSign className="w-8 h-8 text-primary opacity-20" />
                                    </div>

                                    {/* History Timeline block */}
                                    <div className="space-y-4">
                                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Workflow Timeline</span>
                                        {loadingTimeline ? (
                                            <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                <span>Fetching ledger audits…</span>
                                            </div>
                                        ) : historyTimeline.length > 0 ? (
                                            <div className="space-y-3 border-l-2 border-slate-100 pl-4 ml-1">
                                                {historyTimeline.map((h, i) => (
                                                    <div key={i} className="relative py-1">
                                                        <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-primary" />
                                                        <p className="text-[11px] font-black text-slate-800 capitalize leading-none">
                                                            {h.action || h.status || 'State Transitioned'}
                                                        </p>
                                                        {h.notes && (
                                                            <p className="text-[10px] text-slate-400 font-medium mt-1 bg-slate-50 p-2 rounded border border-slate-100 italic">
                                                                "{h.notes}"
                                                            </p>
                                                        )}
                                                        <span className="block text-[8px] text-slate-300 font-bold mt-1">
                                                            by {h.actor?.name || h.user_name || 'System Auditor'} • {new Date(h.created_at || h.timestamp).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            // Fallback visualization mapping simple flow: Draft -> Submitted -> Secretary Review -> President Approval
                                            <div className="space-y-4 border-l-2 border-slate-100 pl-4 ml-1">
                                                {/* Unit Head */}
                                                <div className="relative">
                                                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                                    <p className="text-[11px] font-black text-slate-800 leading-none">Draft & Submit</p>
                                                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">Completed by {selectedItem.requester?.name || 'Unit Head'}</p>
                                                </div>

                                                {/* Secretary Review */}
                                                <div className="relative">
                                                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${
                                                        ['under_review', 'under review', 'approved'].includes(selectedItem.status?.toLowerCase()) 
                                                            ? 'bg-emerald-500' : 'bg-slate-300'
                                                    }`} />
                                                    <p className="text-[11px] font-black text-slate-800 leading-none">Secretary Review</p>
                                                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                                                        {['under_review', 'under review', 'approved'].includes(selectedItem.status?.toLowerCase()) 
                                                            ? 'Verified & Approved for signoff' : 'Pending verification review'
                                                        }
                                                    </p>
                                                </div>

                                                {/* President Action */}
                                                <div className="relative">
                                                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${
                                                        selectedItem.status?.toLowerCase() === 'approved' ? 'bg-emerald-500' : 'bg-slate-300'
                                                    }`} />
                                                    <p className="text-[11px] font-black text-slate-800 leading-none">President Approval</p>
                                                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                                                        {selectedItem.status?.toLowerCase() === 'approved' 
                                                            ? 'Funds Authorized & Complete' : 'Pending final authorization'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Item breakdown display */}
                                    <div className="space-y-3 pt-4 border-t border-slate-50">
                                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Expenditure Items</span>
                                        {Array.isArray(selectedItem.items) && selectedItem.items.length > 0 ? (
                                            <div className="space-y-2 border border-slate-100 p-4 rounded-2xl bg-slate-50">
                                                {selectedItem.items.map((it, i) => (
                                                    <div key={i} className="flex justify-between text-xs font-bold text-slate-700 py-1 border-b border-slate-100 last:border-b-0">
                                                        <span>{it.item_name || it.name} (x{it.quantity})</span>
                                                        <span className="font-mono text-slate-900">₦{fmt(it.quantity * (it.unit_cost || it.cost || 0))}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 border border-dashed border-slate-200 text-center rounded-2xl text-[10px] text-slate-400 font-bold">
                                                No breakdown line items attached.
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-xs font-medium text-slate-400 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <strong className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Purpose details:</strong>
                                        {selectedItem.description || selectedItem.purpose || 'Fellowship operational requirements.'}
                                    </div>

                                    {/* Action Form for Pending list only */}
                                    {activeTab === 'pending' && (
                                        <div className="border-t border-slate-50 pt-6 space-y-4">
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <MessageSquare size={12} />
                                                    <span>Add Audit Notes / Remarks <span className="text-rose-500">*</span></span>
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    required
                                                    value={comment}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    placeholder="State your authorization reason or return queries..."
                                                    className="w-full bg-slate-50 border border-slate-150 focus:border-primary focus:bg-white rounded-xl p-3 outline-none font-bold text-xs text-slate-800 transition-all resize-none"
                                                />
                                            </div>

                                            {successMessage ? (
                                                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-xl text-xs font-bold">
                                                    <CheckCircle2 size={16} className="shrink-0" />
                                                    <span>{successMessage}</span>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {/* secretary flow triggers */}
                                                    {selectedItem.status?.toLowerCase() === 'submitted' && (
                                                        <>
                                                            {isSecretary ? (
                                                                <button
                                                                    onClick={() => handleReview(selectedItem.value)}
                                                                    disabled={submitting}
                                                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md shadow-slate-900/10"
                                                                >
                                                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck size={14} className="text-secondary" />}
                                                                    <span>Verify & Mark Review</span>
                                                                </button>
                                                            ) : (
                                                                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1.5">
                                                                    <ShieldCheck size={14} />
                                                                    <span>Waiting for Secretary Review</span>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* president flow triggers */}
                                                    {['under_review', 'under review'].includes(selectedItem.status?.toLowerCase()) && (
                                                        <>
                                                            {isPresident ? (
                                                                <button
                                                                    onClick={() => handleApprove(selectedItem.value)}
                                                                    disabled={submitting}
                                                                    className="w-full btn-secondary py-3.5 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                                                >
                                                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 size={14} />}
                                                                    <span>Authorize & Approve</span>
                                                                </button>
                                                            ) : (
                                                                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1.5">
                                                                    <ShieldCheck size={14} />
                                                                    <span>Waiting for President Approval</span>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* decline and return actions for anyone in authority */}
                                                    {((selectedItem.status?.toLowerCase() === 'submitted' && isSecretary) ||
                                                      (['under_review', 'under review'].includes(selectedItem.status?.toLowerCase()) && isPresident)) && (
                                                        <div className="grid grid-cols-2 gap-2 pt-2">
                                                            <button
                                                                onClick={() => handleDecline(selectedItem.value)}
                                                                disabled={submitting}
                                                                className="bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
                                                            >
                                                                <X size={12} />
                                                                <span>Decline</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleReturn(selectedItem)}
                                                                disabled={submitting}
                                                                className="bg-orange-50 hover:bg-orange-100 border border-orange-100 text-orange-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
                                                            >
                                                                <RotateCcw size={12} />
                                                                <span>Return Query</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-24 text-center text-slate-400 border border-dashed border-slate-150 rounded-3xl h-64 flex flex-col items-center justify-center">
                                    <Info size={24} className="mb-3 text-slate-300 animate-pulse" />
                                    <p className="text-xs font-bold px-6 leading-relaxed">
                                        Select any budget transaction card to trigger double-entry audit timelines and action triggers.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Approvals;
