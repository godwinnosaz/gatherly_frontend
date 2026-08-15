import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, Users, ChevronLeft, 
  Share2, Edit, Trash2, CheckCircle2, UserPlus,
  Loader2, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { EventService } from '../api/services';
import { normalizeArrayResponse, normalizeObjectResponse } from '../utils/apiResponse';
import Layout from '../components/Layout';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [attendees, setAttendees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                // Axios interceptor already unwraps .data — response IS the payload.
                // Backend may return { event: {...}, attendees: [] } or { data: {...} }
                const response = await EventService.getById(id);
                setEvent(normalizeObjectResponse(response, ['event']));
                setAttendees(normalizeArrayResponse(response, ['attendees', 'members', 'items']));
            } catch (err) {
                console.error('Fetch event detail error:', err);
                // Use typed error from Axios interceptor
                setError(err.message || 'Failed to load event details.');
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [id]);

    if (loading) return (
        <Layout>
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-secondary animate-spin" />
                <p className="text-slate-400 font-medium">Loading event intelligence...</p>
            </div>
        </Layout>
    );

    if (error) return (
        <Layout>
            <div className="h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-4">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 border border-red-100">
                    <AlertCircle size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Operation Failed</h3>
                    <p className="text-slate-500 max-w-sm">{error}</p>
                </div>
                <button 
                    onClick={() => navigate('/dashboard/events')}
                    className="btn-primary"
                >
                    Return to Events
                </button>
            </div>
        </Layout>
    );

    if (!event) return null;

    return (
        <Layout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <button 
                    onClick={() => navigate('/dashboard/events')}
                    className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors group w-fit"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold">Back to Events</span>
                </button>
 
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Share — TODO: backend endpoint needed */}
                    <button
                        title="Share — Coming Soon"
                        disabled
                        className="flex-1 md:flex-none p-4 md:p-3 bg-white text-slate-300 rounded-2xl border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-2 cursor-not-allowed opacity-50"
                    >
                        <Share2 size={18} />
                        <span className="md:hidden font-bold text-sm">Share</span>
                    </button>
                    {/* Edit — TODO: PUT /events/{id} not in Postman contract */}
                    <button
                        title="Edit — Coming Soon"
                        disabled
                        className="flex-1 md:flex-none p-4 md:p-3 bg-white text-slate-300 hover:text-secondary rounded-2xl border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-2 cursor-not-allowed opacity-50"
                    >
                        <Edit size={18} />
                        <span className="md:hidden font-bold text-sm">Edit</span>
                    </button>
                    {/* Delete — TODO: DELETE /events/{id} not in Postman contract */}
                    <button
                        title="Delete — Coming Soon"
                        disabled
                        className="flex-1 md:flex-none p-4 md:p-3 bg-red-50 text-red-200 rounded-2xl border border-red-100 transition-all flex items-center justify-center gap-2 cursor-not-allowed opacity-50"
                    >
                        <Trash2 size={18} />
                        <span className="md:hidden font-bold text-sm">Delete</span>
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Event Summary */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-card overflow-hidden">
                        <div className="h-48 bg-gradient-to-br from-primary/10 to-indigo-600/10 relative">
                            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                <Calendar size={120} className="text-primary" />
                            </div>
                            <div className="absolute bottom-6 left-8 right-6">
                                <span className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg">
                                    {event.type}
                                </span>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-3 tracking-tighter leading-none">
                                    {event.title}
                                </h1>
                            </div>
                        </div>

                        <div className="p-8 space-y-10">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm border border-slate-100">
                                        <Calendar size={22} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Date</p>
                                        <p className="text-slate-900 font-bold">{new Date(event.event_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm border border-slate-100">
                                        <Clock size={22} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Time</p>
                                        <p className="text-slate-900 font-bold">{new Date(event.event_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm border border-slate-100">
                                        <MapPin size={22} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Location</p>
                                        <p className="text-slate-900 font-bold truncate">{event.location || 'Online'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">About Event</h3>
                                <p className="text-slate-500 leading-relaxed font-medium">
                                    {event.description || 'No description provided for this event. Prepare for an impactful time of fellowship and growth.'}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-100">
                                <div className="flex -space-x-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-12 h-12 rounded-2xl border-4 border-white bg-slate-100 overflow-hidden shadow-sm">
                                            <div className="w-full h-full bg-gradient-to-tr from-primary/20 to-indigo-500/20" />
                                        </div>
                                    ))}
                                    <div className="w-12 h-12 rounded-2xl border-4 border-white bg-slate-900 flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                                        +{Math.max(0, attendees.length - 4)}
                                    </div>
                                </div>
                                {/* Manual Check-in — TODO: POST /events/check-in not in Postman contract */}
                                <button
                                    disabled
                                    title="Manual Check-in — Coming Soon"
                                    className="btn-secondary w-full sm:w-auto opacity-50 cursor-not-allowed"
                                >
                                    <UserPlus size={18} />
                                    <span>Manual Check-in — Soon</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Sidebar Stats & Attendees */}
                <div className="space-y-8">
                    <div className="soft-card p-8 space-y-8">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Attendance Audit</h3>
                        <div className="space-y-6">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total RSVPs</span>
                                    <span className="text-lg font-black text-slate-900">{attendees.length}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (attendees.length / (event.max_attendees || 100)) * 100)}%` }}
                                        className="h-full bg-primary"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-2">Present</p>
                                    <p className="text-3xl font-black text-emerald-600">{attendees.filter(a => a.status === 'checked_in').length}</p>
                                </div>
                                <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                                    <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mb-2">Pending</p>
                                    <p className="text-3xl font-black text-amber-600">{attendees.filter(a => a.status === 'rsvp').length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="soft-card p-8 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Attendee List</h3>
                            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">{attendees.length} Total</span>
                        </div>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {attendees.length > 0 ? attendees.map((attendee, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary font-black text-sm border border-blue-100 shadow-sm">
                                        {(attendee.first_name || attendee.name || '?')[0]}{attendee.last_name?.[0] || ''}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-slate-900 truncate">{attendee.name || `${attendee.first_name || ''} ${attendee.last_name || ''}`.trim()}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">{String(attendee.status || 'rsvp').replace(/_/g, ' ')}</p>
                                    </div>
                                    {attendee.status === 'checked_in' && (
                                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                            <CheckCircle2 size={18} />
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="text-center py-16 space-y-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300 border border-slate-100">
                                        <Users size={32} />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400">No attendees recorded yet.</p>
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

export default EventDetail;
