import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckSquare, Plus, Search, Calendar, ArrowRight, Loader2, Check, X,
    AlertCircle, Sparkles, TrendingUp, Users, CalendarDays, CheckCircle2, Tag, Lock
} from 'lucide-react';
import { AttendanceService, MemberService } from '../api/services';
import { normalizeArrayResponse, normalizeObjectResponse, entityValue } from '../utils/apiResponse';
import { ConfirmModal } from '../components/ui/Modal';

const normalizeMembers = (response) => normalizeArrayResponse(response, ['members', 'items']).map((member) => ({
    ...member,
    value: String(entityValue(member, ['member_id', 'user_id', 'id'])), // Force string for safe matching
    name: member.name || [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email || 'Unnamed Member'
}));

const normalizeSessions = (response) => normalizeArrayResponse(response, ['sessions', 'attendance', 'items']).map((session) => ({
    ...session,
    value: String(entityValue(session, ['session_id', 'attendance_session_id', 'id'])),
    name: session.name || session.title || 'Attendance Session'
}));

const fmtDate = (dString) => {
    if (!dString) return '';
    try {
        const safeDateString = dString.includes('T') ? dString : dString.replace(/-/g, '/');
        return new Date(safeDateString).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        });
    } catch {
        return dString;
    }
};

const friendlyError = (err) => err?.response?.data?.message || err?.message || 'Something went wrong';

const Attendance = () => {
    // Core data states
    const [sessions, setSessions] = useState([]);
    const [members, setMembers] = useState([]);
    const [summary, setSummary] = useState({ present_rate: 0, total_sessions: 0, active_members: 0 });
    
    // Loading & error
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');

    // Active session roll call states
    const [selectedSession, setSelectedSession] = useState(null);
    const [rollCall, setRollCall] = useState({}); 
    const [searchQuery, setSearchQuery] = useState('');
    const [submittingMark, setSubmittingMark] = useState(false);
    
    // NEW: Lock state for previously submitted sessions
    const [isSessionLocked, setIsSessionLocked] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    // Member search/history state
    const [searchMemberQuery, setSearchMemberQuery] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberHistory, setMemberHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Create session states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '', date: new Date().toISOString().split('T')[0], description: '', type: 'service'
    });
    const [creatingSession, setCreatingSession] = useState(false);

    const fetchAttendanceData = useCallback(async () => {
        setLoading(true);
        setApiError('');
        try {
            const [sessData, memsData, sumData] = await Promise.all([
                AttendanceService.getAll().catch(() => []),
                MemberService.getAll().catch(() => []),
                AttendanceService.getSummary().catch(() => null)
            ]);

            const sList = normalizeSessions(sessData);
            setSessions(sList);

            const mList = normalizeMembers(memsData);
            setMembers(mList);

            const sStats = normalizeObjectResponse(sumData, ['summary']);
            setSummary({
                present_rate: sStats.present_rate ?? sStats.attendance_rate ?? 0,
                total_sessions: sStats.total_sessions ?? sList.length ?? 0,
                active_members: sStats.active_members ?? mList.length ?? 0
            });
        } catch (err) {
            console.error('Error fetching attendance data', err);
            setApiError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAttendanceData();
    }, [fetchAttendanceData]);

    const handleSelectSession = async (sess) => {
        setSelectedSession(sess);
        setSelectedMember(null);
        setSearchQuery('');
        setIsSessionLocked(false); 
        
        setLoading(true);
        try {
            const details = await AttendanceService.getSession(sess.value);
            const recordsList = normalizeArrayResponse(details, ['records', 'attendance', 'items']);
            
            const map = {};
            // 1. Initialize everyone as absent
            members.forEach(m => { map[String(m.value)] = 'absent'; });
            
            let hasRecords = false;

            // 2. Safely apply backend statuses if they exist
            if (recordsList && recordsList.length > 0) {
                hasRecords = true;
                recordsList.forEach(rec => {
                    const memberKey = String(rec.member_id || rec.user_id || rec.member?.id || rec.id);
                    if (map[memberKey] !== undefined) {
                        map[memberKey] = String(rec.status || 'present').toLowerCase();
                    } else {
                        // Fallback mapping if backend returned IDs not in the current members list
                        map[memberKey] = String(rec.status || 'present').toLowerCase();
                    }
                });
            }
            
            setRollCall(map);

            // 3. Lock the session if it has records OR if the backend explicitly flagged it as completed
            const explicitlyCompleted = sess.status === 'completed' || sess.is_completed || sess.is_locked;
            setIsSessionLocked(hasRecords || explicitlyCompleted);

        } catch (err) {
            console.warn('Session has no formal records yet. Starting fresh checklist sheet.', err);
            const map = {};
            members.forEach(m => { map[String(m.value)] = 'absent'; });
            setRollCall(map);
            setIsSessionLocked(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSetStatus = (memberId, status) => {
        if (isSessionLocked) return; // Defensive guard
        setRollCall(prev => ({
            ...prev,
            [String(memberId)]: status
        }));
    };

    const filteredRollCallMembers = useMemo(() => {
        if (!searchQuery) return members;
        const lower = searchQuery.toLowerCase();
        return members.filter(m =>
            m.name?.toLowerCase().includes(lower) ||
            m.email?.toLowerCase().includes(lower)
        );
    }, [members, searchQuery]);

    const filteredHistoryMembers = useMemo(() => {
        if (!searchMemberQuery) return members;
        const lower = searchMemberQuery.toLowerCase();
        return members.filter(m =>
            m.name?.toLowerCase().includes(lower) ||
            m.email?.toLowerCase().includes(lower)
        );
    }, [members, searchMemberQuery]);

    const handleBulkMark = (status) => {
        if (isSessionLocked) return;
        setRollCall(prev => {
            const next = { ...prev };
            filteredRollCallMembers.forEach(m => {
                next[String(m.value)] = status;
            });
            return next;
        });
        setActionSuccess(`Bulk marked filtered members as ${status}!`);
        setTimeout(() => setActionSuccess(''), 2000);
    };

    const handleSaveRollCall = () => {
        if (isSessionLocked) return;
        setConfirmModal({
            isOpen: true,
            title: 'Submit Roll Call?',
            message: 'Submit this attendance sheet to Gatherly ledger? This action cannot be undone.',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setSubmittingMark(true);
                setApiError('');
                try {
                    const records = Object.keys(rollCall).map(mId => ({
                        member_id: mId,
                        status: rollCall[mId]
                    }));

                    const payload = {
                        session_id: selectedSession.value,
                        records
                    };

                    await AttendanceService.mark(payload);
                    setActionSuccess('Attendance roll call saved successfully!');
                    setTimeout(() => {
                        setActionSuccess('');
                        setSelectedSession(null);
                        fetchAttendanceData();
                    }, 1200);
                } catch (err) {
                    setApiError(friendlyError(err));
                } finally {
                    setSubmittingMark(false);
                }
            }
        });
    };

    const handleCreateSessionSubmit = async (e) => {
        e.preventDefault();
        setCreatingSession(true);
        setApiError('');
        try {
            const payload = {
                title: createForm.name.trim(),
                session_date: createForm.date,
                type: createForm.type,
                description: createForm.description.trim()
            };

            await AttendanceService.createSession(payload);
            setActionSuccess('Attendance Session Created!');
            setTimeout(() => {
                setActionSuccess('');
                setIsCreateOpen(false);
                setCreateForm({ name: '', date: new Date().toISOString().split('T')[0], description: '', type: 'service' });
                fetchAttendanceData();
            }, 1200);
        } catch (err) {
            setApiError(friendlyError(err));
        } finally {
            setCreatingSession(false);
        }
    };

    const handleSelectMemberHistory = async (member) => {
        setSelectedMember(member);
        setSelectedSession(null); 
        setLoadingHistory(true);
        setMemberHistory([]);
        try {
            const res = await AttendanceService.getMemberHistory(member.value);
            setMemberHistory(normalizeArrayResponse(res, ['history', 'records', 'items']));
        } catch (err) {
            console.warn('No historical logs returned for this member.', err);
            setMemberHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Attendance Ledger</h1>
                        <p className="text-sm text-slate-500 mt-3 font-medium max-w-md leading-relaxed">
                            Take roll calls swiftly. Track attendance analytics across all fellowship events and ministry units.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="btn-secondary self-start md:self-auto"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Start New Session</span>
                    </button>
                </div>

                {/* API Error Notification */}
                {apiError && !loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 bg-red-50 border border-red-100 text-red-600 p-6 rounded-3xl">
                        <AlertCircle size={22} className="shrink-0" />
                        <div>
                            <p className="font-bold text-sm">Failed to sync data</p>
                            <p className="text-xs mt-1 opacity-80">{apiError}</p>
                        </div>
                        <button onClick={fetchAttendanceData} className="ml-auto text-xs font-black uppercase tracking-widest underline shrink-0">Retry</button>
                    </motion.div>
                )}

                {/* Summary Cards */}
                <section>
                    {sessions.length === 0 && summary.total_sessions === 0 ? (
                        <div className="bg-white border border-slate-100 p-12 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100">
                                <CalendarDays size={32} />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-slate-900 tracking-tight">No attendance recorded yet.</h3>
                                <p className="text-sm text-slate-500 font-medium mt-1">Create your first attendance session to start tracking metrics.</p>
                            </div>
                            <button onClick={() => setIsCreateOpen(true)} className="mt-4 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                                <Plus size={14} /><span>Start Session</span>
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Attendance Rate</span>
                                    <p className="font-mono text-3xl font-black text-slate-900 mt-3">{summary.present_rate}%</p>
                                </div>
                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                                    <TrendingUp size={28} />
                                </div>
                            </div>
                            <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Total Sessions</span>
                                    <p className="font-mono text-3xl font-black text-slate-900 mt-3">{summary.total_sessions}</p>
                                </div>
                                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-primary border border-blue-100">
                                    <CalendarDays size={28} />
                                </div>
                            </div>
                            <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Active Members</span>
                                    <p className="font-mono text-3xl font-black text-slate-900 mt-3">{summary.active_members}</p>
                                </div>
                                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-accent border border-amber-100">
                                    <Users size={28} />
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Master Layout Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Panel: Sessions List */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-6 sm:p-8">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-primary shadow-lg shadow-blue-900/5">
                                    <CheckSquare size={28} />
                                </div>
                                <div>
                                    <h3 className="font-black text-2xl text-slate-900 tracking-tighter uppercase leading-none">Sessions</h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Active Registers</p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="py-16 flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    <p className="text-sm font-bold text-slate-400">Syncing registers list…</p>
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="py-16 flex flex-col items-center text-center max-w-xs mx-auto space-y-5">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                                        <CheckSquare size={32} className="text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 font-black text-sm">No roll call sessions yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {sessions.map((sess) => {
                                        // Quick visual cue if this session is already "completed/locked" from backend status
                                        const isCompleted = sess.status === 'completed' || sess.is_completed || sess.is_locked;
                                        return (
                                            <div
                                                key={sess.value || sess.id}
                                                onClick={() => handleSelectSession(sess)}
                                                className={`p-5 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:shadow-md transition-all space-y-2.5 ${
                                                    selectedSession?.value === sess.value ? 'ring-2 ring-primary/20 bg-slate-50 border-slate-350' : ''
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <h4 className="font-black text-sm text-slate-900 leading-snug">{sess.name}</h4>
                                                    {isCompleted && <Lock size={12} className="text-slate-300 mt-0.5" />}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                                                    <Calendar size={12} />
                                                    <span>{fmtDate(sess.session_date)}</span>
                                                </div>
                                                {sess.description && (
                                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-1">{sess.description}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Attendance Workspace */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 sm:p-8 space-y-6">
                            {actionSuccess && (
                                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-2xl text-xs font-bold animate-in fade-in">
                                    <CheckCircle2 size={16} />
                                    <span>{actionSuccess}</span>
                                </div>
                            )}

                            {selectedSession ? (
                                // Roll Call Sheet workspace
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    {/* Workspace Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-primary uppercase tracking-widest">Active Roll Call Sheet</span>
                                                {isSessionLocked && (
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                                        <Lock size={8} /> Read Only
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-black text-2xl text-slate-900 tracking-tight mt-1">{selectedSession.name}</h3>
                                            <p className="text-xs text-slate-400 mt-1 font-bold">{fmtDate(selectedSession.date)}</p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedSession(null)}
                                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                                        >
                                            <X size={14} /><span>Close Board</span>
                                        </button>
                                    </div>

                                    {/* Action Toolbars */}
                                    <div className="flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between">
                                        <div className="relative flex-1 min-w-0">
                                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search members roll call list..."
                                                className="w-full bg-slate-50 border border-slate-150 focus:border-primary focus:bg-white rounded-xl pl-11 pr-5 py-3 outline-none font-bold text-xs text-slate-800 transition-all"
                                            />
                                        </div>

                                        {!isSessionLocked && (
                                            <div className="flex gap-2 w-full xl:w-auto shrink-0">
                                                <button onClick={() => handleBulkMark('present')} className="flex-1 xl:flex-none px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5">
                                                    <Check size={14} /><span>All Present</span>
                                                </button>
                                                <button onClick={() => handleBulkMark('absent')} className="flex-1 xl:flex-none px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5">
                                                    <X size={14} /><span>All Absent</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Roll call grid */}
                                    <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                        {filteredRollCallMembers.length === 0 ? (
                                            <div className="py-16 text-center text-slate-400 text-xs font-bold">
                                                No members found matching your search.
                                            </div>
                                        ) : (
                                            filteredRollCallMembers.map((m) => {
                                                const currentStatus = rollCall[String(m.value)] || 'absent';
                                                return (
                                                    <div key={m.value || m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl gap-4 hover:shadow-sm transition-all">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-150 flex items-center justify-center text-primary font-black text-sm shrink-0">
                                                                {m.name?.[0]}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-black text-slate-800 leading-none truncate">{m.name}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold mt-1.5 truncate">{m.email}</p>
                                                            </div>
                                                        </div>

                                                        {isSessionLocked ? (
                                                            // Read-Only Badges
                                                            <span className={`shrink-0 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border ${
                                                                currentStatus === 'present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                currentStatus === 'absent' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                'bg-amber-50 text-amber-600 border-amber-100'
                                                            }`}>
                                                                {currentStatus}
                                                            </span>
                                                        ) : (
                                                            // Interactive Buttons
                                                            <div className="flex gap-1.5 shrink-0">
                                                                <button onClick={() => handleSetStatus(m.value, 'present')} className={`px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 flex-1 sm:flex-none border ${currentStatus === 'present' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/10' : 'bg-white hover:bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                                    {currentStatus === 'present' && <Check size={10} />}<span>Present</span>
                                                                </button>
                                                                <button onClick={() => handleSetStatus(m.value, 'absent')} className={`px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 flex-1 sm:flex-none border ${currentStatus === 'absent' ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/10' : 'bg-white hover:bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                                    {currentStatus === 'absent' && <Check size={10} />}<span>Absent</span>
                                                                </button>
                                                                <button onClick={() => handleSetStatus(m.value, 'excused')} className={`px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 flex-1 sm:flex-none border ${currentStatus === 'excused' ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/10' : 'bg-white hover:bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                                    {currentStatus === 'excused' && <Check size={10} />}<span>Excused</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Action Footer */}
                                    {isSessionLocked ? (
                                        <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-slate-50 border border-slate-100 text-slate-500 rounded-[2rem] gap-4">
                                            <div className="text-center sm:text-left flex flex-col sm:flex-row items-center gap-3">
                                                <Lock size={20} className="text-slate-400" />
                                                <div>
                                                    <h4 className="font-black text-sm uppercase tracking-wide text-slate-700">Session Locked</h4>
                                                    <p className="text-[10px] text-slate-400 mt-1 font-bold">Attendance for this session has been submitted and cannot be edited.</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedSession(null)}
                                                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                            >
                                                Close Board
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-slate-900 text-white rounded-[2rem] gap-4">
                                            <div className="text-center sm:text-left">
                                                <h4 className="font-black text-sm uppercase tracking-wide">Submit Roll Call Ledger</h4>
                                                <p className="text-[10px] text-slate-400 mt-1 font-bold">Registers are synced with fellowship analytics logs</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleSaveRollCall}
                                                disabled={submittingMark}
                                                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 hover:bg-slate-50 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                            >
                                                {submittingMark ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <CheckCircle2 size={14} />}
                                                <span>Save Roll Call</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : selectedMember ? (
                                // Member history inspection view
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-primary font-black text-lg shrink-0">
                                                {selectedMember.name?.[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Attendance Timeline</span>
                                                <h3 className="font-black text-xl text-slate-900 tracking-tight mt-1 truncate">{selectedMember.name}</h3>
                                                <p className="text-[10px] text-slate-400 font-bold mt-1.5 truncate">{selectedMember.email}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedMember(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                                            <X size={14} /><span>Close Log</span>
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged Sessions History</span>
                                        {loadingHistory ? (
                                            <div className="py-8 flex items-center gap-2 text-xs text-slate-400 font-bold justify-center">
                                                <Loader2 className="w-4 h-4 animate-spin text-primary" /><span>Syncing ledger audits…</span>
                                            </div>
                                        ) : memberHistory.length === 0 ? (
                                            <div className="py-16 text-center text-slate-400 text-xs font-bold border border-dashed border-slate-150 rounded-2xl">
                                                No attendance logs on file for this member.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {memberHistory.map((h, idx) => {
                                                    const s = h.status?.toLowerCase() || 'present';
                                                    let badgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                                                    if (s === 'absent') badgeColor = 'bg-rose-50 text-rose-600 border-rose-100';
                                                    else if (s === 'excused') badgeColor = 'bg-amber-50 text-amber-600 border-amber-100';

                                                    return (
                                                        <div key={idx} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50">
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-black text-slate-800">{h.session_name || h.name || 'Fellowship Gathering'}</p>
                                                                <p className="text-[9px] text-slate-400 font-bold">{fmtDate(h.date || h.timestamp)}</p>
                                                            </div>
                                                            <span className={`px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-md ${badgeColor}`}>
                                                                {s}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // Default landing workspace
                                <div className="space-y-6">
                                    <div className="pb-6 border-b border-slate-100">
                                        <h3 className="font-black text-2xl text-slate-900 tracking-tight leading-none">Attendance Log Finder</h3>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3">Select active register session or inspect member history below</p>
                                    </div>

                                    <div className="relative">
                                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={searchMemberQuery}
                                            onChange={(e) => setSearchMemberQuery(e.target.value)}
                                            placeholder="Search members list to verify roll history..."
                                            className="w-full bg-slate-50 border border-slate-150 focus:border-primary focus:bg-white rounded-xl pl-11 pr-5 py-3.5 outline-none font-bold text-xs text-slate-800 transition-all animate-none"
                                        />
                                    </div>

                                    <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                                        {members.length === 0 ? (
                                            <div className="py-16 text-center text-slate-400 text-xs font-bold">
                                                No members list imported yet.
                                            </div>
                                        ) : filteredHistoryMembers.length === 0 ? (
                                            <div className="py-16 text-center text-slate-400 text-xs font-bold">
                                                No members found matching your search.
                                            </div>
                                        ) : (
                                            filteredHistoryMembers.map((m) => (
                                                <div
                                                    key={m.value || m.id}
                                                    onClick={() => handleSelectMemberHistory(m)}
                                                    className="flex items-center justify-between p-4 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-2xl cursor-pointer transition-all gap-4"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary font-black text-sm shrink-0">
                                                            {m.name?.[0]}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-black text-slate-800 leading-none truncate">{m.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold mt-1.5 truncate">{m.email}</p>
                                                        </div>
                                                    </div>
                                                    <ArrowRight size={14} className="text-slate-400 shrink-0" />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Session Form Modal */}
            <AnimatePresence>
                {isCreateOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                            <div className="flex items-center justify-between p-8 border-b border-slate-100 shrink-0 bg-slate-50/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20"><CheckSquare size={20} /></div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Create Session</h2>
                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Create a roll call session</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
                            </div>

                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                                {actionSuccess ? (
                                    <div className="flex flex-col items-center gap-4 py-8 text-center animate-in fade-in">
                                        <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-secondary border border-emerald-100"><CheckCircle2 size={32} /></div>
                                        <h3 className="text-xl font-black text-slate-900">{actionSuccess}</h3>
                                        <p className="text-sm text-slate-500 font-medium">Refreshing attendance sessions...</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleCreateSessionSubmit} className="space-y-6">
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Session Title <span className="text-rose-400">*</span></label>
                                            <input type="text" required value={createForm.name} onChange={(e) => setCreateForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Midweek Cell Fellowship" className="input-field h-12 text-sm font-bold animate-none" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Session Date <span className="text-rose-400">*</span></label>
                                            <input type="date" required value={createForm.date} onChange={(e) => setCreateForm(p => ({ ...p, date: e.target.value }))} className="input-field h-12 text-sm font-bold animate-none" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Session Type <span className="text-rose-400">*</span></label>
                                            <div className="relative group">
                                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors w-4 h-4" />
                                                <select value={createForm.type} onChange={(e) => setCreateForm(p => ({ ...p, type: e.target.value }))} className="input-field pl-11 h-12 text-sm">
                                                    <option value="service">Service</option>
                                                    <option value="Special Event">Special Event</option>
                                                    <option value="outreach">Outreach</option>
                                                    <option value="meeting">Meeting</option>
                                                    <option value="conference">Conference</option>
                                                    <option value="retreat">Retreat</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                                            <textarea rows={2} value={createForm.description} onChange={(e) => setCreateForm(p => ({ ...p, description: e.target.value }))} placeholder="Enter optional description or cell group note..." className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white rounded-2xl p-4 outline-none font-bold text-sm text-slate-800 transition-all placeholder:text-slate-300 resize-none" />
                                        </div>
                                        <button type="submit" disabled={creatingSession} className="w-full btn-secondary py-4 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                            {creatingSession ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check size={14} /><span>Create Session</span></>}
                                        </button>
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
        </Layout>
    );
};

export default Attendance;