import React, { useState } from 'react';
import { Users, FileDown, Upload, X, UserPlus, CheckCircle2 } from 'lucide-react';
import { OnboardingService } from '../../api/services';

const Members = ({ onNext, onBack }) => {
    const [members, setMembers] = useState([]);
    const [importMode, setImportMode] = useState(null); // 'manual' or 'csv'
    const [loading, setLoading] = useState(false);

    const addMember = () => {
        setMembers([...members, { first_name: '', last_name: '', email: '', phone: '', gender: 'M' }]);
    };

    const updateMember = (index, field, value) => {
        const newMembers = [...members];
        newMembers[index][field] = value;
        setMembers(newMembers);
    };

    const removeMember = (index) => {
        setMembers(members.filter((_, i) => i !== index));
    };

    const handleNext = async () => {
        setLoading(true);
        const validMembers = members.filter(m => m.first_name && m.last_name);
        try {
            await OnboardingService.setupMembers({ members: validMembers, step: 5 });
        } catch (error) {
            console.error('Error saving members:', error);
        } finally {
            onNext({ memberCount: validMembers.length });
            setLoading(false);
        }
    };

    const renderManualForm = () => (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
            {members.map((member, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-4 p-6 rounded-3xl border border-slate-100 bg-slate-50/50 items-stretch sm:items-end">
                    <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                        <input 
                            value={member.first_name}
                            onChange={e => updateMember(index, 'first_name', e.target.value)}
                            className="onboarding-input"
                            placeholder="e.g. John"
                        />
                    </div>
                    <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                        <input 
                            value={member.last_name}
                            onChange={e => updateMember(index, 'last_name', e.target.value)}
                            className="onboarding-input"
                            placeholder="e.g. Doe"
                        />
                    </div>
                    <button 
                        onClick={() => removeMember(index)} 
                        className="p-4 sm:p-3 bg-white text-slate-400 hover:text-rose-500 rounded-xl border border-slate-200 transition-colors flex items-center justify-center"
                    >
                        <X size={20}/>
                    </button>
                </div>
            ))}
            <button 
                onClick={addMember}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
                <UserPlus size={18} /> Add Member
            </button>
        </div>
    );

    const renderCSVImport = () => (
        <div className="space-y-6">
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center gap-4 hover:border-primary/30 hover:bg-blue-50/30 transition-all cursor-pointer group">
                <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                    <Upload size={32} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-900">Drop your CSV here</h4>
                    <p className="text-sm text-slate-500 mt-1">or click to browse your files</p>
                </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                        <FileDown size={20} />
                    </div>
                    <div>
                        <h5 className="text-sm font-bold text-slate-900">Download Template</h5>
                        <p className="text-[10px] text-slate-500">Get our pre-formatted CSV structure</p>
                    </div>
                </div>
                <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
                    Download
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">Members</h2>
                <p className="text-slate-500">Populate your organization with its most important asset: people.</p>
            </div>

            {!importMode ? (
                <div className="grid sm:grid-cols-2 gap-6">
                    <div 
                        onClick={() => { setImportMode('manual'); addMember(); }}
                        className="p-10 rounded-[2.5rem] border border-slate-100 bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-blue-900/5 transition-all cursor-pointer group shadow-sm"
                    >
                        <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                            <UserPlus size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Manual Entry</h3>
                        <p className="text-sm text-slate-500 mt-2">Add members one by one. Best for small groups.</p>
                    </div>

                    <div 
                        onClick={() => setImportMode('csv')}
                        className="p-10 rounded-[2.5rem] border border-slate-100 bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-blue-900/5 transition-all cursor-pointer group shadow-sm"
                    >
                        <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-secondary mb-6 group-hover:bg-secondary group-hover:text-white transition-all shadow-sm">
                            <Upload size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Bulk Import</h3>
                        <p className="text-sm text-slate-500 mt-2">Upload a CSV or Excel file. Best for large congregations.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <button 
                            onClick={() => { setImportMode(null); setMembers([]); }}
                            className="text-xs font-black text-primary flex items-center gap-2 hover:underline uppercase tracking-widest"
                        >
                            <X size={14} /> Change Method
                        </button>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {importMode === 'manual' ? 'Manual Setup' : 'CSV Upload'}
                        </div>
                    </div>
                    
                    {importMode === 'manual' ? renderManualForm() : renderCSVImport()}
                </div>
            )}

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
                    {loading ? 'Saving...' : members.length > 0 ? `Import ${members.length} Members` : 'Skip for now'}
                </button>
            </div>
        </div>
    );
};

export default Members;
