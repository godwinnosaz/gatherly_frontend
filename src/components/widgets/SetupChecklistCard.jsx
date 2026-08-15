import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  MemberService, 
  DepartmentService, 
  FinanceAccountsService, 
  FinanceService, 
  AttendanceService 
} from '../../api/services';
import { 
  CheckCircle2, Circle, ArrowRight, Play, X, AlertCircle, RefreshCw, Loader2, Landmark, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeArrayResponse, normalizeObjectResponse } from '../../utils/apiResponse';

const SetupChecklistCard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dismissed, setDismissed] = useState(false);
    
    // Checklist items state
    const [checklist, setChecklist] = useState({
        profile: false,
        member: false,
        dept: false,
        account: false,
        leader: false,
        transaction: false,
        session: false
    });

    const fetchProgress = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const results = await Promise.allSettled([
                MemberService.getAll(),
                DepartmentService.getAll(),
                FinanceAccountsService.getAll(),
                FinanceService.getSummary(),
                AttendanceService.getAll()
            ]);

            // Parse response safely, handling unwrapped Axios intercepts
            const membersRes = results[0].status === 'fulfilled' ? results[0].value : null;
            const deptsRes = results[1].status === 'fulfilled' ? results[1].value : null;
            const accountsRes = results[2].status === 'fulfilled' ? results[2].value : null;
            const financeRes = results[3].status === 'fulfilled' ? results[3].value : null;
            const attendanceRes = results[4].status === 'fulfilled' ? results[4].value : null;

            // 1. Members and Leaders
            const membersList = normalizeArrayResponse(membersRes, ['members', 'items']);
            const hasMembers = Array.isArray(membersList) && membersList.length > 0;
            const hasLeaders = Array.isArray(membersList) && membersList.some(m => m.role && m.role !== 'member');

            // 2. Departments / Units
            const deptsList = normalizeArrayResponse(deptsRes, ['departments', 'items']);
            const hasDepts = Array.isArray(deptsList) && deptsList.length > 0;

            // 3. Finance Accounts
            const accountsList = normalizeArrayResponse(accountsRes, ['accounts', 'items']);
            const hasAccounts = Array.isArray(accountsList) && accountsList.length > 0;

            // 4. Record first transaction
            const financeSummary = normalizeObjectResponse(financeRes, ['summary']);
            const balance = financeSummary?.balance || financeSummary?.net_fund || 0;
            const income = financeSummary?.income || financeSummary?.total_income || 0;
            const expense = financeSummary?.expense || financeSummary?.total_expense || 0;
            const hasTransactions = income > 0 || expense > 0 || balance !== 0;

            // 5. Attendance Sessions
            const sessionsList = normalizeArrayResponse(attendanceRes, ['sessions', 'attendance', 'items']);
            const hasSessions = Array.isArray(sessionsList) && sessionsList.length > 0;

            // 6. Organization Profile Completion
            const org = user?.organization || user?.tenant;
            const hasProfile = !!(org?.location || org?.phone || org?.logo || org?.contact_email || org?.email);

            setChecklist({
                profile: hasProfile,
                member: hasMembers,
                dept: hasDepts,
                account: hasAccounts,
                leader: hasLeaders,
                transaction: hasTransactions,
                session: hasSessions
            });

            // We show a mild notice only if all endpoints are fully offline
            const rejectedCount = results.filter(r => r.status === 'rejected').length;
            if (rejectedCount === results.length) {
                setError("Setup progress temporarily offline.");
            }
        } catch (e) {
            console.error('Error calculating setup progress:', e);
            setError("Setup progress temporarily offline.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        // Load dismiss status
        const isDismissed = localStorage.getItem('gatherly_checklist_dismissed') === 'true';
        setDismissed(isDismissed);

        if (user) {
            fetchProgress();
        }
    }, [user, fetchProgress]);

    const handleDismiss = () => {
        localStorage.setItem('gatherly_checklist_dismissed', 'true');
        setDismissed(true);
    };

    if (dismissed) return null;

    // Build the checklist items array with labels, status, and navigation targets
    const items = [
        {
            key: 'profile',
            title: 'Complete Organization Profile',
            description: 'Add your location, phone, or brand logo settings.',
            link: '/dashboard/settings',
            completed: checklist.profile
        },
        {
            key: 'member',
            title: 'Add First Member',
            description: 'Register a fellowship member to start managing records.',
            link: '/dashboard/members',
            completed: checklist.member
        },
        {
            key: 'dept',
            title: 'Create First Unit or Department',
            description: 'Set up departments like Choir, Ushering, or Youth.',
            link: '/dashboard/units',
            completed: checklist.dept
        },
        {
            key: 'account',
            title: 'Create Finance Account',
            description: 'Add an account like Main Ledger or Sunday Offering.',
            link: '/dashboard/finance',
            completed: checklist.account
        },
        {
            key: 'leader',
            title: 'Invite Leaders & Assign Roles',
            description: 'Grant other leaders pastor or fellowship admin roles.',
            link: '/dashboard/members',
            completed: checklist.leader
        },
        {
            key: 'transaction',
            title: 'Record First Transaction',
            description: 'Post your first ledger income or expense record.',
            link: '/dashboard/finance',
            completed: checklist.transaction
        },
        {
            key: 'session',
            title: 'Create First Attendance Session',
            description: 'Log and track attendance for a service or meeting.',
            link: '/dashboard/attendance',
            completed: checklist.session
        }
    ];

    const completedCount = items.filter(item => item.completed).length;
    const totalCount = items.length;
    const percentComplete = Math.round((completedCount / totalCount) * 100);

    // If completely completed, don't show the setup checklist card
    if (!loading && !error && completedCount === totalCount) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8 md:p-10 relative overflow-hidden"
            >
                {/* Dismiss Button */}
                <button 
                    onClick={handleDismiss}
                    className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                    title="Dismiss setup progress checklist"
                >
                    <X size={18} />
                </button>

                <div className="flex flex-col lg:flex-row gap-8 justify-between relative z-10">
                    {/* Header Details */}
                    <div className="space-y-4 max-w-xl">
                        <div className="flex items-center gap-2 bg-[#1E3A8A]/10 text-[#1E3A8A] px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest self-start w-fit">
                            <Sparkles size={14} className="animate-pulse" />
                            Guided Onboarding Optional
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Let's Get Started!</h2>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">
                            Welcome to Gatherly! Complete these quick milestones to configure your fellowship center. Customize at your own pace from inside each module without interrupting daily operations.
                        </p>

                        {/* Guided setup launcher button */}
                        <div className="flex items-center gap-4 pt-2">
                            <Link 
                                to="/setup" 
                                className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-blue-900 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md shadow-blue-900/10 hover:shadow-lg"
                            >
                                <Play size={14} className="fill-white" />
                                Launch Setup Wizard
                            </Link>
                            <button 
                                onClick={handleDismiss} 
                                className="text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-[0.2em]"
                            >
                                Dismiss Checklist
                            </button>
                        </div>
                    </div>

                    {/* Progress details */}
                    <div className="w-full lg:w-96 bg-slate-50/50 border border-slate-100 p-6 rounded-3xl shrink-0 flex flex-col justify-between space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Setup Progress</span>
                                <span className="text-xs font-black text-[#1E3A8A] bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    {completedCount} of {totalCount} Done
                                </span>
                            </div>
                            
                            {/* Premium Progress Bar */}
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                <div 
                                    className="h-full bg-gradient-to-r from-[#1E3A8A] to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${percentComplete}%` }}
                                />
                            </div>
                        </div>

                        {error ? (
                            <div className="bg-amber-50 border border-amber-100 text-amber-800 p-3 rounded-2xl text-xs font-medium flex items-center gap-2">
                                <AlertCircle size={14} className="text-amber-600 shrink-0" />
                                <span>{error}</span>
                                <button 
                                    onClick={fetchProgress} 
                                    className="ml-auto text-amber-600 hover:text-amber-800"
                                    title="Reload progress status"
                                >
                                    <RefreshCw size={12} className="animate-spin-slow" />
                                </button>
                            </div>
                        ) : loading ? (
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium py-1">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                <span>Loading setup details...</span>
                            </div>
                        ) : (
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest text-center mt-1">
                                {percentComplete === 100 ? '🎉 All Set Up!' : `${percentComplete}% completed`}
                            </div>
                        )}
                    </div>
                </div>

                {/* Checklist grid list */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-100">
                    {items.map((item) => (
                        <div 
                            key={item.key} 
                            className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-3 ${
                                item.completed 
                                    ? 'bg-emerald-50/20 border-emerald-100/50 hover:bg-emerald-50/40' 
                                    : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm shadow-slate-100/50'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                {item.completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                ) : (
                                    <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5 hover:text-primary transition-colors cursor-pointer" />
                                )}
                                <div className="space-y-0.5">
                                    <h4 className={`text-xs font-black tracking-tight ${item.completed ? 'text-emerald-900 line-through' : 'text-slate-800'}`}>
                                        {item.title}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                            
                            {!item.completed && (
                                <Link 
                                    to={item.link}
                                    className="flex items-center gap-1 text-[9px] font-black text-[#1E3A8A] hover:text-blue-900 uppercase tracking-widest self-end mt-2 transition-all hover:translate-x-0.5"
                                >
                                    <span>Set Up</span>
                                    <ArrowRight size={10} />
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SetupChecklistCard;
