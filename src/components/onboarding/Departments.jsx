import React, { useState } from 'react';
import { LayoutGrid, Plus, X, Info } from 'lucide-react';
import { OnboardingService } from '../../api/services';

const defaultDepartments = [
    { name: 'Choir', description: 'Music and worship team' },
    { name: 'Ushers', description: 'Protocol and order' },
    { name: 'Media', description: 'Audio, visual and social media' },
    { name: 'Sunday School', description: 'Children ministry' }
];

const Departments = ({ onNext, onBack }) => {
    const [depts, setDepts] = useState(defaultDepartments);
    const [loading, setLoading] = useState(false);

    const toggleDept = (dept) => {
        if (depts.find(d => d.name === dept.name)) {
            setDepts(depts.filter(d => d.name !== dept.name));
        } else {
            setDepts([...depts, dept]);
        }
    };

    const addCustom = () => {
        const name = prompt('Department Name:');
        if (name) {
            setDepts([...depts, { name, description: '' }]);
        }
    };

    const handleNext = async () => {
        setLoading(true);
        try {
            await OnboardingService.setupDepartments({ departments: depts, step: 4 });
            onNext({ departments: depts });
        } catch (error) {
            console.error('Error saving departments:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">Departments</h2>
                <p className="text-slate-500">Select or create the functional units in your organization.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                {[...defaultDepartments, { name: 'Protocol' }, { name: 'Security' }, { name: 'Evangelism' }, { name: 'Welfare' }].map((dept) => {
                    const isSelected = depts.find(d => d.name === dept.name);
                    return (
                        <div 
                            key={dept.name}
                            onClick={() => toggleDept(dept)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                                isSelected 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'bg-white border-slate-100 hover:border-slate-200'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                    isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                                }`}>
                                    <LayoutGrid size={20} />
                                </div>
                                <span className={`font-semibold ${isSelected ? 'text-primary' : 'text-slate-700'}`}>{dept.name}</span>
                            </div>
                            {isSelected && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"><X size={12} className="text-white" /></div>}
                        </div>
                    );
                })}
                
                <button 
                    onClick={addCustom}
                    className="p-4 rounded-2xl border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 text-slate-500 font-bold"
                >
                    <Plus size={20} />
                    Custom Department
                </button>
            </div>

            <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex gap-4">
                <Info size={20} className="text-slate-400 shrink-0" />
                <p className="text-xs text-slate-500 leading-relaxed">
                    You can assign leaders and members to these departments in the next steps. Departments help in organizing attendance and specialized communication.
                </p>
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
                    {loading ? 'Saving...' : 'Next Step'}
                </button>
            </div>
        </div>
    );
};

export default Departments;
