import React, { useState } from 'react';
import { QrCode, ClipboardList, CheckCircle2, Settings } from 'lucide-react';
import { OnboardingService } from '../../api/services';

const Attendance = ({ onNext, onBack }) => {
    const [method, setMethod] = useState('qr');
    const [loading, setLoading] = useState(false);

    const methods = [
        { 
            id: 'qr', 
            title: 'QR Code Check-in', 
            description: 'Members scan a unique QR code displayed at the entrance or on their phone.',
            icon: QrCode,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50'
        },
        { 
            id: 'manual', 
            title: 'Manual Attendance', 
            description: 'Ushers or admins mark members as present from a digital list.',
            icon: ClipboardList,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        { 
            id: 'hybrid', 
            title: 'Hybrid Flow', 
            description: 'Combination of QR self-check-in and manual assistance for guests.',
            icon: Settings,
            color: 'text-amber-600',
            bg: 'bg-amber-50'
        }
    ];

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">Attendance Setup</h2>
                <p className="text-slate-500">Choose how you want to track presence during your events.</p>
            </div>

            <div className="space-y-4">
                {methods.map((item) => (
                    <div 
                        key={item.id}
                        onClick={() => setMethod(item.id)}
                        className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex gap-5 items-start ${
                            method === item.id 
                            ? 'border-primary bg-blue-50/20' 
                            : 'border-slate-100 bg-white hover:border-slate-200'
                        }`}
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
                            <item.icon size={28} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                                {method === item.id && <CheckCircle2 className="text-primary" size={20} />}
                            </div>
                            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-6 bg-slate-900 rounded-3xl text-white flex items-center justify-between">
                <div>
                    <h4 className="font-bold">Real-time Dashboard</h4>
                    <p className="text-xs text-slate-400 mt-1">Attendance data syncs instantly to your analytics panel.</p>
                </div>
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700"></div>
                    ))}
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
                            await OnboardingService.setupChurch({ attendanceMethod: method, step: 7 });
                        } catch (error) {
                            console.error('Error saving attendance setup:', error);
                        } finally {
                            onNext({ attendanceMethod: method });
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

export default Attendance;
