import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronRight, 
    ChevronLeft, 
    CheckCircle2, 
    Home, 
    Users, 
    ShieldCheck, 
    LayoutGrid, 
    Calendar, 
    QrCode, 
    BellRing,
    Sparkles
} from 'lucide-react';
import { OnboardingService } from '../api/services';

// Step Components
import Welcome from '../components/onboarding/Welcome';
import OrgSetup from '../components/onboarding/OrgSetup';
import Leadership from '../components/onboarding/Leadership';
import Departments from '../components/onboarding/Departments';
import Members from '../components/onboarding/Members';
import Events from '../components/onboarding/Events';
import Attendance from '../components/onboarding/Attendance';
import Communication from '../components/onboarding/Communication';
import Review from '../components/onboarding/Review';

import logo from '../assets/logo.png';

const steps = [
    { id: 1, title: 'Welcome', icon: Sparkles },
    { id: 2, title: 'Church Profile', icon: Home },
    { id: 3, title: 'Leadership', icon: ShieldCheck },
    { id: 4, title: 'Departments', icon: LayoutGrid },
    { id: 5, title: 'Members', icon: Users },
    { id: 6, title: 'First Events', icon: Calendar },
    { id: 7, title: 'Attendance', icon: QrCode },
    { id: 8, title: 'Communication', icon: BellRing },
    { id: 9, title: 'Review', icon: CheckCircle2 },
];

const Onboarding = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await OnboardingService.getStatus();
                const status = response.data || response;
                if (status.onboarding_completed) {
                    navigate('/dashboard');
                } else {
                    setCurrentStep(status.onboarding_step || 1);
                }
            } catch (error) {
                console.error('Error fetching onboarding status:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, [navigate]);

    const handleNext = (data) => {
        setFormData(prev => ({ ...prev, ...data }));
        if (currentStep < steps.length) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            await OnboardingService.complete();
            navigate('/dashboard');
        } catch (error) {
            console.error('Error completing onboarding:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F9FAFB]">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing Fellowship Setup...</p>
            </div>
        );
    }

    const ProgressBar = () => (
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-12 shadow-inner border border-slate-200">
            <motion.div 
                className="h-full bg-gradient-to-r from-primary to-indigo-600"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / steps.length) * 100}%` }}
                transition={{ duration: 0.8, ease: "circOut" }}
            />
        </div>
    );

    const Sidebar = () => (
        <div className="hidden lg:flex flex-col w-72 border-r border-slate-200 p-8 bg-white">
            <div className="mb-12">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none uppercase">Gatherly</h1>
                        <p className="text-[10px] text-primary mt-1 uppercase tracking-widest font-black opacity-70">Administration</p>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 space-y-1">
                {steps.map((step) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;
                    
                    return (
                        <div 
                            key={step.id} 
                            className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 ${
                                isActive ? 'bg-blue-50 text-primary border border-blue-100 shadow-sm' : 
                                isCompleted ? 'text-secondary opacity-80' : 'text-slate-400'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                                isActive ? 'bg-primary text-white' : 
                                isCompleted ? 'bg-secondary/10 text-secondary' : 'bg-slate-50'
                            }`}>
                                {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                            </div>
                            <span className={`text-sm font-bold tracking-tight`}>{step.title}</span>
                        </div>
                    );
                })}
            </div>

            <div className="mt-auto p-5 bg-slate-50 rounded-3xl border border-slate-100 relative overflow-hidden group">
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1 relative z-10">System Support</p>
                <p className="text-[10px] text-slate-500 leading-relaxed relative z-10">
                    Our team is standing by to help you scale your fellowship operations.
                </p>
            </div>
        </div>
    );

    const MobileStepper = () => (
        <div className="lg:hidden flex overflow-x-auto hide-scrollbar gap-4 mb-10 pb-6 border-b border-slate-100">
            {steps.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                    <div 
                        key={step.id}
                        className={`shrink-0 flex items-center gap-3 p-3.5 rounded-2xl transition-all ${
                            isActive ? 'bg-blue-50 text-primary ring-2 ring-blue-100 shadow-sm' : 
                            isCompleted ? 'text-secondary' : 'text-slate-400'
                        }`}
                    >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
                            isActive ? 'bg-primary text-white' : 
                            isCompleted ? 'bg-secondary/10 text-secondary' : 'bg-slate-50'
                        }`}>
                            {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                        </div>
                        {isActive && <span className="text-[11px] font-black uppercase tracking-widest">{step.title}</span>}
                    </div>
                );
            })}
        </div>
    );

    const renderStep = () => {
        const props = { onNext: handleNext, onBack: handleBack, formData };
        switch(currentStep) {
            case 1: return <Welcome {...props} />;
            case 2: return <OrgSetup {...props} />;
            case 3: return <Leadership {...props} />;
            case 4: return <Departments {...props} />;
            case 5: return <Members {...props} />;
            case 6: return <Events {...props} />;
            case 7: return <Attendance {...props} />;
            case 8: return <Communication {...props} />;
            case 9: return <Review {...props} />;
            default: return <Welcome {...props} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex flex-col lg:flex-row overflow-hidden text-slate-900">
            <Sidebar />
            
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-50/30 blur-[120px] -z-10" />
                <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-emerald-50/30 blur-[120px] -z-10" />

                <header className="h-20 border-b border-slate-100 flex items-center justify-between px-6 md:px-12 bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
                    <div className="flex lg:hidden items-center gap-3">
                        <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                        <span className="font-black text-lg text-slate-900 tracking-tighter uppercase">Gatherly</span>
                    </div>
                    <div className="hidden lg:block" />
                    
                    <div className="flex items-center gap-6">
                        <div className="px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100 hidden sm:block">
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Step {currentStep} of {steps.length}</span>
                        </div>
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-[0.2em]"
                        >
                            Save & Exit
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-20 custom-scrollbar onboarding-container">
                    <div className="max-w-4xl mx-auto">
                        <MobileStepper />
                        <ProgressBar />
                        
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="pb-20"
                            >
                                {renderStep()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Onboarding;
