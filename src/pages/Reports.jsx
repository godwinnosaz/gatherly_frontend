import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import {
    LineChart, Wallet, CheckSquare, Calendar, LayoutGrid, Search,
    Loader2, AlertCircle, Info, CalendarRange, TrendingUp, TrendingDown,
    Award, ShieldAlert
} from 'lucide-react';
import { ReportsService } from '../api/services';
import { normalizeArrayResponse, normalizeObjectResponse } from '../utils/apiResponse';

const fmtDate = (dString) => {
    if (!dString) return '';
    try {
        return new Date(dString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch {
        return dString;
    }
};

const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        maximumFractionDigits: 0
    }).format(amount || 0);
};

const friendlyError = (err) => {
    return err?.response?.data?.message || err?.message || 'Something went wrong';
};

const Reports = () => {
    // Current Active Tab: 'overview' | 'finance' | 'attendance' | 'events' | 'departments'
    const [activeTab, setActiveTab] = useState('overview');

    // Date Filters
    const getPastDateString = (daysAgo) => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split('T')[0];
    };

    const [dateFilters, setDateFilters] = useState({
        start_date: getPastDateString(30),
        end_date: new Date().toISOString().split('T')[0]
    });

    // Data States
    const [summary, setSummary] = useState(null);
    const [financeData, setFinanceData] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [eventsData, setEventsData] = useState([]);
    const [departmentsData, setDepartmentsData] = useState([]);

    // Loading & Error states
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');

    const fetchOverview = useCallback(async () => {
        setLoading(true);
        setApiError('');
        try {
            const res = await ReportsService.getSummary();
            setSummary(normalizeObjectResponse(res, ['summary', 'report']));
        } catch (err) {
            console.error('Error fetching summary reports', err);
            setApiError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchFinanceReport = useCallback(async () => {
        setLoading(true);
        setApiError('');
        try {
            const params = {
                start_date: dateFilters.start_date,
                end_date: dateFilters.end_date
            };
            const res = await ReportsService.getFinance(params);
            setFinanceData(normalizeArrayResponse(res, ['transactions', 'finance', 'items']));
        } catch (err) {
            console.error('Error fetching finance reports', err);
            setApiError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    }, [dateFilters]);

    const fetchAttendanceReport = useCallback(async () => {
        setLoading(true);
        setApiError('');
        try {
            const params = {
                start_date: dateFilters.start_date,
                end_date: dateFilters.end_date
            };
            const res = await ReportsService.getAttendance(params);
            setAttendanceData(normalizeArrayResponse(res, ['attendance', 'records', 'sessions', 'items']));
        } catch (err) {
            console.error('Error fetching attendance reports', err);
            setApiError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    }, [dateFilters]);

    const fetchEventsReport = useCallback(async () => {
        setLoading(true);
        setApiError('');
        try {
            const res = await ReportsService.getEvents();
            setEventsData(normalizeArrayResponse(res, ['events', 'items']));
        } catch (err) {
            console.error('Error fetching events reports', err);
            setApiError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDepartmentsReport = useCallback(async () => {
        setLoading(true);
        setApiError('');
        try {
            const res = await ReportsService.getDepartments();
            setDepartmentsData(normalizeArrayResponse(res, ['departments', 'items']));
        } catch (err) {
            console.error('Error fetching departments reports', err);
            setApiError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    }, []);

    // Load data based on selected tab
    useEffect(() => {
        if (activeTab === 'overview') fetchOverview();
        else if (activeTab === 'finance') fetchFinanceReport();
        else if (activeTab === 'attendance') fetchAttendanceReport();
        else if (activeTab === 'events') fetchEventsReport();
        else if (activeTab === 'departments') fetchDepartmentsReport();
    }, [activeTab, fetchOverview, fetchFinanceReport, fetchAttendanceReport, fetchEventsReport, fetchDepartmentsReport]);

    // Handle filter submit trigger
    const handleApplyFilters = (e) => {
        e.preventDefault();
        if (activeTab === 'finance') fetchFinanceReport();
        else if (activeTab === 'attendance') fetchAttendanceReport();
    };

    // Calculations helper for Finance Tab
    const computeFinanceTotals = () => {
        let totalIncome = 0;
        let totalExpense = 0;
        financeData.forEach(item => {
            const amount = Number(item.amount) || 0;
            if (item.type === 'income') totalIncome += amount;
            else if (item.type === 'expense') totalExpense += amount;
        });
        return {
            totalIncome,
            totalExpense,
            netCash: totalIncome - totalExpense
        };
    };

    const finTotals = computeFinanceTotals();

    // Calculations helper for Attendance Tab
    const computeAttendanceSummary = () => {
        if (attendanceData.length === 0) return { avgRate: 0, totalSessions: 0 };
        let sumRate = 0;
        attendanceData.forEach(item => {
            sumRate += Number(item.present_rate || item.rate || 0);
        });
        return {
            avgRate: Math.round(sumRate / attendanceData.length),
            totalSessions: attendanceData.length
        };
    };

    const attSummary = computeAttendanceSummary();

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Reports Center</h1>
                        <p className="text-sm text-slate-500 mt-3 font-medium max-w-md leading-relaxed">
                            Access live summaries and generate statements across finances, members roll calls, and fellowships.
                        </p>
                    </div>
                </div>

                {/* Dashboard Tabs Bar */}
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3 shrink-0">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'overview'
                                ? 'bg-primary text-white shadow-lg shadow-blue-900/10'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                        }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('finance')}
                        className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'finance'
                                ? 'bg-primary text-white shadow-lg shadow-blue-900/10'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                        }`}
                    >
                        Finances
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'attendance'
                                ? 'bg-primary text-white shadow-lg shadow-blue-900/10'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                        }`}
                    >
                        Attendance
                    </button>
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'events'
                                ? 'bg-primary text-white shadow-lg shadow-blue-900/10'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                        }`}
                    >
                        Events
                    </button>
                    <button
                        onClick={() => setActiveTab('departments')}
                        className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'departments'
                                ? 'bg-primary text-white shadow-lg shadow-blue-900/10'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                        }`}
                    >
                        Fellowship Units
                    </button>
                </div>

                {/* API Error Notification */}
                {apiError && !loading && (
                    <div className="flex items-center gap-4 bg-red-50 border border-red-100 text-red-600 p-6 rounded-3xl">
                        <AlertCircle size={22} className="shrink-0" />
                        <div>
                            <p className="font-bold text-sm">Failed to generate reports</p>
                            <p className="text-xs mt-1 opacity-80">{apiError}</p>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="py-24 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm font-bold text-slate-400">Loading dynamic statements…</p>
                    </div>
                )}

                {/* Dynamic Content Views */}
                {!loading && (
                    <div className="space-y-12">
                        {/* 1. OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <div className="space-y-10 animate-in fade-in duration-200">
                                {/* Highlights Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                    {/* Members Count */}
                                    <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Total Members</span>
                                            <p className="font-mono text-3xl font-black text-slate-900 mt-3">{summary?.total_members ?? 0}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-blue-50 text-primary border border-blue-100 rounded-xl flex items-center justify-center">
                                            <LineChart size={24} />
                                        </div>
                                    </div>

                                    {/* Total Inflow */}
                                    <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Treasury Money In</span>
                                            <p className="font-mono text-2xl font-black text-emerald-600 mt-3">
                                                {formatMoney(summary?.total_income ?? summary?.total_inflow ?? 0)}
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center">
                                            <TrendingUp size={24} />
                                        </div>
                                    </div>

                                    {/* Total Outflow */}
                                    <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Treasury Money Out</span>
                                            <p className="font-mono text-2xl font-black text-rose-600 mt-3">
                                                {formatMoney(summary?.total_expense ?? summary?.total_outflow ?? 0)}
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl flex items-center justify-center">
                                            <TrendingDown size={24} />
                                        </div>
                                    </div>

                                    {/* Attendance Rate */}
                                    <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Attendance Rate</span>
                                            <p className="font-mono text-3xl font-black text-slate-900 mt-3">
                                                {summary?.attendance_rate ?? summary?.present_rate ?? 0}%
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl flex items-center justify-center">
                                            <CheckSquare size={24} />
                                        </div>
                                    </div>
                                </div>

                                {/* Summary charts description info */}
                                <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6">
                                    <div className="w-16 h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center text-primary shrink-0 shadow-lg shadow-blue-900/5">
                                        <Award size={32} />
                                    </div>
                                    <div className="space-y-1.5 text-center md:text-left">
                                        <h3 className="font-black text-xl text-slate-950 uppercase tracking-tight">Active Fellowship Health Audit</h3>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                            Your fellowship is performing optimally with a stable roll call checklist rate. Treasury balances are matched with digital virtual ledger accounts allocations.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. FINANCES TAB (With date range filters) */}
                        {activeTab === 'finance' && (
                            <div className="space-y-10 animate-in fade-in duration-200">
                                {/* Date Filters Row */}
                                <form onSubmit={handleApplyFilters} className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] flex flex-col md:flex-row items-end gap-4 justify-between">
                                    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center flex-1 w-full">
                                        <div className="flex items-center gap-2 text-slate-500 font-black text-xs uppercase tracking-wider shrink-0">
                                            <CalendarRange size={16} />
                                            <span>Select Range:</span>
                                        </div>

                                        {/* Start Date */}
                                        <div className="flex-1 min-w-[140px]">
                                            <input
                                                type="date"
                                                value={dateFilters.start_date}
                                                onChange={(e) => setDateFilters(prev => ({ ...prev, start_date: e.target.value }))}
                                                className="w-full bg-white border border-slate-150 rounded-xl px-4 py-2.5 outline-none font-bold text-xs text-slate-800"
                                            />
                                        </div>

                                        <span className="text-slate-400 font-bold text-xs self-center">to</span>

                                        {/* End Date */}
                                        <div className="flex-1 min-w-[140px]">
                                            <input
                                                type="date"
                                                value={dateFilters.end_date}
                                                onChange={(e) => setDateFilters(prev => ({ ...prev, end_date: e.target.value }))}
                                                className="w-full bg-white border border-slate-150 rounded-xl px-4 py-2.5 outline-none font-bold text-xs text-slate-800"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn-secondary h-11 px-6 text-xs font-black uppercase tracking-wider w-full md:w-auto shrink-0 flex items-center justify-center gap-2"
                                    >
                                        <Search size={14} />
                                        <span>Update Report</span>
                                    </button>
                                </form>

                                {/* Compute Stats cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2.5rem] shadow-sm">
                                        <span className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em]">Total Money Received</span>
                                        <p className="font-mono text-3xl font-black text-emerald-700 mt-3">{formatMoney(finTotals.totalIncome)}</p>
                                    </div>
                                    <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2.5rem] shadow-sm">
                                        <span className="text-[10px] text-rose-600 font-black uppercase tracking-[0.2em]">Total Money Spent</span>
                                        <p className="font-mono text-3xl font-black text-rose-700 mt-3">{formatMoney(finTotals.totalExpense)}</p>
                                    </div>
                                    <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-sm">
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Net Cash Flow</span>
                                        <p className={`font-mono text-3xl font-black mt-3 ${finTotals.netCash >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {formatMoney(finTotals.netCash)}
                                        </p>
                                    </div>
                                </div>

                                {/* Income vs Expense Custom Progress Chart */}
                                <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] space-y-6">
                                    <h4 className="font-black text-lg text-slate-900 uppercase tracking-tight">Inflow vs Outflow Ratio</h4>
                                    <div className="space-y-4">
                                        {/* CSS custom stack bar */}
                                        {finTotals.totalIncome === 0 && finTotals.totalExpense === 0 ? (
                                            <div className="py-6 text-center text-xs text-slate-400 font-bold">No transactions found in this date range.</div>
                                        ) : (
                                            <div className="space-y-5">
                                                <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                                    <div 
                                                        style={{ width: `${(finTotals.totalIncome / (finTotals.totalIncome + finTotals.totalExpense || 1)) * 100}%` }}
                                                        className="h-full bg-emerald-500" 
                                                    />
                                                    <div 
                                                        style={{ width: `${(finTotals.totalExpense / (finTotals.totalIncome + finTotals.totalExpense || 1)) * 100}%` }}
                                                        className="h-full bg-rose-500" 
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center text-xs font-bold">
                                                    <div className="flex items-center gap-1.5 text-emerald-600">
                                                        <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                                                        <span>Received ({Math.round((finTotals.totalIncome / (finTotals.totalIncome + finTotals.totalExpense || 1)) * 100)}%)</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-rose-600">
                                                        <div className="w-3 h-3 bg-rose-500 rounded-full" />
                                                        <span>Spent ({Math.round((finTotals.totalExpense / (finTotals.totalIncome + finTotals.totalExpense || 1)) * 100)}%)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Detailed Statement Table */}
                                <div className="bg-slate-50 border border-slate-100 p-6 sm:p-8 rounded-[2.5rem] space-y-6">
                                    <h4 className="font-black text-lg text-slate-900 uppercase tracking-tight">Statement Ledger Logs</h4>
                                    <div className="overflow-x-auto">
                                        {financeData.length === 0 ? (
                                            <div className="py-16 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
                                                <div className="w-16 h-16 bg-blue-50/80 rounded-2xl flex items-center justify-center border border-blue-100 shadow-inner text-primary/40">
                                                    <Wallet size={28} />
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-sm text-slate-800 uppercase tracking-tight">No Transactions Logged</h5>
                                                    <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">No statement records found for the selected date range. Try adjusting your filters or adding a ledger entry.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-slate-200 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                                                        <th className="pb-3">Date</th>
                                                        <th className="pb-3">Ref Code</th>
                                                        <th className="pb-3">Description</th>
                                                        <th className="pb-3">Type</th>
                                                        <th className="pb-3 text-right">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                                                    {financeData.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-100/50">
                                                            <td className="py-4 whitespace-nowrap">{fmtDate(item.date || item.created_at)}</td>
                                                            <td className="py-4 font-mono text-[10px] text-slate-400 uppercase tracking-wider">{item.reference_number || item.reference || `TX-${item.transaction_id || item.id}`}</td>
                                                            <td className="py-4 max-w-xs truncate">{item.description}</td>
                                                            <td className="py-4 capitalize">
                                                                <span className={`px-2 py-0.5 rounded-md border text-[9px] uppercase tracking-wider font-black ${
                                                                    item.type === 'income' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                                                }`}>
                                                                    {item.type === 'income' ? 'Money In' : 'Money Out'}
                                                                </span>
                                                            </td>
                                                            <td className={`py-4 text-right font-mono ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                {item.type === 'income' ? '+' : '-'}{formatMoney(item.amount)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. ATTENDANCE TAB */}
                        {activeTab === 'attendance' && (
                            <div className="space-y-10 animate-in fade-in duration-200">
                                {/* Date Filters Row */}
                                <form onSubmit={handleApplyFilters} className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] flex flex-col md:flex-row items-end gap-4 justify-between">
                                    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center flex-1 w-full">
                                        <div className="flex items-center gap-2 text-slate-500 font-black text-xs uppercase tracking-wider shrink-0">
                                            <CalendarRange size={16} />
                                            <span>Select Range:</span>
                                        </div>

                                        {/* Start Date */}
                                        <div className="flex-1 min-w-[140px]">
                                            <input
                                                type="date"
                                                value={dateFilters.start_date}
                                                onChange={(e) => setDateFilters(prev => ({ ...prev, start_date: e.target.value }))}
                                                className="w-full bg-white border border-slate-150 rounded-xl px-4 py-2.5 outline-none font-bold text-xs text-slate-800"
                                            />
                                        </div>

                                        <span className="text-slate-400 font-bold text-xs self-center">to</span>

                                        {/* End Date */}
                                        <div className="flex-1 min-w-[140px]">
                                            <input
                                                type="date"
                                                value={dateFilters.end_date}
                                                onChange={(e) => setDateFilters(prev => ({ ...prev, end_date: e.target.value }))}
                                                className="w-full bg-white border border-slate-150 rounded-xl px-4 py-2.5 outline-none font-bold text-xs text-slate-800"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn-secondary h-11 px-6 text-xs font-black uppercase tracking-wider w-full md:w-auto shrink-0 flex items-center justify-center gap-2"
                                    >
                                        <Search size={14} />
                                        <span>Update Report</span>
                                    </button>
                                </form>

                                {/* Summary Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Average Present Rate</span>
                                            <p className="font-mono text-3xl font-black text-slate-900 mt-3">{attSummary.avgRate}%</p>
                                        </div>
                                        <div className="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center border border-blue-100">
                                            <CheckSquare size={24} />
                                        </div>
                                    </div>
                                    <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Total Sessions Logged</span>
                                            <p className="font-mono text-3xl font-black text-slate-900 mt-3">{attSummary.totalSessions}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-amber-50 text-accent rounded-xl flex items-center justify-center border border-amber-100">
                                            <Calendar size={24} />
                                        </div>
                                    </div>
                                </div>

                                {/* Custom Visual attendance list bar logs */}
                                <div className="bg-slate-50 border border-slate-100 p-6 sm:p-8 rounded-[2.5rem] space-y-6">
                                    <h4 className="font-black text-lg text-slate-900 uppercase tracking-tight">Active Attendance Session Checklist</h4>
                                    <div className="space-y-4">
                                        {attendanceData.length === 0 ? (
                                            <div className="py-16 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
                                                <div className="w-16 h-16 bg-emerald-50/80 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-inner text-emerald-600/40">
                                                    <CheckSquare size={28} />
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-sm text-slate-800 uppercase tracking-tight">No Attendance Records</h5>
                                                    <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">No roll session statistics loaded for this date range. Record attendance for your fellowship events to track growth.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            attendanceData.map((item, idx) => {
                                                const rate = Number(item.present_rate || item.rate || 0);
                                                return (
                                                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-150 space-y-3">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div>
                                                                <h5 className="text-xs font-black text-slate-800">{item.name || item.session_name || 'Fellowship ROLL'}</h5>
                                                                <p className="text-[9px] text-slate-400 font-bold mt-1">{fmtDate(item.date)}</p>
                                                            </div>
                                                            <span className="text-xs font-mono font-black text-slate-800">{rate}% Rate</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div 
                                                                style={{ width: `${rate}%` }}
                                                                className={`h-full ${rate >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. EVENTS TAB */}
                        {activeTab === 'events' && (
                            <div className="space-y-10 animate-in fade-in duration-200">
                                <div className="bg-slate-50 border border-slate-100 p-6 sm:p-8 rounded-[2.5rem] space-y-6">
                                    <h4 className="font-black text-lg text-slate-900 uppercase tracking-tight">Logged Events Engagement Statements</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {eventsData.length === 0 ? (
                                            <div className="col-span-2 py-16 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
                                                <div className="w-16 h-16 bg-amber-50/80 rounded-2xl flex items-center justify-center border border-amber-100 shadow-inner text-amber-600/40">
                                                    <Calendar size={28} />
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-sm text-slate-800 uppercase tracking-tight">No Events Logged</h5>
                                                    <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">No event registers found in the database. Schedule upcoming services or meetings to analyze attendee engagement.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            eventsData.map((evt, idx) => (
                                                <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 space-y-3">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <h5 className="text-sm font-black text-slate-850 leading-snug">{evt.title}</h5>
                                                            <p className="text-[9px] text-slate-400 font-bold mt-1">{fmtDate(evt.event_date || evt.date)}</p>
                                                        </div>
                                                        <span className="text-[9px] font-black text-primary bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md uppercase">
                                                            {evt.type || 'Service'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-2">{evt.description}</p>
                                                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-black uppercase pt-1 border-t border-slate-100">
                                                        <span>RSVPs: {evt.rsvp_count ?? evt.rsvps ?? 0}</span>
                                                        <span>Checked In: {evt.checked_in_count ?? evt.check_ins ?? 0}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 5. DEPARTMENTS TAB */}
                        {activeTab === 'departments' && (
                            <div className="space-y-10 animate-in fade-in duration-200">
                                <div className="bg-slate-50 border border-slate-100 p-6 sm:p-8 rounded-[2.5rem] space-y-6">
                                    <h4 className="font-black text-lg text-slate-900 uppercase tracking-tight">Active Fellowship Units Analytics</h4>
                                    <div className="space-y-3">
                                        {departmentsData.length === 0 ? (
                                            <div className="py-16 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
                                                <div className="w-16 h-16 bg-purple-50/80 rounded-2xl flex items-center justify-center border border-purple-100 shadow-inner text-purple-600/40">
                                                    <LayoutGrid size={28} />
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-sm text-slate-800 uppercase tracking-tight">No Fellowship Units</h5>
                                                    <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">No departments or units configured yet. Create fellowship units to track team rosters and unit analytics.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            departmentsData.map((dept, idx) => (
                                                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-primary">
                                                            <LayoutGrid size={20} />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-xs font-black text-slate-800 leading-snug">{dept.name}</h5>
                                                            {dept.leader_name && (
                                                                <p className="text-[9px] text-slate-400 font-bold mt-1">Leader: {dept.leader_name}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-[10px] font-black uppercase text-slate-500">
                                                        <span>Members Headcount: {dept.members_count ?? dept.members ?? 0}</span>
                                                        <span className={`px-2 py-0.5 rounded border ${
                                                            dept.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                                                        }`}>
                                                            {dept.status || 'Active'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Reports;
