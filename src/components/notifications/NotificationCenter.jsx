import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Calendar, MessageSquare, Info, Trash2 } from 'lucide-react';
import api from '../../api/axios';

const NotificationCenter = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error('Error fetching notifications', error);
        }
    };

    const markRead = async (id) => {
        try {
            await api.post(`/notifications/${id}/read`);
            fetchNotifications();
        } catch (error) {
            console.error('Error marking as read', error);
        }
    };

    const markAllRead = async () => {
        try {
            await api.post('/notifications/read-all');
            fetchNotifications();
        } catch (error) {
            console.error('Error marking all as read', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'event': return <Calendar size={14} className="text-emerald-500" />;
            case 'reminder': return <MessageSquare size={14} className="text-amber-500" />;
            default: return <Info size={14} className="text-indigo-500" />;
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center border border-slate-200 relative hover:border-primary/50 hover:shadow-lg transition-all"
            >
                <Bell size={22} className="text-slate-500" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-rose-600 text-white text-[10px] font-black rounded-xl flex items-center justify-center border-4 border-white shadow-sm">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-4 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-40 origin-top-right"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="font-bold text-slate-900">Notifications</h3>
                                <div className="flex gap-2">
                                    {unreadCount > 0 && (
                                        <button 
                                            onClick={markAllRead}
                                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider"
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                    <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-200 rounded-full transition-all">
                                        <X size={16} className="text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <Bell size={32} className="mx-auto text-slate-200 mb-3" />
                                        <p className="text-sm text-slate-400">All caught up!</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {notifications.map((notif) => (
                                            <div 
                                                key={notif.id}
                                                className={`p-4 hover:bg-slate-50 transition-all flex gap-3 group ${!notif.is_read ? 'bg-indigo-50/30' : ''}`}
                                            >
                                                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-100 shadow-sm`}>
                                                    {getIcon(notif.type)}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className={`text-sm font-bold ${!notif.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                                                            {notif.title}
                                                        </h4>
                                                        {!notif.is_read && (
                                                            <button 
                                                                onClick={() => markRead(notif.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-indigo-100 text-indigo-600 rounded transition-all"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 leading-relaxed">{notif.message}</p>
                                                    <span className="text-[10px] font-medium text-slate-400">
                                                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                                <button className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-all">
                                    View notification history
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
