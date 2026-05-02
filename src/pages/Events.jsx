import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, MapPin, Users, Clock, 
    Plus, ChevronRight, QrCode, CheckCircle2,
    Search, Share2, Loader2
} from 'lucide-react';
import api from '../api/axios';
import PermissionGate from '../components/PermissionGate';

const EventCard = ({ event, onClick }) => {
    const date = new Date(event.event_date);
    const isPast = date < new Date();

    return (
        <motion.div 
            whileHover={{ y: -4 }}
            onClick={onClick}
            className="section-card section-card-hover group cursor-pointer h-full flex flex-col"
        >
            {/* Color band at top */}
            <div className={`h-2 rounded-t-3xl ${
                event.type === 'service' ? 'bg-primary' :
                event.type === 'outreach' ? 'bg-secondary' :
                'bg-accent'
            }`} />

            <div className="p-7 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${
                        event.type === 'service' ? 'bg-blue-50 text-primary' :
                        event.type === 'outreach' ? 'bg-emerald-50 text-secondary' :
                        'bg-amber-50 text-accent'
                    }`}>
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
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                        <MapPin size={16} className="text-slate-300 shrink-0" />
                        <span className="truncate">{event.location || 'Location not set'}</span>
                    </div>
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

const Events = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await api.get('/events');
            setEvents(response.data);
        } catch (error) {
            console.error('Error fetching events', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = events.filter(e => {
        const isPast = new Date(e.event_date) < new Date();
        const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'past' ? isPast : !isPast;
        return matchesSearch && matchesFilter;
    });

    const upcomingCount = events.filter(e => new Date(e.event_date) >= new Date()).length;

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Events</h1>
                        <p className="text-slate-500 mt-2 font-medium leading-relaxed max-w-lg">
                            Plan and manage your services, meetings, and special events. Track attendance and keep everyone informed.
                        </p>
                    </div>
                    
                    <PermissionGate allowedRoles={['super_admin', 'pastor', 'fellowship_admin']}>
                        <div className="flex flex-wrap items-center gap-4">
                            <button className="btn-outline">
                                <QrCode size={18} />
                                <span>Check Attendance</span>
                            </button>
                            <button className="btn-primary">
                                <Plus size={18} />
                                <span>Create Event</span>
                            </button>
                        </div>
                    </PermissionGate>
                </div>

                {/* Simple Stats */}
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
                        <p className="text-2xl font-bold text-slate-900">
                            {events.length > 0 ? Math.round(events.reduce((acc, e) => acc + (e.attendance_count || 0), 0) / Math.max(events.filter(e => e.attendance_count).length, 1)) : '—'}
                        </p>
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
                            placeholder="Search events..." 
                            className="bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all w-full placeholder:text-slate-400 shadow-sm"
                        />
                    </div>
                </div>

                {/* Event Cards */}
                {loading ? (
                    <div className="py-24 flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-slate-400 font-medium">Loading events...</p>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="py-24 flex flex-col items-center text-center max-w-md mx-auto space-y-8">
                        <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center border border-amber-100 shadow-inner">
                            <Calendar size={40} className="text-accent/30" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                                {filter === 'upcoming' ? 'No upcoming events' : 'No past events found'}
                            </h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                {filter === 'upcoming' 
                                    ? 'Create your first event to start organizing services and meetings for your fellowship.' 
                                    : 'Past events will appear here after they\'ve taken place.'}
                            </p>
                        </div>
                        {filter === 'upcoming' && (
                            <button className="btn-primary w-full">
                                <Plus size={18} />
                                <span>Create First Event</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                        <AnimatePresence>
                            {filteredEvents.map(event => (
                                <EventCard 
                                    key={event.id} 
                                    event={event} 
                                    onClick={() => navigate(`/dashboard/events/${event.id}`)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Events;
