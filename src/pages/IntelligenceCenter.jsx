import React, { useState, useRef } from 'react';
import Layout from '../components/Layout';
import { AIService } from '../api/services';
import {
    BrainCircuit, Sparkles, FileText, Calendar,
    AlertCircle, CheckCircle2, Loader2, X,
    Upload, Table, ChevronRight, Lock, Plus, Trash2,
    Wallet, Send, MessageSquare, Clipboard, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const friendlyError = (err) => {
    return err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';
};

// ─── Custom Hook for AI Generation ───────────────────────────────────────────
const useAIGenerator = (apiCall) => {
    const [data, setData] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastParams, setLastParams] = useState(null);

    const generate = async (params = null) => {
        setLoading(true);
        setError('');
        try {
            const response = await apiCall(params);
            const text = typeof response === 'string' 
                ? response 
                : (response?.summary || response?.report || response?.announcement || response?.message || JSON.stringify(response));
            setData(text);
            setLastParams(params);
        } catch (err) {
            setError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    // Checks if current form parameters match the last successfully generated parameters
    const isUnchanged = (currentParams) => {
        if (!lastParams || !currentParams) return false;
        return JSON.stringify(lastParams) === JSON.stringify(currentParams);
    };

    return { data, loading, error, generate, isUnchanged };
};

// ─── CSV Column Mapper ───────────────────────────────────────────────────────
const CsvAnalyzer = () => {
    const [headers, setHeaders] = useState([]);
    const [headerInput, setHeaderInput] = useState('');
    const [mapping, setMapping] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileRef = useRef();

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            const firstLine = evt.target.result.split('\n')[0] || '';
            const parsed = firstLine.split(',').map((h) => h.trim()).filter(Boolean);
            setHeaders(parsed);
            setMapping(null);
            setError('');
        };
        // Memory Optimization: Only read the first 4KB to grab headers, 
        // preventing browser freezes on massive CSV files.
        const blob = file.slice(0, 4096); 
        reader.readAsText(blob);
    };

    const addHeader = () => {
        const val = headerInput.trim();
        if (!val) return;
        setHeaders((prev) => [...prev, val]);
        setHeaderInput('');
    };

    const removeHeader = (idx) => {
        setHeaders((prev) => prev.filter((_, i) => i !== idx));
        setMapping(null);
    };

    const handleAnalyze = async () => {
        if (headers.length === 0) {
            setError('Please add at least one header before analyzing.');
            return;
        }
        setError('');
        setLoading(true);
        setMapping(null);
        try {
            const response = await AIService.analyzeCsv({ headers });
            setMapping(response);
        } catch (err) {
            setError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border border-slate-150 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 border border-purple-100 shrink-0">
                    <Table size={22} />
                </div>
                <div>
                    <h3 className="font-black text-xl text-slate-900 tracking-tight leading-none">CSV Column Mapper</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1.5">
                        POST /ai/csvAnalyze — AI field mapping suggestions
                    </p>
                </div>
            </div>

            {/* Upload */}
            <div className="flex flex-col sm:flex-row gap-3">
                <input type="file" accept=".csv" ref={fileRef} onChange={handleFileUpload} className="hidden" />
                <button
                    onClick={() => fileRef.current.click()}
                    className="flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors"
                >
                    <Upload size={16} />
                    <span>Auto-read CSV Headers</span>
                </button>
            </div>

            {/* Manual header input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={headerInput}
                    onChange={(e) => setHeaderInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHeader(); }}}
                    placeholder='Or add header manually (e.g. "Phone")'
                    className="input-field flex-1 h-12 text-xs font-bold"
                />
                <button
                    onClick={addHeader}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl transition-colors shrink-0"
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* Header pills */}
            {headers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {headers.map((h, i) => (
                        <span
                            key={i}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-xl text-xs font-bold"
                        >
                            {h}
                            <button onClick={() => removeHeader(i)} className="hover:text-red-500 transition-colors">
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Analyze button */}
            <button
                onClick={handleAnalyze}
                disabled={loading || headers.length === 0}
                className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generating...</span>
                    </>
                ) : (
                    <>
                        <Sparkles size={18} />
                        <span>Analyze Columns</span>
                    </>
                )}
            </button>

            {/* Result */}
            <AnimatePresence>
                {mapping && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 space-y-3"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 size={16} className="text-purple-600" />
                            <p className="text-xs font-black text-purple-700 uppercase tracking-widest">AI Mapping Suggestions</p>
                        </div>
                        {Object.entries(mapping).map(([csvCol, gatherlyField]) => (
                            <div key={csvCol} className="flex items-center gap-3 text-xs font-bold text-slate-700">
                                <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">{csvCol}</span>
                                <ChevronRight size={14} className="text-purple-400 shrink-0" />
                                <span className="text-purple-700">{gatherlyField}</span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Intelligence Center Page ────────────────────────────────────────────────
const IntelligenceCenter = () => {
    // Shared copy state
    const [copySuccess, setCopySuccess] = useState('');

    // AI Generators
    const attendanceAI = useAIGenerator(AIService.getAttendanceSummary);
    const financeAI = useAIGenerator(AIService.getFinanceSummary);
    const leadershipAI = useAIGenerator(AIService.generateReport);
    const announcementAI = useAIGenerator(AIService.writeAnnouncement);

    // Form States
    const [financeDate, setFinanceDate] = useState({
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    });

    const [reportDate, setReportDate] = useState({
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    });

    const [annForm, setAnnForm] = useState({
        purpose: 'Sunday Service Reminder',
        tone: 'warm',
        details: 'Join us by 8:00 AM for an impactful worship experience. Bring a friend!'
    });

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopySuccess('Copied to clipboard!');
        setTimeout(() => setCopySuccess(''), 2000);
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                            AI Leadership Center
                        </h1>
                        <p className="text-sm text-slate-500 mt-3 font-medium max-w-md leading-relaxed">
                            Premium intelligence assistant designed to help you analyze roll calls, compile reports, and draft announcements.
                        </p>
                    </div>
                </div>

                {/* Privacy & Telemetry Guard Alert */}
                <div className="p-6 bg-purple-50 border border-purple-100 text-purple-950 rounded-[2rem] flex items-start gap-4">
                    <ShieldCheck size={22} className="text-purple-600 shrink-0 mt-0.5" />
                    <div className="text-xs font-bold leading-normal">
                        <p className="font-black text-purple-900">Privacy & Ledger Security Note</p>
                        <p className="mt-1 text-[10px] text-purple-700 font-medium">
                            All analytics are executed under strict sandboxed telemetry models. Financial transaction records and member data are completely de-identified before dispatching queries to external AI servers.
                        </p>
                    </div>
                </div>

                {/* Master Grid Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* 1. Attendance Summary Card */}
                    <div className="bg-purple-50/40 border border-purple-100 rounded-[2.5rem] p-8 flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/20 shrink-0">
                                <Sparkles size={22} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Attendance Summary</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-1.5">
                                    AI attendance trends and roll call insights
                                </p>
                            </div>
                        </div>

                        <div className="min-h-[140px] flex-1 bg-white border border-purple-100 rounded-2xl p-6 flex flex-col justify-center">
                            {attendanceAI.loading ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-purple-600 text-xs font-bold">
                                        <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                                        <span>Generating...</span>
                                    </div>
                                    <div className="h-2.5 bg-purple-50 rounded-full w-3/4 animate-pulse" />
                                    <div className="h-2.5 bg-purple-50 rounded-full w-1/2 animate-pulse" />
                                </div>
                            ) : attendanceAI.error ? (
                                <div className="flex items-start gap-3 text-red-600">
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <p className="text-xs font-bold">{attendanceAI.error}</p>
                                </div>
                            ) : attendanceAI.data ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                        <span className="text-[9px] font-black text-purple-600 uppercase tracking-wider">AI Executive Assistant</span>
                                        <button onClick={() => copyToClipboard(attendanceAI.data)} className="text-[10px] text-purple-600 hover:underline flex items-center gap-1 font-black uppercase">
                                            <Clipboard size={12} />
                                            <span>Copy</span>
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-650 leading-relaxed font-bold whitespace-pre-wrap">{attendanceAI.data}</p>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 font-bold italic text-center">
                                    Summarize recent roll call checklists, absences, and attendance patterns instantly.
                                </p>
                            )}
                        </div>

                        <button
                            onClick={() => attendanceAI.generate()}
                            disabled={attendanceAI.loading}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-900/10 disabled:opacity-50"
                        >
                            {attendanceAI.loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <BrainCircuit size={18} />
                                    <span>{attendanceAI.data ? 'Regenerate summary' : 'Analyze Attendance'}</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* 2. CSV Column Mapper */}
                    <CsvAnalyzer />

                    {/* 3. Finance Summary Generator */}
                    <div className="bg-purple-50/40 border border-purple-100 rounded-[2.5rem] p-8 flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/20 shrink-0">
                                <Wallet size={22} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Finance Summary</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-1.5">
                                    Cashflow and stewardship insights
                                </p>
                            </div>
                        </div>

                        {/* Date selection form */}
                        <form onSubmit={(e) => { e.preventDefault(); financeAI.generate(financeDate); }} className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="block text-[9px] font-black text-purple-600 uppercase tracking-wider">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    value={financeDate.start_date}
                                    onChange={(e) => setFinanceDate(p => ({ ...p, start_date: e.target.value }))}
                                    className="w-full bg-white border border-purple-100 rounded-xl px-4 py-2.5 outline-none font-bold text-xs text-slate-800"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[9px] font-black text-purple-600 uppercase tracking-wider">End Date</label>
                                <input
                                    type="date"
                                    required
                                    value={financeDate.end_date}
                                    onChange={(e) => setFinanceDate(p => ({ ...p, end_date: e.target.value }))}
                                    className="w-full bg-white border border-purple-100 rounded-xl px-4 py-2.5 outline-none font-bold text-xs text-slate-800"
                                />
                            </div>
                            <button
                                type="submit"
                                // Disabled if loading OR if data exists and dates haven't changed
                                disabled={financeAI.loading || (financeAI.data && financeAI.isUnchanged(financeDate))}
                                className="col-span-2 mt-2 w-full flex items-center justify-center gap-2 py-4 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {financeAI.loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        <span>Generate Finance Summary</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="min-h-[140px] flex-1 bg-white border border-purple-100 rounded-2xl p-6 flex flex-col justify-center">
                            {financeAI.loading ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-purple-600 text-xs font-bold">
                                        <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                                        <span>Generating...</span>
                                    </div>
                                    <div className="h-2.5 bg-purple-50 rounded-full w-3/4 animate-pulse" />
                                    <div className="h-2.5 bg-purple-50 rounded-full w-1/2 animate-pulse" />
                                </div>
                            ) : financeAI.error ? (
                                <div className="flex items-start gap-3 text-red-600">
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <p className="text-xs font-bold">{financeAI.error}</p>
                                </div>
                            ) : financeAI.data ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                        <span className="text-[9px] font-black text-purple-600 uppercase tracking-wider">AI Audit response</span>
                                        <button onClick={() => copyToClipboard(financeAI.data)} className="text-[10px] text-purple-600 hover:underline flex items-center gap-1 font-black uppercase">
                                            <Clipboard size={12} />
                                            <span>Copy</span>
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-650 leading-relaxed font-bold whitespace-pre-wrap">{financeAI.data}</p>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 font-bold italic text-center">
                                    Input a date scope and tap generate to compute cashflow ratios, expense variances, and audits.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* 4. Leadership Report Generator */}
                    <div className="bg-purple-50/40 border border-purple-100 rounded-[2.5rem] p-8 flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/20 shrink-0">
                                <FileText size={22} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Leadership report</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-1.5">
                                    Leadership summary from real Gatherly records
                                </p>
                            </div>
                        </div>

                        {/* Date selection form */}
                        <form 
                            onSubmit={(e) => { 
                                e.preventDefault(); 
                                leadershipAI.generate({ report_type: 'monthly_leadership', ...reportDate }); 
                            }} 
                            className="grid grid-cols-2 gap-3"
                        >
                            <div className="space-y-1">
                                <label className="block text-[9px] font-black text-purple-600 uppercase tracking-wider">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    value={reportDate.start_date}
                                    onChange={(e) => setReportDate(p => ({ ...p, start_date: e.target.value }))}
                                    className="w-full bg-white border border-purple-100 rounded-xl px-4 py-2.5 outline-none font-bold text-xs text-slate-800"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[9px] font-black text-purple-600 uppercase tracking-wider">End Date</label>
                                <input
                                    type="date"
                                    required
                                    value={reportDate.end_date}
                                    onChange={(e) => setReportDate(p => ({ ...p, end_date: e.target.value }))}
                                    className="w-full bg-white border border-purple-100 rounded-xl px-4 py-2.5 outline-none font-bold text-xs text-slate-800"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={leadershipAI.loading || (leadershipAI.data && leadershipAI.isUnchanged({ report_type: 'monthly_leadership', ...reportDate }))}
                                className="col-span-2 mt-2 w-full flex items-center justify-center gap-2 py-4 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {leadershipAI.loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        <span>Compile Leadership Report</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="min-h-[140px] flex-1 bg-white border border-purple-100 rounded-2xl p-6 flex flex-col justify-center">
                            {leadershipAI.loading ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-purple-600 text-xs font-bold">
                                        <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                                        <span>Generating...</span>
                                    </div>
                                    <div className="h-2.5 bg-purple-50 rounded-full w-3/4 animate-pulse" />
                                    <div className="h-2.5 bg-purple-50 rounded-full w-1/2 animate-pulse" />
                                </div>
                            ) : leadershipAI.error ? (
                                <div className="flex items-start gap-3 text-red-600">
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <p className="text-xs font-bold">{leadershipAI.error}</p>
                                </div>
                            ) : leadershipAI.data ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                        <span className="text-[9px] font-black text-purple-600 uppercase tracking-wider">AI Executive statement</span>
                                        <button onClick={() => copyToClipboard(leadershipAI.data)} className="text-[10px] text-purple-600 hover:underline flex items-center gap-1 font-black uppercase">
                                            <Clipboard size={12} />
                                            <span>Copy</span>
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-650 leading-relaxed font-bold whitespace-pre-wrap">{leadershipAI.data}</p>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 font-bold italic text-center">
                                    Generate monthly reports outlining active leader ratios, ministry growths, and analytics.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* 5. Announcement Writer (Full Width layout span) */}
                    <div className="lg:col-span-2 bg-purple-50/40 border border-purple-100 rounded-[2.5rem] p-8 flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/20 shrink-0">
                                <MessageSquare size={22} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Announcement Writer</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-1.5">
                                    Draft clear fellowship announcements
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            {/* Input form */}
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    announcementAI.generate({
                                        purpose: annForm.purpose.trim(),
                                        tone: annForm.tone,
                                        details: annForm.details.trim()
                                    });
                                }} 
                                className="space-y-4"
                            >
                                <div className="space-y-1.5">
                                    <label className="block text-[9px] font-black text-purple-600 uppercase tracking-wider">Announcement Purpose</label>
                                    <input
                                        type="text"
                                        required
                                        value={annForm.purpose}
                                        onChange={(e) => setAnnForm(p => ({ ...p, purpose: e.target.value }))}
                                        placeholder="e.g. Sunday Service Reminder"
                                        className="w-full bg-white border border-purple-100 rounded-xl px-4 py-3 outline-none font-bold text-xs text-slate-800"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[9px] font-black text-purple-600 uppercase tracking-wider">Communication Tone</label>
                                    <select
                                        required
                                        value={annForm.tone}
                                        onChange={(e) => setAnnForm(p => ({ ...p, tone: e.target.value }))}
                                        className="w-full bg-white border border-purple-100 rounded-xl px-4 py-3 outline-none font-bold text-xs text-slate-850 cursor-pointer"
                                    >
                                        <option value="warm">Warm & Encouraging</option>
                                        <option value="formal">Official & Formal</option>
                                        <option value="enthusiastic">Enthusiastic & Vibrant</option>
                                        <option value="urgent">Urgent Roll Check</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[9px] font-black text-purple-600 uppercase tracking-wider">Core Details</label>
                                    <textarea
                                        rows={3}
                                        required
                                        value={annForm.details}
                                        onChange={(e) => setAnnForm(p => ({ ...p, details: e.target.value }))}
                                        placeholder="Service starts 8am, bring your family, special choir presentation..."
                                        className="w-full bg-white border border-purple-100 rounded-xl p-4 outline-none font-bold text-xs text-slate-800 resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={announcementAI.loading || (announcementAI.data && announcementAI.isUnchanged({ purpose: annForm.purpose.trim(), tone: annForm.tone, details: annForm.details.trim() }))}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {announcementAI.loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={14} />
                                            <span>Draft Announcement</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Output Block */}
                            <div className="bg-white border border-purple-100 rounded-2xl p-6 min-h-[220px] flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                        <span className="text-[9px] font-black text-purple-600 uppercase tracking-wider">Draft Copywriting</span>
                                        {announcementAI.data && (
                                            <button onClick={() => copyToClipboard(announcementAI.data)} className="text-[10px] text-purple-600 hover:underline flex items-center gap-1 font-black uppercase">
                                                <Clipboard size={12} />
                                                <span>Copy Message</span>
                                            </button>
                                        )}
                                    </div>

                                    {announcementAI.loading ? (
                                        <div className="space-y-3 py-6">
                                            <div className="flex items-center gap-3 text-purple-600 text-xs font-bold">
                                                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                                                <span>Drafting announcement copy...</span>
                                            </div>
                                            <div className="h-2.5 bg-purple-50 rounded-full w-full animate-pulse" />
                                            <div className="h-2.5 bg-purple-50 rounded-full w-5/6 animate-pulse" />
                                            <div className="h-2.5 bg-purple-50 rounded-full w-2/3 animate-pulse" />
                                        </div>
                                    ) : announcementAI.error ? (
                                        <div className="flex items-start gap-3 text-red-600">
                                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                            <p className="text-xs font-bold">{announcementAI.error}</p>
                                        </div>
                                    ) : announcementAI.data ? (
                                        <p className="text-xs text-slate-650 leading-relaxed font-bold whitespace-pre-wrap">{announcementAI.data}</p>
                                    ) : (
                                        <p className="text-xs text-slate-400 font-bold italic py-8 text-center">
                                            Your drafted message will be rendered here.
                                        </p>
                                    )}
                                </div>

                                {copySuccess && (
                                    <div className="mt-3 text-center text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl animate-in fade-in">
                                        {copySuccess}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
};

export default IntelligenceCenter;