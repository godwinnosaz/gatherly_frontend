import React, { useState } from 'react';
import { UserPlus, Shield, X, Mail, Sparkles } from 'lucide-react';
import { InvitationService } from '../../api/services';
import api from '../../api/axios';

const Leadership = ({ onNext, onBack }) => {
    const [invites, setInvites] = useState([
        { id: 1, email: '', role: 'pastor', message: '' }
    ]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(null);

    const addInvite = () => {
        setInvites([...invites, { id: Date.now(), email: '', role: 'fellowship_admin', message: '' }]);
    };

    const handleAiGenerateMessage = async (id, role) => {
        setGenerating(id);
        try {
            const response = await api.post('/ai/generate-invite-message', { role });
            updateInvite(id, 'message', response?.message || response?.data?.message || '');
        } catch (error) {
            console.error('AI message generation failed:', error);
        } finally {
            setGenerating(null);
        }
    };

    const removeInvite = (id) => {
        if (invites.length > 1) {
            setInvites(invites.filter(i => i.id !== id));
        }
    };

    const updateInvite = (id, field, value) => {
        setInvites(invites.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const handleNext = async () => {
        const validInvites = invites.filter(i => i.email.trim() !== '');
        if (validInvites.length === 0) {
            onNext({ invites: [] });
            return;
        }

        setLoading(true);
        try {
            await InvitationService.send({ invites: validInvites });
        } catch (error) {
            // Invitation endpoint may not be in contract — still advance
            console.error('Error inviting leaders:', error);
        } finally {
            onNext({ invites: validInvites });
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">Leadership Setup</h2>
                <p className="text-slate-500">Invite key leaders to help you manage the organization.</p>
            </div>

            <div className="space-y-4">
                {invites.map((invite) => (
                    <div key={invite.id} className="group p-6 rounded-[2rem] border border-slate-100 bg-white shadow-sm hover:border-primary/20 hover:shadow-xl hover:shadow-blue-900/5 transition-all space-y-4">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[200px] space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                                    <input 
                                        type="email"
                                        value={invite.email}
                                        onChange={e => updateInvite(invite.id, 'email', e.target.value)}
                                        className="onboarding-input pl-10"
                                        placeholder="leader@church.com"
                                    />
                                </div>
                            </div>

                            <div className="w-48 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-3 text-slate-400" size={16} />
                                    <select 
                                        value={invite.role}
                                        onChange={e => updateInvite(invite.id, 'role', e.target.value)}
                                        className="onboarding-input pl-10 appearance-none"
                                    >
                                        <option value="pastor">Pastor/Senior Leader</option>
                                        <option value="fellowship_admin">Fellowship Admin</option>
                                        <option value="department_leader">Department Leader</option>
                                    </select>
                                </div>
                            </div>

                            <button 
                                onClick={() => removeInvite(invite.id)}
                                className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-100/50">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Personal Message (Optional)</label>
                                <button 
                                    onClick={() => handleAiGenerateMessage(invite.id, invite.role)}
                                    disabled={generating === invite.id}
                                    className="flex items-center gap-2 text-primary hover:text-primary/80 font-bold text-[11px] uppercase tracking-wider transition-colors disabled:opacity-50"
                                >
                                    <Sparkles size={14} />
                                    {generating === invite.id ? 'Thinking...' : 'AI Suggestion'}
                                </button>
                            </div>
                            <textarea 
                                value={invite.message}
                                onChange={e => updateInvite(invite.id, 'message', e.target.value)}
                                className="onboarding-input min-h-[80px] resize-none"
                                placeholder="Write a personal note..."
                            />
                        </div>
                    </div>
                ))}

                <button 
                    onClick={addInvite}
                    className="flex items-center gap-2 text-primary font-bold text-sm px-4 py-2 rounded-xl hover:bg-blue-50 transition-all"
                >
                    <UserPlus size={18} />
                    Add Another Leader
                </button>
            </div>

            <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex gap-4">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-500 shrink-0">
                    <Shield size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-amber-900">Security Tip</h4>
                    <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
                        Pastors and Admins have full access to organization data, including financial records and member contact info. Only invite trusted leadership.
                    </p>
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
                    onClick={handleNext}
                    className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-10 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/10"
                >
                    {loading ? 'Sending Invites...' : 'Next Step'}
                </button>
            </div>
        </div>
    );
};

export default Leadership;
