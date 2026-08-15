import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Plus, Trash2 } from 'lucide-react';
import { EventService } from '../../api/services';

const eventTemplates = [
    { title: 'Sunday Service', type: 'Weekly Service', time: '09:00 AM' },
    { title: 'Bible Study', type: 'Weekly Meeting', time: '06:00 PM' },
    { title: 'Prayer Meeting', type: 'Monthly Vigil', time: '10:00 PM' }
];

const getNextEventDate = (time) => {
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 7);

    const timeValue = String(time || '09:00').trim();
    const isPm = /PM$/i.test(timeValue);
    const isAm = /AM$/i.test(timeValue);
    const [rawHours = '09', rawMinutes = '00'] = timeValue.replace(/\s?(AM|PM)$/i, '').split(':');
    let hours = Number(rawHours) || 9;
    const minutes = Number(rawMinutes) || 0;

    if (isPm && hours < 12) hours += 12;
    if (isAm && hours === 12) hours = 0;

    eventDate.setHours(hours, minutes, 0, 0);

    const year = eventDate.getFullYear();
    const month = String(eventDate.getMonth() + 1).padStart(2, '0');
    const day = String(eventDate.getDate()).padStart(2, '0');
    const hour = String(eventDate.getHours()).padStart(2, '0');
    const minute = String(eventDate.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hour}:${minute}:00`;
};

const Events = ({ onNext, onBack }) => {
    const [events, setEvents] = useState([eventTemplates[0]]);
    const [loading, setLoading] = useState(false);

    const addEvent = (template = { title: '', type: 'Other', time: '12:00 PM' }) => {
        setEvents([...events, template]);
    };

    const updateEvent = (index, field, value) => {
        const newEvents = [...events];
        newEvents[index][field] = value;
        setEvents(newEvents);
    };

    const removeEvent = (index) => {
        setEvents(events.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">First Events</h2>
                <p className="text-slate-500">Create your recurring services and meetings to start tracking attendance.</p>
            </div>

            <div className="space-y-6">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {eventTemplates.map((template, idx) => (
                        <button 
                            key={idx}
                            onClick={() => addEvent(template)}
                            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 hover:bg-blue-50 hover:border-primary/30 hover:text-primary transition-all shadow-sm"
                        >
                            <Plus size={14} /> Add {template.title}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    {events.map((event, index) => (
                        <div key={index} className="p-8 rounded-[2.5rem] border border-slate-100 bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-blue-900/5 transition-all relative group shadow-sm">
                            <button 
                                onClick={() => removeEvent(index)}
                                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Event Title</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 text-slate-400" size={16} />
                                        <input 
                                            value={event.title}
                                            onChange={e => updateEvent(index, 'title', e.target.value)}
                                            className="onboarding-input pl-10"
                                            placeholder="e.g. Sunday Celebration"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Type</label>
                                    <select 
                                        value={event.type}
                                        onChange={e => updateEvent(index, 'type', e.target.value)}
                                        className="onboarding-input"
                                    >
                                        <option value="Weekly Service">Weekly Service</option>
                                        <option value="Weekly Meeting">Weekly Meeting</option>
                                        <option value="Monthly Vigil">Monthly Vigil</option>
                                        <option value="Special Outreach">Special Outreach</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Default Time</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-3 text-slate-400" size={16} />
                                        <input 
                                            type="time"
                                            value={event.time.includes('M') ? '09:00' : event.time} // Simplified for demo
                                            onChange={e => updateEvent(index, 'time', e.target.value)}
                                            className="onboarding-input pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
                                        <input 
                                            value={event.location || ''}
                                            onChange={e => updateEvent(index, 'location', e.target.value)}
                                            className="onboarding-input pl-10"
                                            placeholder="Main Auditorium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button 
                        onClick={() => addEvent()}
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-500 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={20} /> Add Custom Event
                    </button>
                </div>
            </div>

            <div className="flex justify-between pt-6">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-600 font-semibold px-6 py-3 rounded-xl hover:bg-slate-100 transition-all"
                >
                    Back
                </button>
                <button 
                    disabled={loading}
                    onClick={async () => {
                        setLoading(true);
                        try {
                            const selectedEvents = events
                                .map((event) => ({
                                    title: String(event.title || '').trim(),
                                    description: event.location
                                        ? `Location: ${event.location}`
                                        : 'Created during onboarding.',
                                    event_date: getNextEventDate(event.time),
                                    type: event.type || 'Other'
                                }))
                                .filter((event) => event.title);

                            const results = await Promise.allSettled(
                                selectedEvents.map((event) => EventService.create(event))
                            );

                            const failed = results.filter((result) => result.status === 'rejected');
                            if (failed.length > 0) {
                                console.warn('[Onboarding] Some events were not created:', failed);
                            }
                        } catch (error) {
                            console.error('Error saving events:', error);
                        } finally {
                            onNext({ events });
                            setLoading(false);
                        }
                    }}
                    className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-10 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/10"
                >
                    {loading ? 'Saving...' : 'Next Step'}
                </button>
            </div>
        </div>
    );
};

export default Events;
