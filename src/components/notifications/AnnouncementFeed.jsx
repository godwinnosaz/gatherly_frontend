import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Calendar, ChevronRight, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { NotificationService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { normalizeArrayResponse } from '../../utils/apiResponse';

// â”€â”€â”€ AnnouncementFeed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Note: GET /notifications/announcements is NOT in the Postman contract.
// We use GET /notifications (the only documented endpoint) and filter client-side
// for notifications of type 'announcement'. If the backend does not tag items
// with type='announcement', all notifications will appear here as general updates.
const AnnouncementFeed = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState('');
    const { user }                          = useAuth();
    const canCreate = ['super_admin', 'pastor', 'fellowship_admin'].includes(user?.role);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    // GET /notifications â€” filter to announcement-type items client-side
    const fetchAnnouncements = async () => {
        setLoading(true);
        setError('');
        try {
            // Axios interceptor already unwraps .data â€” response IS the payload
            const response = await NotificationService.getAll();

            // Normalise: backend may return [] or { notifications: [] }
            const all = normalizeArrayResponse(response, ['notifications', 'items']);

            // Filter for announcement-type; if none tagged, show all
            const filtered = all.filter((n) => n.type === 'announcement');
            setAnnouncements(filtered.length > 0 ? filtered : all);
        } catch (err) {
            console.error('Error fetching announcements', err);
            setError('Could not load announcements. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Safe initial for author avatars â€” guard against missing author_name
    const authorInitial = (ann) => {
        const name = ann.author_name || ann.author || '';
        return name.charAt(0).toUpperCase() || '?';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                        <Megaphone size={20} className="text-primary" />
                    </div>
                    <h3 className="font-black text-xl text-slate-900 tracking-tight">Organization Updates</h3>
                </div>
                {canCreate && (
                    <button className="p-2.5 hover:bg-slate-100 text-slate-400 hover:text-primary rounded-full transition-all">
                        <Plus size={20} />
                    </button>
                )}
            </div>

            {/* Body */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center gap-3 py-10 text-slate-400">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Refreshing updates...</span>
                    </div>
                ) : error ? (
                    <div className="p-6 rounded-[2rem] border border-red-100 bg-red-50 flex items-start gap-3">
                        <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-red-600">{error}</p>
                            <button
                                onClick={fetchAnnouncements}
                                className="mt-1 text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest underline"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="p-10 rounded-[2.5rem] border-2 border-dashed border-slate-100 bg-white text-center space-y-4">
                        <Megaphone size={32} className="mx-auto text-slate-200" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            No active announcements
                        </p>
                    </div>
                ) : (
                    announcements.map((ann, i) => (
                        <motion.div
                            key={ann.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="p-6 rounded-[2.5rem] bg-white border border-slate-100 hover:border-primary/30 transition-all group cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-xl hover:shadow-blue-900/5"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="px-3 py-1 bg-blue-50 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-100">
                                    {ann.target_audience === 'all' ? 'Universal' : ann.target_audience ? 'Targeted' : 'General'}
                                </span>
                                {ann.created_at && (
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                        <Calendar size={12} />
                                        {new Date(ann.created_at).toLocaleDateString()}
                                    </div>
                                )}
                            </div>

                            <h4 className="text-lg font-black text-slate-900 mb-2 group-hover:text-primary transition-colors tracking-tight">
                                {ann.title}
                            </h4>
                            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-6 font-medium">
                                {ann.content || ann.message || ann.body || ''}
                            </p>

                            <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                                {(ann.author_name || ann.author) ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] text-primary font-black border border-slate-200">
                                            {authorInitial(ann)}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            {ann.author_name || ann.author}
                                        </span>
                                    </div>
                                ) : (
                                    <div />
                                )}
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AnnouncementFeed;


