import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Calendar, MessageSquare, Info, Loader2, AlertCircle } from 'lucide-react';
import { NotificationService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { normalizeArrayResponse, entityValue } from '../../utils/apiResponse';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const friendlyError = (err) => {
    if (!err) return 'Could not load notifications.';
    if (err.type === 'cors_or_network') return 'Cannot reach server.';
    if (err.type === 'unauthenticated') return 'Session expired. Please log in again.';
    return err.message || 'Could not load notifications.';
};

const getIcon = (type) => {
    switch (type) {
        case 'event':    return <Calendar    size={14} className="text-emerald-500" />;
        case 'reminder': return <MessageSquare size={14} className="text-amber-500" />;
        default:         return <Info        size={14} className="text-indigo-500" />;
    }
};

const normalizeNotifications = (response) => normalizeArrayResponse(response, ['notifications', 'items']).map((notification) => ({
    ...notification,
    value: entityValue(notification, ['notification_id', 'id']),
    is_read: Boolean(notification.is_read ?? notification.read),
    title: notification.title || notification.type || 'Notification',
    message: notification.message || notification.body || notification.content || ''
}));

// ─── NotificationCenter ───────────────────────────────────────────────────────
const NotificationCenter = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen]             = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount]   = useState(0);
    const [loading, setLoading]           = useState(false);
    const [failedToLoad, setFailedToLoad] = useState(false);
    const [error, setError]               = useState('');
    const [markingAll, setMarkingAll]     = useState(false);

    // Track fail count in ref to persist across background polls without triggering re-renders
    const failCountRef = useRef(0);

    // ── GET /notifications ─────────────────────────────────────────────────────
    const fetchNotifications = useCallback(async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const response = await NotificationService.getAll();
            const list = normalizeNotifications(response);

            setNotifications(list);
            setUnreadCount(
                typeof response?.unreadCount === 'number'
                    ? response.unreadCount
                    : typeof response?.unread_count === 'number'
                        ? response.unread_count
                        : list.filter((n) => !n.is_read).length
            );
            
            setFailedToLoad(false);
            setError('');
            failCountRef.current = 0; // Reset backoff counter on success
            return true;
        } catch (err) {
            if (import.meta.env.DEV) {
                console.warn('[NotificationCenter] Polling warning:', err.message);
            }
            setFailedToLoad(true);
            setError(friendlyError(err));
            return false;
        } finally {
            if (!isBackground) setLoading(false);
        }
    }, []);

    // ── Smart Polling Logic ─────────────────────────────────────────────────────
    useEffect(() => {
        // Stop polling completely if there is no logged in user
        if (!user) return;

        let timeoutId;
        
        const scheduleNextPoll = (success) => {
            if (!success) {
                failCountRef.current += 1;
            }

            // Exponential backoff logic based on fail count
            let nextWaitMs = 60000; // Default 60s
            if (failCountRef.current === 1) nextWaitMs = 60000;
            else if (failCountRef.current === 2) nextWaitMs = 120000; // 2 min
            else if (failCountRef.current >= 3) nextWaitMs = 300000;  // 5 min max

            timeoutId = setTimeout(poll, nextWaitMs);
        };

        const poll = async () => {
            // Only poll if tab is visible and token exists
            const hasToken = localStorage.getItem('token') || localStorage.getItem('gatherly_token');
            if (document.visibilityState === 'visible' && hasToken) {
                const success = await fetchNotifications(true);
                scheduleNextPoll(success);
            } else {
                // If hidden or no token, skip this cycle but schedule the next check for 60s later
                timeoutId = setTimeout(poll, 60000);
            }
        };

        // Initial fetch on mount
        fetchNotifications(false).then(scheduleNextPoll);

        // Visibility change listener to immediately fetch if user returns after a long break
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user) {
                clearTimeout(timeoutId);
                fetchNotifications(true).then(scheduleNextPoll);
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user, fetchNotifications]);

    // ── POST /notifications/readAll ────────────────────────────────────────────
    const markAllRead = async () => {
        setMarkingAll(true);
        try {
            await NotificationService.markAllRead();
            await fetchNotifications(true);
        } catch (err) {
            if (import.meta.env.DEV) {
                console.warn('Error marking all as read', err);
            }
        } finally {
            setMarkingAll(false);
        }
    };

    return (
        <div className="relative flex items-center">
            {/* Bell button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center border border-slate-200 hover:border-primary/50 hover:shadow-lg transition-all"
                aria-label="Open notifications"
            >
                <Bell size={22} className="text-slate-500 shrink-0" />
            </button>
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm pointer-events-none select-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div className="fixed inset-0 z-[210] bg-slate-900/10 backdrop-blur-sm sm:backdrop-blur-none sm:bg-transparent transition-all" onClick={() => setIsOpen(false)} />

                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-20 sm:top-auto mt-2 sm:mt-4 w-auto sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[220] origin-top-right flex flex-col max-h-[85vh]"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-slate-900">Notifications</h3>
                                    {loading && (
                                        <Loader2 size={14} className="text-slate-400 animate-spin" />
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {unreadCount > 0 && !markingAll && (
                                        <button
                                            onClick={markAllRead}
                                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider transition-colors"
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                    {markingAll && (
                                        <Loader2 size={14} className="text-indigo-400 animate-spin" />
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-slate-200 rounded-full transition-all"
                                    >
                                        <X size={16} className="text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="overflow-y-auto flex-1">
                                {/* Loading state */}
                                {loading && notifications.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center gap-3 text-center">
                                        <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                                        <p className="text-xs text-slate-400 font-medium">Loading notifications…</p>
                                    </div>
                                ) : failedToLoad && notifications.length === 0 ? (
                                    /* Error state - only show if we have NO existing notifications */
                                    <div className="py-10 px-6 flex flex-col items-center gap-3 text-center">
                                        <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
                                            <AlertCircle size={18} className="text-red-400" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-500">{error || 'Could not load notifications.'}</p>
                                        <button
                                            onClick={() => fetchNotifications(false)}
                                            className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wider underline"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    /* Empty state */
                                    <div className="py-12 text-center">
                                        <Bell size={32} className="mx-auto text-slate-200 mb-3" />
                                        <p className="text-sm font-bold text-slate-400">No notifications yet.</p>
                                        <p className="text-xs text-slate-300 font-medium mt-1">You're all caught up!</p>
                                    </div>
                                ) : (
                                    /* Notification list */
                                    <div className="divide-y divide-slate-50">
                                        {notifications.map((notif) => (
                                            <div
                                                key={notif.value || notif.id}
                                                className={`p-4 hover:bg-slate-50 transition-all flex gap-3 ${!notif.is_read ? 'bg-indigo-50/30' : ''}`}
                                            >
                                                {/* Type icon */}
                                                <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-100 shadow-sm">
                                                    {getIcon(notif.type)}
                                                </div>

                                                <div className="flex-1 space-y-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h4 className={`text-sm font-bold leading-tight ${!notif.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                                                            {notif.title}
                                                        </h4>
                                                        {/* Unread dot */}
                                                        {!notif.is_read && (
                                                            <div className="shrink-0 w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 leading-relaxed">
                                                        {notif.message || notif.body || notif.content || ''}
                                                    </p>
                                                    <span className="text-[10px] font-medium text-slate-400">
                                                        {notif.created_at
                                                            ? new Date(notif.created_at).toLocaleString([], {
                                                                  month: 'short',
                                                                  day: 'numeric',
                                                                  hour: '2-digit',
                                                                  minute: '2-digit',
                                                              })
                                                            : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center shrink-0">
                                    <div className="flex flex-col gap-1 items-center">
                                        <p className="text-xs text-slate-400 font-medium">
                                            {unreadCount > 0
                                                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                                                : 'All notifications read'}
                                        </p>
                                        {failedToLoad && (
                                            <span className="text-[9px] font-bold text-amber-500 flex items-center gap-1">
                                                <AlertCircle size={10} />
                                                Offline mode - showing cached alerts
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
