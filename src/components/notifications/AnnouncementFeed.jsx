import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Calendar, ChevronRight, Plus, Users } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const AnnouncementFeed = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const canCreate = ['super_admin', 'pastor', 'fellowship_admin'].includes(user?.role);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const response = await api.get('/notifications/announcements');
            setAnnouncements(response.data);
        } catch (error) {
            console.error('Error fetching announcements', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
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

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">Refreshing stream...</div>
                ) : announcements.length === 0 ? (
                    <div className="p-10 rounded-[2.5rem] border-2 border-dashed border-slate-100 bg-white text-center space-y-4">
                        <Users size={32} className="mx-auto text-slate-200" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No active announcements</p>
                    </div>
                ) : (
                    announcements.map((ann, i) => (
                        <motion.div 
                            key={ann.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 rounded-[2.5rem] bg-white border border-slate-100 hover:border-primary/30 transition-all group cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-xl hover:shadow-blue-900/5"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="px-3 py-1 bg-blue-50 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-100">
                                    {ann.target_audience === 'all' ? 'Universal' : 'Targeted'}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                    <Calendar size={12} />
                                    {new Date(ann.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <h4 className="text-lg font-black text-slate-900 mb-2 group-hover:text-primary transition-colors tracking-tight">{ann.title}</h4>
                            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-6 font-medium">{ann.content}</p>
                            <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] text-primary font-black border border-slate-200">
                                        {ann.author_name[0]}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{ann.author_name}</span>
                                </div>
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
