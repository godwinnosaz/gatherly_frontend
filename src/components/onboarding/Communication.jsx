import React, { useState } from 'react';
import { BellRing, MessageSquare, Mail, Smartphone, CheckCircle2 } from 'lucide-react';
import { OnboardingService } from '../../api/services';

const Communication = ({ onNext, onBack }) => {
    const [channels, setChannels] = useState(['announcements', 'prayer']);
    const [loading, setLoading] = useState(false);

    const toggleChannel = (channel) => {
        if (channels.includes(channel)) {
            setChannels(channels.filter(c => c !== channel));
        } else {
            setChannels([...channels, channel]);
        }
    };

    const options = [
        { id: 'announcements', title: 'General Announcements', icon: BellRing, color: 'text-primary' },
        { id: 'prayer', title: 'Prayer Request Handling', icon: MessageSquare, color: 'text-rose-500' },
        { id: 'reminders', title: 'Automatic Service Reminders', icon: Smartphone, color: 'text-emerald-600' },
        { id: 'notices', title: 'Leadership Notices', icon: Mail, color: 'text-amber-500' }
    ];

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">Communication</h2>
                <p className="text-slate-500">Enable the channels you'll use to engage with your members.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {options.map((option) => {
                    const isActive = channels.includes(option.id);
                    return (
                        <div 
                            key={option.id}
                            onClick={() => toggleChannel(option.id)}
                            className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col gap-4 ${
                                isActive 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'bg-white border-slate-100 hover:border-slate-200'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className={`w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center ${option.color}`}>
                                    <option.icon size={24} />
                                </div>
                                {isActive && <CheckCircle2 className="text-primary" size={20} />}
                            </div>
                            <div>
                                <h4 className={`font-bold ${isActive ? 'text-primary' : 'text-slate-700'}`}>{option.title}</h4>
                                <p className="text-xs text-slate-500 mt-1">Real-time delivery to member mobile apps.</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                <h4 className="text-sm font-bold text-slate-900">Delivery Preference</h4>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-primary rounded focus:ring-primary" />
                        <span className="text-sm text-slate-600">Push Notifications</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-primary rounded focus:ring-primary" />
                        <span className="text-sm text-slate-600">Email Updates</span>
                    </label>
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
                            await OnboardingService.setupChurch({ communicationChannels: channels, step: 8 });
                            onNext({ channels });
                        } catch (error) {
                            console.error('Error saving communication setup:', error);
                        } finally {
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

export default Communication;
