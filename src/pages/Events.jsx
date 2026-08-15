import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { EventService } from '../api/services';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, MapPin, Users, Clock,
    Plus, ChevronRight, QrCode, CheckCircle2,
    Search, Loader2, X, AlertCircle, FileText, Tag
} from 'lucide-react';
import PermissionGate from '../components/PermissionGate';
import { normalizeArrayResponse, entityValue } from '../utils/apiResponse';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Combine a date string (YYYY-MM-DD) and time string (HH:mm)
 * into the backend-required format: "YYYY-MM-DD HH:mm:ss"
 */
const toEventDate = (date, time) => {
    if (!date) return '';
    const t = time || '00:00';
    return `${date} ${t}:00`;
};

const getDefaultEventDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
};

/**
 * Safely parse date strings into local time to prevent the "off-by-one" day 
 * bug caused by browsers interpreting raw "YYYY-MM-DD" as Midnight UTC.
 */
const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    // Replacing dashes with slashes forces JS to parse in local timezone
    const safeStr = dateStr.includes('T') ? dateStr : dateStr.replace(/-/g, '/');
    return new Date(safeStr);
};

/** Friendly error from the typed Axios interceptor error object */
const friendlyError = (err) => {
    if (!err) return 'Something went wrong. Please try again.';
    if (err.type === 'validation')      return err.message || 'Please check the fields and try again.';
    if (err.type === 'bad_request')     return err.message || 'Invalid request. Please check your input.';
    if (err.type === 'cors_or_network') return 'Cannot reach server. Check your internet connection.';
    if (err.type === 'server_error')    return 'A server error occurred. Please try again later.';
    return err.message || 'Something went wrong. Please try again.';
};

const normalizeEvents = (response) => normalizeArrayResponse(response, ['events', 'items']).map((event) => ({
    ...event,
    value: entityValue(event, ['event_id', 'id']),
    title: event.title || event.name || 'Untitled Event'
}));

// ─── Event Card ───────────────────────────────────────────────────────────────
const EventCard = ({ event, onClick }) => {
    const date = parseLocalDate(event.event_date);
    const isPast = date < new Date();
    const typeKey = (event.type || '').toLowerCase();

    const typeStyle =
        typeKey === 'service'
            ? { band: 'bg-primary', badge: 'bg-blue-50 text-primary' }
            : typeKey === 'outreach'
            ? { band: 'bg-secondary', badge: 'bg-emerald-50 text-secondary' }
            : { band: 'bg-accent', badge: 'bg-amber-50 text-accent' };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            onClick={onClick}
            className="section-card section-card-hover group cursor-pointer h-full flex flex-col"
        >
            <div className={`h-2 rounded-t-3xl ${typeStyle.band}`} />

            <div className="p-7 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${typeStyle.badge}`}>
                        {event.type || 'Event'}
                    </span>
                    {isPast && (
                        <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-50 text-slate-400">
                            Past
                        </span>
                    )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-5 group-hover:text-primary transition-colors leading-snug">
                    {event.title}
                </h3>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                        <Calendar size={16} className="text-slate-300 shrink-0" />
                        <span>{date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                        <Clock size={16} className="text-slate-300 shrink-0" />
                        <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {/* location is display-only — not sent on create, but shown if backend returns it */}
                    {event.location && (
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                            <MapPin size={16} className="text-slate-300 shrink-0" />
                            <span className="truncate">{event.location}</span>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-5 border-t border-slate-50 flex items-center justify-between">
                    {isPast ? (
                        <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 size={16} className="text-secondary" />
                            <span className="text-slate-600 font-medium">{event.attendance_count || 0} attended</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-sm">
                            <Users size={16} className="text-primary" />
                            <span className="text-slate-600 font-medium">{event.rsvp_count || 0} expected</span>
                        </div>
                    )}
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        </motion.div>
    );
};

// ─── Create Event Modal ───────────────────────────────────────────────────────
const CreateEventModal = ({ isOpen, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        title: '',
        description: '',
        date: getDefaultEventDate(),
        time: '10:00',
        type: 'Special Event',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const reset = () => {
        setForm({ title: '', description: '', date: getDefaultEventDate(), time: '10:00', type: 'Special Event' });
        setError('');
        setSuccess(false);
    };

    const handleClose = () => { reset(); onClose(); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.date) {
            setError('Please select an event date.');
            return;
        }

        setSubmitting(true);
        try {
            await EventService.create({
                title: form.title.trim(),
                description: form.description.trim(),
                event_date: toEventDate(form.date, form.time), 
                type: form.type,
            });
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                handleClose();
            }, 1200);
        } catch (err) {
            setError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-amber-50 rounded-2xl flex items-center justify-center text-accent border border-amber-100">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Create Event</h2>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">New fellowship event</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto flex-1">
                    {success ? (
                        <div className="flex flex-col items-center gap-4 py-6 text-center">
                            <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-secondary border border-emerald-100">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">Event Created!</h3>
                            <p className="text-sm text-slate-500">Refreshing your event list…</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold"
                                >
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    {error}
                                </motion.div>
                            )}

                            {/* Title */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Event Title <span className="text-rose-400">*</span>
                                </label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors w-4 h-4" />
                                    <input
                                        type="text"
                                        required
                                        value={form.title}
                                        onChange={set('title')}
                                        className="input-field pl-11 h-12 text-sm"
                                        placeholder="e.g. Youth Conference"
                                    />
                                </div>
                            </div>

                            {/* Type */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Event Type <span className="text-rose-400">*</span>
                                </label>
                                <div className="relative group">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors w-4 h-4" />
                                    <select
                                        value={form.type}
                                        onChange={set('type')}
                                        className="input-field pl-11 h-12 text-sm"
                                    >
                                        <option value="Special Event">Special Event</option>
                                        <option value="service">Service</option>
                                        <option value="outreach">Outreach</option>
                                        <option value="meeting">Meeting</option>
                                        <option value="conference">Conference</option>
                                        <option value="retreat">Retreat</option>
                                    </select>
                                </div>
                            </div>

                            {/* Date + Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Date <span className="text-rose-400">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={form.date}
                                        onChange={set('date')}
                                        className="input-field h-12 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Time
                                    </label>
                                    <input
                                        type="time"
                                        value={form.time}
                                        onChange={set('time')}
                                        className="input-field h-12 text-sm"
                                    />
                                </div>
                            </div>

                            {form.date && (
                                <p className="text-[10px] text-slate-400 font-mono bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                    Sends as: <span className="text-primary font-bold">{toEventDate(form.date, form.time)}</span>
                                </p>
                            )}

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={form.description}
                                    onChange={set('description')}
                                    className="input-field text-sm py-3 resize-none"
                                    placeholder="Describe this event…"
                                />
                            </div>

                            <p className="text-[10px] text-slate-300 font-medium">
                                Location, department, and reminders are not yet supported by the backend API.
                            </p>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 py-3.5 text-slate-500 font-bold border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 btn-primary py-3.5 text-sm"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                    ) : (
                                        <span>Create Event</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// ─── Events Page ──────────────────────────────────────────────────────────────
const Events = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');
    const [filter, setFilter] = useState('upcoming');
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setApiError('');
        try {
            const response = await EventService.getAll();
            setEvents(normalizeEvents(response));
        } catch (err) {
            console.error('Error fetching events', err);
            setApiError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // ── Optimized Client-side computations ────────────────────────────────────

    const filteredEvents = useMemo(() => {
        const lowerSearch = search.toLowerCase();
        const now = new Date();
        
        return events.filter((e) => {
            const isPast = parseLocalDate(e.event_date) < now;
            const matchesSearch = (e.title || '').toLowerCase().includes(lowerSearch);
            const matchesFilter = filter === 'past' ? isPast : !isPast;
            
            return matchesSearch && matchesFilter;
        });
    }, [events, search, filter]);

    const upcomingCount = useMemo(() => {
        const now = new Date();
        return events.filter(e => parseLocalDate(e.event_date) >= now).length;
    }, [events]);

    // Single-pass O(N) calculation for average attendance
    const avgAttendance = useMemo(() => {
        if (events.length === 0) return null;
        
        const stats = events.reduce((acc, e) => {
            if (e.attendance_count != null && e.attendance_count > 0) {
                acc.sum += Number(e.attendance_count);
                acc.count += 1;
            }
            return acc;
        }, { sum: 0, count: 0 });

        return stats.count > 0 ? Math.round(stats.sum / stats.count) : null;
    }, [events]);

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Events</h1>
                        <p className="text-slate-500 mt-2 font-medium leading-relaxed max-w-lg">
                            Plan and manage your services, meetings, and special events.
                        </p>
                    </div>

                    <PermissionGate allowedRoles={['super_admin', 'pastor', 'fellowship_admin']}>
                        <div className="flex flex-wrap items-center gap-4">
                            <button className="btn-outline">
                                <QrCode size={18} />
                                <span>Check Attendance</span>
                            </button>
                            <button
                                onClick={() => setIsCreateOpen(true)}
                                className="btn-primary"
                            >
                                <Plus size={18} />
                                <span>Create Event</span>
                            </button>
                        </div>
                    </PermissionGate>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-blue-50 rounded-xl text-primary border border-blue-100">
                                <Calendar size={20} />
                            </div>
                            <span className="text-sm font-medium text-slate-500">Upcoming</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{upcomingCount}</p>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-emerald-50 rounded-xl text-secondary border border-emerald-100">
                                <CheckCircle2 size={20} />
                            </div>
                            <span className="text-sm font-medium text-slate-500">Total Events</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{events.length}</p>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hidden md:block">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-amber-50 rounded-xl text-accent border border-amber-100">
                                <Users size={20} />
                            </div>
                            <span className="text-sm font-medium text-slate-500">Avg. Attendance</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{avgAttendance ?? '—'}</p>
                    </div>
                </div>

                {/* Filters + Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setFilter('upcoming')}
                            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${filter === 'upcoming' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Upcoming
                        </button>
                        <button
                            onClick={() => setFilter('past')}
                            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${filter === 'past' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Past Events
                        </button>
                    </div>

                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search events…"
                            className="bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all w-full placeholder:text-slate-400 shadow-sm"
                        />
                    </div>
                </div>

                {/* API Error State */}
                {apiError && !loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-4 bg-red-50 border border-red-100 text-red-600 p-6 rounded-3xl"
                    >
                        <AlertCircle size={22} className="shrink-0" />
                        <div>
                            <p className="font-bold text-sm">Could not load events</p>
                            <p className="text-xs mt-1 font-medium opacity-80">{apiError}</p>
                        </div>
                        <button
                            onClick={fetchEvents}
                            className="ml-auto text-xs font-black uppercase tracking-widest text-red-600 hover:text-red-800 underline shrink-0"
                        >
                            Retry
                        </button>
                    </motion.div>
                )}

                {/* Event Cards */}
                {loading ? (
                    <div className="py-24 flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-slate-400 font-medium">Loading events…</p>
                    </div>
                ) : filteredEvents.length === 0 && !apiError ? (
                    <div className="py-24 flex flex-col items-center text-center max-w-md mx-auto space-y-8">
                        <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center border border-amber-100 shadow-inner">
                            <Calendar size={40} className="text-accent/30" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                                {search
                                    ? 'No events match your search'
                                    : filter === 'upcoming'
                                    ? 'No upcoming events'
                                    : 'No past events found'}
                            </h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                {search
                                    ? 'Try a different search term.'
                                    : filter === 'upcoming'
                                    ? 'Create your first event to start organizing services and meetings.'
                                    : 'Past events will appear here after they\'ve taken place.'}
                            </p>
                        </div>
                        {filter === 'upcoming' && !search && (
                            <button
                                onClick={() => setIsCreateOpen(true)}
                                className="btn-primary w-full"
                            >
                                <Plus size={18} />
                                <span>Create First Event</span>
                            </button>
                        )}
                    </div>
                ) : !apiError ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                        <AnimatePresence>
                            {filteredEvents.map((event) => (
                                <EventCard
                                    key={event.value || event.id}
                                    event={event}
                                    onClick={() => navigate(`/dashboard/events/${event.value || event.id}`)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : null}
            </div>

            {/* Create Event Modal */}
            <AnimatePresence>
                {isCreateOpen && (
                    <CreateEventModal
                        isOpen={isCreateOpen}
                        onClose={() => setIsCreateOpen(false)}
                        onSuccess={fetchEvents}
                    />
                )}
            </AnimatePresence>
        </Layout>
    );
};

export default Events;