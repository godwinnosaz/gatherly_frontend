import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PieChart, Plus, X, FileText, History, Wallet, ArrowUpRight, ArrowDownRight,
    ShieldAlert, AlertCircle, Loader2, CheckCircle2, FolderTree, ChevronRight,
    Trash2, Edit3, PlusCircle, Info, Settings, Download
} from 'lucide-react';
import PermissionGate from '../components/PermissionGate';
import { FinanceService, FinanceAccountsService, DepartmentService } from '../api/services';
import FinanceImport from '../components/finance/FinanceImport';
import SectionCard from '../components/ui/SectionCard';
import { normalizeArrayResponse } from '../utils/apiResponse';

// ─── Helpers ─────────────────────────────────────────────────────────────

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const titleCase = (value = '') => String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const accountTypeLabel = (type) => {
    const label = titleCase(type || 'account');
    return label.toLowerCase().includes('account') ? label : `${label} Account`;
};

const normalizeFinanceAccounts = (payload) => {
    const data = payload?.data || payload || {};
    const raw = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(data?.data)
                ? data.data
                : Array.isArray(payload?.accounts)
                    ? payload.accounts
                    : Array.isArray(payload?.data?.accounts)
                        ? payload.data.accounts
                        : Array.isArray(data?.data?.accounts)
                            ? data.data.accounts
                            : [];

    return raw.map((account) => {
        const publicId = account.account_id || account.value || account.id;
        const parentId = account.parent_account_id || account.parent_id || null;
        const currentBalance = toNumber(account.current_balance ?? account.balance ?? account.opening_balance);
        const openingBalance = toNumber(account.opening_balance);

        return {
            ...account,
            id: account.id,
            account_id: account.account_id,
            value: publicId,
            account_name: account.account_name || account.name || 'Unnamed Account',
            name: account.name || account.account_name || 'Unnamed Account',
            parent_account_id: account.parent_account_id || parentId,
            parent_id: account.parent_id || parentId,
            department_id: account.department_id || '',
            account_type: account.account_type || 'unit',
            opening_balance: openingBalance,
            current_balance: currentBalance,
            balance: currentBalance,
            status: account.status || 'active'
        };
    });
};

const normalizeFinanceCategories = (payload) => {
    const data = payload?.data || payload || {};
    const grouped = data?.data || data;
    const raw = Array.isArray(payload)
        ? payload
        : Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
                ? data.data
                : Array.isArray(payload?.categories)
                    ? payload.categories
                    : Array.isArray(data.categories)
                        ? data.categories
                        : [
                            ...(Array.isArray(grouped.income) ? grouped.income.map((category) => ({ ...category, type: category.type || 'income' })) : []),
                            ...(Array.isArray(grouped.expense) ? grouped.expense.map((category) => ({ ...category, type: category.type || 'expense' })) : [])
                        ];

    return raw.map((category) => {
        const publicId = category.category_id || category.value || category.id;
        return {
            ...category,
            id: category.id,
            category_id: category.category_id,
            value: publicId,
            name: category.name || category.category_name || 'Unnamed Category',
            type: category.type || category.category_type || category.transaction_type || ''
        };
    });
};

const normalizeTransactions = (payload) => {
    const data = payload?.data || payload || {};
    const raw = Array.isArray(payload)
        ? payload
        : Array.isArray(data)
            ? data
            : normalizeArrayResponse(data, ['transactions', 'recent_transactions', 'items']);

    return raw.map((transaction) => ({
        ...transaction,
        id: transaction.id || transaction.transaction_id || transaction.reference_number,
        amount: toNumber(transaction.amount),
        type: transaction.type || transaction.transaction_type || 'income',
        description: transaction.description || transaction.title || '',
        date: transaction.date || transaction.transaction_date || transaction.created_at,
        category_id: transaction.category_id || transaction.finance_category_id || transaction.category?.category_id || transaction.category?.id,
        category_name: transaction.category_name || transaction.category?.name || transaction.category?.category_name,
        account_id: transaction.account_id || transaction.account?.account_id || transaction.account?.id,
        account_name: transaction.account_name || transaction.account?.account_name || transaction.account?.name,
        reference_number: transaction.reference_number || transaction.reference_no || ''
    }));
};

const normalizeFinanceSummary = (payload) => {
    const summary = payload?.data?.data?.summary || payload?.data?.summary || payload?.summary || payload?.data?.data || payload?.data || payload || {};
    const totalIncome = toNumber(summary.total_income ?? summary.total_inflow);
    const totalExpense = toNumber(summary.total_expense ?? summary.total_outflow);
    const balance = summary.balance !== undefined
        ? toNumber(summary.balance)
        : totalIncome - totalExpense;

    return { total_income: totalIncome, total_expense: totalExpense, balance };
};

const sameId = (left, right) => String(left ?? '') === String(right ?? '');

const normalizeFinanceAccountTree = (nodes) => normalizeFinanceAccounts(nodes).map((node) => ({
    ...node,
    children: normalizeFinanceAccountTree(node.children || [])
}));

const createLookupMap = (items, idKeys, labelKeys) => {
    const map = {};
    items.forEach((item) => {
        const label = labelKeys.map((key) => item?.[key]).find(Boolean);
        if (!label) return;
        idKeys.forEach((key) => {
            const value = item?.[key];
            if (value !== undefined && value !== null && value !== '') {
                map[String(value)] = label;
            }
        });
    });
    return map;
};

const lookupValue = (map, ...ids) => {
    for (const id of ids) {
        if (id !== undefined && id !== null && id !== '') {
            const value = map[String(id)];
            if (value) return value;
        }
    }
    return '';
};

const fmt = (n) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n || 0);

const friendlyError = (err) => {
    if (!err) return 'Something went wrong.';
    if (err.type === 'validation') {
        if (err.errors && typeof err.errors === 'object') {
            const messages = Object.entries(err.errors).map(([field, msg]) => {
                const fieldName = field.replace('_', ' ');
                return `${fieldName}: ${Array.isArray(msg) ? msg.join(', ') : msg}`;
            });
            if (messages.length > 0) return `${err.message || 'Validation error'}: ${messages.join(' | ')}`;
        }
        return err.message || 'Please check the fields.';
    }
    if (err.type === 'cors_or_network') return 'Cannot reach server. Check your connection.';
    if (err.type === 'server_error') return 'A server error occurred. Please try again.';
    return err.message || 'Something went wrong.';
};

// ─── Presentational Components ───────────────────────────────────────────

const FinanceCard = ({ label, amount, icon: Icon, color = 'primary' }) => (
    <motion.div whileHover={{ y: -3 }} className="section-card section-card-hover p-5 sm:p-6 h-full">
        <div className="flex items-center justify-between gap-4">
            <div>
                <div className="text-slate-400 text-[10px] mb-2 uppercase tracking-[0.22em] font-black">{label}</div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{fmt(amount)}</div>
            </div>
            <div className={`p-3 rounded-2xl border shadow-sm shrink-0 ${
                color === 'green' ? 'bg-emerald-50 text-secondary border-emerald-100' :
                color === 'red' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                color === 'gold' ? 'bg-amber-50 text-accent border-amber-100' :
                'bg-blue-50 text-primary border-blue-100'
            }`}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
    </motion.div>
);

const TransactionCard = ({ tx, categoryLookup = {}, accountLookup = {} }) => {
    const isIncome = tx.type === 'income';
    const categoryName = tx.category_name || tx.category?.name || lookupValue(categoryLookup, tx.category_id, tx.finance_category_id) || 'Uncategorized';
    const accountName = tx.account_name || tx.account?.account_name || lookupValue(accountLookup, tx.account_id) || 'General Account';
    const title = tx.description || categoryName;
    const date = tx.date ? new Date(tx.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Undated';

    return (
        <div className="section-card section-card-hover p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-start gap-4 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${isIncome ? 'bg-emerald-50 text-secondary border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'} shadow-sm`}>
                        {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-base font-black text-slate-900 tracking-tight leading-snug truncate">{title}</h4>
                        <p className="text-xs text-slate-500 font-bold mt-1 leading-relaxed">
                            {date} <span className="text-slate-300">-</span> {categoryName} <span className="text-slate-300">-</span> {accountName}
                        </p>
                    </div>
                </div>
                <div className="sm:text-right shrink-0">
                    <div className={`font-black text-xl tracking-tight ${isIncome ? 'text-secondary' : 'text-rose-500'}`}>
                        {isIncome ? '+' : '-'}{fmt(tx.amount)}
                    </div>
                    <span className={`inline-flex mt-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        isIncome ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                        {isIncome ? 'Money In' : 'Money Out'}
                    </span>
                </div>
            </div>
        </div>
    );
};

// ─── Extracted Account Modals & TreeNode ─────────────────────────────────

const TreeNode = ({ node, depth = 0, selectedAccount, onSelect }) => {
    const parentKey = node.parent_account_id || node.parent_id;
    const displayBalance = toNumber(node.current_balance ?? node.balance ?? node.opening_balance);
    const isMain = !parentKey || node.account_type === 'main';
    const isPositive = displayBalance >= 0;

    return (
        <div className="space-y-2">
            <div
                onClick={() => onSelect(node)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                    selectedAccount?.value === node.value
                        ? 'bg-slate-100 border-slate-300 ring-2 ring-primary/20'
                        : isMain
                            ? 'bg-amber-50/50 border-amber-100 hover:bg-amber-50'
                            : 'bg-white border-slate-100 hover:bg-slate-50'
                }`}
                style={{ marginLeft: `${depth * 24}px` }}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isMain ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                        <FolderTree size={16} />
                    </div>
                    <div>
                        <span className={`font-black text-sm tracking-tight ${isMain ? 'text-amber-800' : 'text-slate-800'}`}>
                            {node.account_name || node.name}
                        </span>
                        <span className="ml-2 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 rounded-md text-slate-500 capitalize">
                            {node.account_type}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className={`font-mono text-xs font-bold ${
                        isMain ? 'text-amber-600' : isPositive ? 'text-emerald-600' : 'text-rose-500'
                    }`}>
                        {fmt(displayBalance)}
                    </span>
                    <ChevronRight size={14} className="text-slate-400" />
                </div>
            </div>

            {node.children && node.children.length > 0 && (
                <div className="space-y-2 relative">
                    <div className="absolute left-4 top-0 bottom-4 w-0.5 bg-slate-100" style={{ marginLeft: `${depth * 24}px` }} />
                    {node.children.map((child) => (
                        <TreeNode key={child.value} node={child} depth={depth + 1} selectedAccount={selectedAccount} onSelect={onSelect} />
                    ))}
                </div>
            )}
        </div>
    );
};

const CreateAccountModal = ({ isOpen, onClose, onSuccess, accounts, departments }) => {
    const [form, setForm] = useState({ account_name: '', account_type: 'unit', parent_id: '', department_id: '', opening_balance: 0 });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await FinanceAccountsService.create({
                account_name: form.account_name.trim(),
                account_type: form.account_type,
                parent_account_id: form.parent_id || null,
                department_id: form.department_id || null,
                opening_balance: Number(form.opening_balance) || 0
            });
            setActionSuccess('Account created successfully!');
            setTimeout(() => {
                setActionSuccess('');
                setForm({ account_name: '', account_type: 'unit', parent_id: '', department_id: '', opening_balance: 0 });
                onSuccess();
            }, 1000);
        } catch (err) {
            setError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-8 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20"><FolderTree size={20} /></div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Create Ledger Account</h2>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Create a ledger account</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    {actionSuccess ? (
                        <div className="flex flex-col items-center gap-4 py-6 text-center animate-in fade-in">
                            <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-secondary border border-emerald-100"><CheckCircle2 size={32} /></div>
                            <h3 className="text-xl font-black text-slate-900">{actionSuccess}</h3>
                            <p className="text-sm text-slate-500 font-medium">Updating account list...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" /><span>{error}</span>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Name <span className="text-rose-400">*</span></label>
                                <input type="text" required value={form.account_name} onChange={(e) => setForm(p => ({ ...p, account_name: e.target.value }))} className="input-field h-12 text-sm font-bold" placeholder="e.g. Choir Sub-Ledger" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Type <span className="text-rose-400">*</span></label>
                                <select required value={form.account_type} onChange={(e) => setForm(p => ({ ...p, account_type: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white rounded-2xl px-5 py-3.5 outline-none font-bold text-sm text-slate-800 transition-all cursor-pointer">
                                    <option value="unit">Fellowship Unit Account</option>
                                    <option value="main">Main Account</option>
                                    <option value="asset">Asset Account</option>
                                    <option value="liability">Liability Account</option>
                                    <option value="equity">Equity Account</option>
                                    <option value="income">Income Account</option>
                                    <option value="expense">Expense Account</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Parent Account</label>
                                <select value={form.parent_id} onChange={(e) => setForm(p => ({ ...p, parent_id: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white rounded-2xl px-5 py-3.5 outline-none font-bold text-sm text-slate-800 transition-all cursor-pointer">
                                    <option value="">None (Top-Level Account)</option>
                                    {accounts.map(acct => <option key={acct.value} value={acct.value}>{acct.account_name || acct.name} ({acct.account_type})</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Ministry Fellowship Unit (Department)</label>
                                <select value={form.department_id} onChange={(e) => setForm(p => ({ ...p, department_id: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white rounded-2xl px-5 py-3.5 outline-none font-bold text-sm text-slate-800 transition-all cursor-pointer">
                                    <option value="">None (General Ledger)</option>
                                    {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Opening Balance (NGN)</label>
                                <input type="number" min="0" value={form.opening_balance} onChange={(e) => setForm(p => ({ ...p, opening_balance: e.target.value }))} className="input-field h-12 text-sm font-bold" placeholder="0" />
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-slate-50 shrink-0">
                                <button type="button" onClick={onClose} className="flex-1 py-3.5 text-slate-500 font-black border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors text-sm">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex-1 btn-primary py-3.5 text-sm font-black flex items-center justify-center gap-2">
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Confirm Create</span>}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const EditAccountModal = ({ isOpen, onClose, onSuccess, accounts, departments, account }) => {
    const [form, setForm] = useState({ account_name: '', account_type: 'unit', parent_id: '', department_id: '', status: 'active' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');

    useEffect(() => {
        if (isOpen && account) {
            setForm({
                account_name: account.account_name || account.name || '',
                account_type: account.account_type || 'unit',
                parent_id: account.parent_account_id || account.parent_id || '',
                department_id: account.department_id || '',
                status: account.status || 'active'
            });
        }
    }, [isOpen, account]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await FinanceAccountsService.update(account.id, {
                account_name: form.account_name.trim(),
                account_type: form.account_type,
                parent_account_id: form.parent_id || null,
                department_id: form.department_id || null,
                status: form.status
            });
            setActionSuccess('Account updated successfully!');
            setTimeout(() => {
                setActionSuccess('');
                onSuccess();
            }, 1000);
        } catch (err) {
            setError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-8 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20"><Edit3 size={20} /></div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Edit Ledger Account</h2>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Update ledger account</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    {actionSuccess ? (
                        <div className="flex flex-col items-center gap-4 py-6 text-center animate-in fade-in">
                            <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-secondary border border-emerald-100"><CheckCircle2 size={32} /></div>
                            <h3 className="text-xl font-black text-slate-900">{actionSuccess}</h3>
                            <p className="text-sm text-slate-500 font-medium">Updating account details...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" /><span>{error}</span>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Name <span className="text-rose-400">*</span></label>
                                <input type="text" required value={form.account_name} onChange={(e) => setForm(p => ({ ...p, account_name: e.target.value }))} className="input-field h-12 text-sm font-bold" placeholder="e.g. Choir Sub-Ledger" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Type <span className="text-rose-400">*</span></label>
                                <select required value={form.account_type} onChange={(e) => setForm(p => ({ ...p, account_type: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white rounded-2xl px-5 py-3.5 outline-none font-bold text-sm text-slate-800 transition-all cursor-pointer">
                                    <option value="unit">Fellowship Unit Account</option>
                                    <option value="main">Main Account</option>
                                    <option value="asset">Asset Account</option>
                                    <option value="liability">Liability Account</option>
                                    <option value="equity">Equity Account</option>
                                    <option value="income">Income Account</option>
                                    <option value="expense">Expense Account</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Parent Account</label>
                                <select value={form.parent_id} onChange={(e) => setForm(p => ({ ...p, parent_id: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white rounded-2xl px-5 py-3.5 outline-none font-bold text-sm text-slate-800 transition-all cursor-pointer">
                                    <option value="">None (Top-Level Account)</option>
                                    {accounts.filter(a => !sameId(a.value, account?.value)).map(acct => <option key={acct.value} value={acct.value}>{acct.account_name || acct.name} ({acct.account_type})</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Ministry Fellowship Unit (Department)</label>
                                <select value={form.department_id} onChange={(e) => setForm(p => ({ ...p, department_id: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white rounded-2xl px-5 py-3.5 outline-none font-bold text-sm text-slate-800 transition-all cursor-pointer">
                                    <option value="">None (General Ledger)</option>
                                    {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                                <select value={form.status} onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white rounded-2xl px-5 py-3.5 outline-none font-bold text-sm text-slate-800 transition-all cursor-pointer">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-slate-50 shrink-0">
                                <button type="button" onClick={onClose} className="flex-1 py-3.5 text-slate-500 font-black border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors text-sm">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex-1 btn-primary py-3.5 text-sm font-black flex items-center justify-center gap-2">
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Save Configurations</span>}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// ─── Add Transaction Modal ───────────────────────────────────────────────

const AddTransactionModal = ({ isOpen, onClose, onSuccess, defaultType = 'income' }) => {
    const [form, setForm] = useState({
        amount: '', type: defaultType, account_id: '', category_id: '',
        description: '', date: new Date().toISOString().split('T')[0],
        reference_number: '', strict_mode: false
    });

    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [loadError, setLoadError] = useState('');
    const [success, setSuccess] = useState(false);

    const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
    const categoryTypeOf = (category) => String(category?.type || category?.category_type || category?.transaction_type || '').toLowerCase();
    const categoriesForType = (type) => categories.filter((category) => categoryTypeOf(category) === type);
    const filteredCategories = categoriesForType(form.type);

    const loadModalData = useCallback(async () => {
        setLoadError('');
        try {
            const [acctsData, catsData] = await Promise.all([
                FinanceAccountsService.getAll(),
                FinanceService.getCategories()
            ]);

            const acctsList = normalizeFinanceAccounts(acctsData);
            const catsList = normalizeFinanceCategories(catsData);
            const matchingCats = catsList.filter((category) => category.type === defaultType);

            if (!acctsList.length) setLoadError('No accounts available. Create a ledger account before recording transactions.');
            if (!catsList.length) setLoadError('No categories available. Ask an admin to create finance categories.');

            setAccounts(acctsList);
            setCategories(catsList);

            setForm((prev) => ({
                ...prev,
                account_id: prev.account_id || acctsList[0]?.value || '',
                category_id: prev.category_id || matchingCats[0]?.value || ''
            }));
        } catch (err) {
            console.error('[AddTransactionModal] Failed to load form dropdowns:', err);
            setLoadError('Failed to load accounts/categories. Please retry when the server is reachable.');
        }
    }, [defaultType]);

    useEffect(() => {
        if (isOpen) loadModalData();
    }, [isOpen, loadModalData]);

    const reset = () => {
        setForm({
            amount: '', type: defaultType, account_id: accounts[0]?.value || '',
            category_id: categoriesForType(defaultType)[0]?.value || '',
            description: '', date: new Date().toISOString().split('T')[0],
            reference_number: '', strict_mode: false
        });
        setError('');
        setSuccess(false);
    };

    const handleClose = () => { reset(); onClose(); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.amount || isNaN(Number(form.amount))) return setError('Please enter a valid numeric amount.');
        if (!form.account_id) return setError('Please select an active Account.');
        if (!form.category_id) return setError('Please select a Category.');

        setSubmitting(true);
        try {
            const payload = {
                amount: Number(form.amount),
                type: form.type,
                account_id: form.account_id,
                category_id: form.category_id,
                description: form.description.trim(),
                date: form.date,
                strict_mode: form.type === 'expense' ? Boolean(form.strict_mode) : false,
                reference_number: form.reference_number.trim() || null
            };

            await FinanceService.recordTransaction(payload);
            setSuccess(true);
            setTimeout(() => { onSuccess(); handleClose(); }, 1200);
        } catch (err) {
            setError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                <div className="flex items-center justify-between p-8 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${form.type === 'income' ? 'bg-emerald-50 text-secondary border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
                            {form.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Record Transaction</h2>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Add income or expense</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    {success ? (
                        <div className="flex flex-col items-center gap-4 py-6 text-center animate-in fade-in">
                            <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-secondary border border-emerald-100"><CheckCircle2 size={32} /></div>
                            <h3 className="text-xl font-black text-slate-900">Transaction Recorded!</h3>
                            <p className="text-sm text-slate-500 font-medium">Refreshing ledger entries...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" /><span>{error}</span>
                                </motion.div>
                            )}
                            {loadError && (
                                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 text-amber-800 p-4 rounded-2xl text-xs font-bold">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" /><span>{loadError}</span>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</label>
                                <div className="flex bg-slate-100 p-1 rounded-2xl">
                                    {['income', 'expense'].map((t) => (
                                        <button key={t} type="button" onClick={() => setForm((p) => ({ ...p, type: t, category_id: categoriesForType(t)[0]?.value || '' }))} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${form.type === t ? (t === 'income' ? 'bg-secondary text-white shadow-md' : 'bg-rose-500 text-white shadow-md') : 'text-slate-500'}`}>
                                            {t === 'income' ? 'Money In' : 'Money Out'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (NGN) <span className="text-rose-400">*</span></label>
                                <input type="number" required min="1" value={form.amount} onChange={set('amount')} className="input-field h-12 text-sm font-bold" placeholder="e.g. 5000" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Account <span className="text-rose-400">*</span></label>
                                    <select required value={form.account_id} onChange={set('account_id')} className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white rounded-2xl px-5 py-3.5 outline-none font-bold text-sm text-slate-800 transition-all cursor-pointer">
                                        <option value="">Choose Account</option>
                                        {accounts.map((acct) => <option key={acct.value} value={acct.value}>{acct.account_name || acct.name} - {accountTypeLabel(acct.account_type)}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Category <span className="text-rose-400">*</span></label>
                                    <select required value={form.category_id} onChange={set('category_id')} className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white rounded-2xl px-5 py-3.5 outline-none font-bold text-sm text-slate-800 transition-all cursor-pointer">
                                        <option value="">{filteredCategories.length ? 'Choose Category' : `No ${form.type} categories available`}</option>
                                        {filteredCategories.map((cat) => <option key={cat.value} value={cat.value}>{cat.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Date <span className="text-rose-400">*</span></label>
                                <input type="date" required value={form.date} onChange={set('date')} className="input-field h-12 text-sm font-bold animate-none" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                                <input type="text" value={form.description} onChange={set('description')} className="input-field h-12 text-sm font-bold" placeholder="e.g. Sunday Offering Collections" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference Number</label>
                                <input type="text" value={form.reference_number} onChange={set('reference_number')} className="input-field h-12 text-sm font-bold" placeholder="e.g. ref-sunday-123" />
                            </div>

                            {form.type === 'expense' && (
                                <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                                    <div className="space-y-0.5">
                                        <span className="block text-[10px] font-black text-slate-900 uppercase tracking-wider">Strict Accountability Mode</span>
                                        <span className="block text-[10px] text-slate-400 font-bold leading-normal">Reject transaction if account funds are insufficient.</span>
                                    </div>
                                    <button type="button" onClick={() => setForm((prev) => ({ ...prev, strict_mode: !prev.strict_mode }))} className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${form.strict_mode ? 'bg-primary' : 'bg-slate-300'}`}>
                                        <motion.div layout className="bg-white w-4 h-4 rounded-full shadow-md" animate={{ x: form.strict_mode ? 20 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                                    </button>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-slate-50 shrink-0">
                                <button type="button" onClick={handleClose} className="flex-1 py-3.5 text-slate-500 font-black border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors text-sm">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex-1 btn-primary py-3.5 text-sm font-black flex items-center justify-center gap-2">
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Record Entry</span>}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// ─── Accounts Manager ────────────────────────────────────────────────────

const AccountsManager = ({ onAccountCreatedOrModified }) => {
    const [accounts, setAccounts] = useState([]);
    const [tree, setTree] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [selectedAccount, setSelectedAccount] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const buildClientTree = (flatList) => {
        const map = {};
        const roots = [];
        flatList.forEach((item) => { map[item.account_id || item.id] = { ...item, children: [] }; });
        flatList.forEach((item) => {
            const key = item.account_id || item.id;
            const parentKey = item.parent_account_id || item.parent_id;
            const mapped = map[key];
            if (parentKey && map[parentKey]) {
                map[parentKey].children.push(mapped);
            } else {
                roots.push(mapped);
            }
        });
        return roots;
    };

    const loadAccountsData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [acctsData, deptsData, treeData] = await Promise.all([
                FinanceAccountsService.getAll(),
                DepartmentService.getAll(),
                FinanceAccountsService.getTree().catch((err) => {
                    console.warn('[AccountsManager] getTree failed or unsupported:', err);
                    return null;
                })
            ]);

            const acctsList = normalizeFinanceAccounts(acctsData);
            setAccounts(acctsList);

            const deptsList = normalizeArrayResponse(deptsData, ['departments', 'items']);
            setDepartments(deptsList);

            let finalTree = [];
            if (treeData && (Array.isArray(treeData) || treeData.tree || treeData.data)) {
                const rawTree = Array.isArray(treeData) ? treeData : (treeData.tree || treeData.data || []);
                finalTree = normalizeFinanceAccountTree(rawTree);
            }

            if (finalTree.length === 0 && acctsList.length > 0) {
                finalTree = buildClientTree(acctsList);
            }
            setTree(finalTree);

            setSelectedAccount((prev) => {
                if (!prev) return prev;
                return acctsList.find(a => a.value === prev.value || a.id === prev.id) || prev;
            });
        } catch (err) {
            console.error('[AccountsManager] load error:', err);
            setError('Could not load accounts or departments.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadAccountsData(); }, [loadAccountsData]);

    const handleSuccess = () => {
        loadAccountsData();
        setIsCreateOpen(false);
        setIsEditOpen(false);
        if (onAccountCreatedOrModified) onAccountCreatedOrModified();
    };

    const handleDelete = async (account) => {
        if (!window.confirm(`Are you sure you want to delete/deactivate "${account.account_name || account.name}"?`)) return;
        setError('');
        setLoading(true);
        try {
            await FinanceAccountsService.delete(account.id);
            setSelectedAccount(null);
            handleSuccess();
        } catch (err) {
            setError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivateToggle = async (account) => {
        setError('');
        setLoading(true);
        try {
            await FinanceAccountsService.update(account.id, {
                account_name: account.account_name || account.name,
                account_type: account.account_type || 'unit',
                parent_account_id: account.parent_account_id || account.parent_id || null,
                department_id: account.department_id,
                status: account.status === 'active' ? 'inactive' : 'active'
            });
            handleSuccess();
        } catch (err) {
            setError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-primary shadow-sm mt-0.5">
                        <FolderTree size={22} />
                    </div>
                    <div>
                        <h3 className="font-black text-xl text-slate-900 tracking-tight uppercase leading-none">Ledger Accounts</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Church Accounts Hierarchy</p>
                    </div>
                </div>
                <button onClick={() => setIsCreateOpen(true)} className="btn-secondary self-start sm:self-center">
                    <PlusCircle size={16} /><span>Create Account</span>
                </button>
            </div>

            <div className="flex items-start gap-3.5 bg-sky-50 border border-sky-100 text-sky-950 p-4 rounded-[1.25rem] text-xs leading-relaxed font-bold">
                <Info size={18} className="shrink-0 text-sky-600 mt-0.5" />
                <div>
                    <span className="font-black block uppercase tracking-wider mb-1">Ledger Notice</span>
                    These are internal virtual ledger accounts to track fellowship funds, ministry units, and department budgets.
                    They represent digital allocations inside Gatherly and are not physical bank accounts.
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold">
                    <AlertCircle size={16} className="shrink-0" /><span>{error}</span>
                </div>
            )}

            {loading && accounts.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm font-bold text-slate-400">Loading ledger accounts...</p>
                </div>
            ) : accounts.length === 0 ? (
                <div className="py-16 flex flex-col items-center text-center max-w-sm mx-auto space-y-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                        <FolderTree size={32} className="text-slate-400" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-slate-500 font-bold">No accounts available</p>
                        <p className="text-xs text-slate-400 leading-normal font-medium">Create a ledger account before recording transactions.</p>
                    </div>
                    <button onClick={() => setIsCreateOpen(true)} className="btn-primary py-3 px-6 text-xs uppercase tracking-widest font-black">
                        Create Your First Account
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Ledger Hierarchy Map</h4>
                        <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-2 custom-scrollbar">
                            {tree.map((node) => (
                                <TreeNode 
                                    key={node.value} 
                                    node={node} 
                                    selectedAccount={selectedAccount}
                                    onSelect={setSelectedAccount}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Account Detail Card</h4>
                        {selectedAccount ? (
                            <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h5 className="font-black text-xl text-slate-900 tracking-tight">{selectedAccount.account_name || selectedAccount.name}</h5>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 rounded-md">{selectedAccount.account_type}</span>
                                            <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md ${selectedAccount.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {selectedAccount.status || 'active'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Balance</p>
                                        <p className={`font-mono text-lg font-black mt-1 ${(selectedAccount.current_balance ?? selectedAccount.balance ?? selectedAccount.opening_balance ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                            {fmt(selectedAccount.current_balance ?? selectedAccount.balance ?? selectedAccount.opening_balance ?? 0)}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-slate-50 pt-6 space-y-3.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-bold text-slate-400">Department:</span>
                                        <span className="font-bold text-slate-800">{departments.find(d => sameId(d.department_id || d.id, selectedAccount.department_id))?.name || 'Not Linked'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="font-bold text-slate-400">Parent Account:</span>
                                        <span className="font-bold text-slate-800">{accounts.find(a => sameId(a.value, selectedAccount.parent_account_id || selectedAccount.parent_id))?.account_name || 'Top-Level Main Account'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="font-bold text-slate-400">Opening Balance:</span>
                                        <span className="font-mono font-bold text-slate-800">{fmt(selectedAccount.opening_balance ?? 0)}</span>
                                    </div>
                                </div>

                                <div className="border-t border-slate-50 pt-6 flex flex-wrap gap-3">
                                    <button onClick={() => setIsEditOpen(true)} className="flex-1 py-3 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all">
                                        <Edit3 size={12} /><span>Edit Details</span>
                                    </button>
                                    <button onClick={() => handleDeactivateToggle(selectedAccount)} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all border ${selectedAccount.status === 'active' ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'}`}>
                                        <Settings size={12} /><span>{selectedAccount.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                                    </button>
                                    <button onClick={() => handleDelete(selectedAccount)} className="w-full py-3 bg-red-600 text-white hover:bg-red-700 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all">
                                        <Trash2 size={12} /><span>Delete Account</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center text-slate-400 font-bold border-dashed flex flex-col items-center justify-center h-48">
                                <Info size={24} className="mb-3 text-slate-300" />
                                <p className="text-xs">Click on any hierarchy node to view balances, departments, and action triggers.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <CreateAccountModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                onSuccess={handleSuccess} 
                accounts={accounts} 
                departments={departments} 
            />
            
            <EditAccountModal 
                isOpen={isEditOpen} 
                onClose={() => setIsEditOpen(false)} 
                onSuccess={handleSuccess} 
                accounts={accounts} 
                departments={departments} 
                account={selectedAccount} 
            />
        </div>
    );
};

// ─── Main Finance Page ───────────────────────────────────────────────────

const Finance = () => {
    const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 });
    const [transactions, setTransactions] = useState([]);
    const [financeAccounts, setFinanceAccounts] = useState([]);
    const [financeCategories, setFinanceCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');
    const [filter, setFilter] = useState('all');
    
    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('income');
    const [isImportOpen, setIsImportOpen] = useState(false);

    const fetchFinanceData = useCallback(async () => {
        setLoading(true);
        setApiError('');
        try {
            const [response, accountsData, categoriesData] = await Promise.all([
                FinanceService.getSummary(),
                FinanceAccountsService.getAll().catch(() => []),
                FinanceService.getCategories().catch(() => [])
            ]);
            setSummary(normalizeFinanceSummary(response));
            setTransactions(normalizeTransactions(response));
            setFinanceAccounts(normalizeFinanceAccounts(accountsData));
            setFinanceCategories(normalizeFinanceCategories(categoriesData));
        } catch (err) {
            console.error('Error fetching finance data', err);
            setApiError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchFinanceData(); }, [fetchFinanceData]);

    const openModal = (type) => { setModalType(type); setIsModalOpen(true); };

    const filteredTx = transactions.filter((tx) => filter === 'all' ? true : tx.type === filter);
    const balance = summary.balance ?? (summary.total_income - summary.total_expense);
    const categoryLookup = createLookupMap(financeCategories, ['category_id', 'id', 'value'], ['name', 'category_name']);
    const accountLookup = createLookupMap(financeAccounts, ['account_id', 'id', 'value'], ['account_name', 'name']);

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-8 pt-2">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Finances</h1>
                        <p className="text-sm text-slate-500 mt-3 font-medium max-w-md leading-relaxed">
                            A simple view of your fellowship's money. Trustworthy and transparent.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <PermissionGate allowedRoles={['super_admin', 'pastor', 'finance_officer']}>
                            <button onClick={() => setIsImportOpen(true)} className="btn-outline w-full sm:w-auto px-4 shadow-sm">
                                <Download className="w-4 h-4" /><span>Import Records</span>
                            </button>
                            <button onClick={() => openModal('expense')} className="btn-outline w-full sm:w-auto">
                                <Plus className="w-4 h-4" /><span>Add Expense</span>
                            </button>
                            <button onClick={() => openModal('income')} className="btn-secondary w-full sm:w-auto">
                                <Plus className="w-4 h-4" /><span>Add Income</span>
                            </button>
                        </PermissionGate>
                    </div>
                </div>

                {/* API Error */}
                {apiError && !loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 bg-red-50 border border-red-100 text-red-600 p-6 rounded-3xl">
                        <AlertCircle size={22} className="shrink-0" />
                        <div>
                            <p className="font-bold text-sm">Could not load finance data</p>
                            <p className="text-xs mt-1 opacity-80">{apiError}</p>
                        </div>
                        <button onClick={fetchFinanceData} className="ml-auto text-xs font-black uppercase tracking-widest underline shrink-0">Retry</button>
                    </motion.div>
                )}

                {/* Summary Cards */}
                <section>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <FinanceCard label="Balance" amount={balance} icon={Wallet} color="gold" />
                        <FinanceCard label="Money In" amount={summary.total_income} icon={ArrowUpRight} color="green" />
                        <FinanceCard label="Money Out" amount={summary.total_expense} icon={ArrowDownRight} color="red" />
                    </div>
                </section>

                {/* Ledger Accounts Hierarchy section */}
                <AccountsManager onAccountCreatedOrModified={fetchFinanceData} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Transaction List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-5 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                                        <History size={22} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl text-slate-900 tracking-tight uppercase leading-none">Money Log</h3>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.18em] mt-2">Every coin accounted for</p>
                                    </div>
                                </div>
                                <div className="flex items-center bg-white p-2 rounded-[1.5rem] border border-slate-200 shadow-sm overflow-x-auto">
                                    {[['all', 'Everything'], ['income', 'In'], ['expense', 'Out']].map(([val, label]) => (
                                        <button
                                            key={val}
                                            onClick={() => setFilter(val)}
                                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === val
                                                    ? val === 'income' ? 'bg-secondary text-white shadow-xl shadow-emerald-900/20'
                                                        : val === 'expense' ? 'bg-rose-500 text-white shadow-xl shadow-rose-900/20'
                                                            : 'bg-slate-900 text-white shadow-xl shadow-slate-900/20'
                                                    : 'text-slate-400 hover:text-slate-900'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {loading ? (
                                    <div className="py-16 flex flex-col items-center justify-center gap-4">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                        <p className="text-sm font-bold text-slate-400">Loading summary...</p>
                                    </div>
                                ) : filteredTx.length === 0 ? (
                                    <div className="py-16 flex flex-col items-center text-center max-w-sm mx-auto space-y-6">
                                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                                            <FileText size={32} className="text-slate-400" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-slate-500 font-bold">No transactions yet</p>
                                            <p className="text-xs text-slate-400 font-medium">Record your first income or expense to begin tracking fellowship finances.</p>
                                        </div>
                                    </div>
                                ) : (
                                    filteredTx.map((tx, index) => (
                                        <TransactionCard
                                            key={tx.id || tx.reference_number || index}
                                            tx={tx}
                                            categoryLookup={categoryLookup}
                                            accountLookup={accountLookup}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        <SectionCard title="Fund Allocation" description="Category breakdown" icon={PieChart}>
                            <div className="flex items-start gap-4 py-2">
                                <div className="w-11 h-11 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 shrink-0">
                                    <PieChart size={20} className="text-accent" />
                                </div>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    Category charts will appear when grouped report data is available.
                                </p>
                            </div>
                        </SectionCard>

                        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl shadow-slate-900/20 text-center relative overflow-hidden group">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all" />
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/20 mx-auto mb-5 relative z-10">
                                <ShieldAlert size={24} />
                            </div>
                            <h4 className="font-black text-lg text-white tracking-tight mb-3 uppercase relative z-10">Secure Records</h4>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium mb-6 opacity-80 relative z-10">
                                Every transaction is securely logged. Actions cannot be erased, ensuring complete trust and transparency.
                            </p>
                            <button className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl relative z-10 opacity-60 cursor-not-allowed">
                                View Security Logs - Coming Soon
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isModalOpen && (
                    <AddTransactionModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={fetchFinanceData}
                        defaultType={modalType}
                    />
                )}
            </AnimatePresence>
            
            <FinanceImport 
                isOpen={isImportOpen} 
                onClose={() => setIsImportOpen(false)} 
                onComplete={fetchFinanceData} 
            />
        </Layout>
    );
};

export default Finance;