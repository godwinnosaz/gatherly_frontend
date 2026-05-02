import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { 
    ShieldAlert, BrainCircuit, Users, HeartPulse, 
    AlertCircle, Sparkles, TrendingUp, Info, ChevronRight, UserMinus,
    Calendar, DollarSign, LayoutGrid, Target, FileText, X, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MetricCard from '../components/analytics/MetricCard';
import TrendChart from '../components/analytics/TrendChart';
import ParticipationBar from '../components/analytics/ParticipationBar';

const RecommendationCard = ({ type, title, text }) => (
    <div className={`p-8 section-card section-card-hover flex gap-6 transition-all ${
        type === 'alert' ? 'bg-rose-50/50 border-rose-100 text-rose-900' :
        type === 'warning' ? 'bg-amber-50/50 border-amber-100 text-amber-900' :
        'bg-purple-50/50 border-purple-100 text-purple-900'
    }`}>
        <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${
            type === 'alert' ? 'bg-white border-rose-200 text-rose-600' :
            type === 'warning' ? 'bg-white border-amber-200 text-amber-600' :
            'bg-white border-purple-200 text-purple-600'
        }`}>
            {type === 'alert' ? <AlertCircle className="w-6 h-6 text-red-600" /> :
             type === 'warning' ? <ShieldAlert className="w-6 h-6 text-amber-600" /> :
             <Sparkles className="w-6 h-6 text-purple-600" />}
        </div>
        <div>
            <h4 className="font-black text-sm mb-1 text-slate-900 leading-none">{title}</h4>
            <p className="text-xs font-medium text-slate-500 leading-relaxed mt-2">{text}</p>
        </div>
    </div>
);

const RiskCard = ({ member }) => {
    const isHighRisk = member.risk_level === 'High Risk';
    return (
        <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                    <h4 className="text-sm font-bold text-slate-900">{member.first_name} {member.last_name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{member.phone}</p>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest border ${
                        isHighRisk ? 'bg-red-50 text-red-600 border-red-100' : 
                        'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                        {member.risk_level}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                        {member.last_seen ? `Last seen ${new Date(member.last_seen).toLocaleDateString()}` : 'Never seen'}
                    </span>
                </div>
            </div>
            <div className="pt-4 border-t border-slate-50 flex items-start gap-3">
                <UserMinus className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    {member.recommendation}
                </p>
            </div>
        </div>
    );
};

const IntelligenceCenter = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiSummary, setAiSummary] = useState('');
    const [report, setReport] = useState(null);
    const [generatingSummary, setGeneratingSummary] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);

    useEffect(() => {
        const fetchIntel = async () => {
            try {
                const response = await api.get('/intelligence/command-center');
                setData(response.data);
                handleGenerateSummary();
            } catch (error) {
                console.error('Error fetching intelligence', error);
            } finally {
                setLoading(false);
            }
        };
        fetchIntel();
    }, []);

    const handleGenerateSummary = async () => {
        setGeneratingSummary(true);
        try {
            const response = await api.post('/ai/attendance-summary');
            setAiSummary(response.data.summary);
        } catch (error) {
            console.error('AI Summary failed', error);
        } finally {
            setGeneratingSummary(false);
        }
    };

    const handleGenerateReport = async () => {
        setGeneratingReport(true);
        try {
            const response = await api.post('/ai/monthly-report');
            setReport(response.data.report);
        } catch (error) {
            console.error('AI Report failed', error);
        } finally {
            setGeneratingReport(false);
        }
    };

    if (loading) return (
        <Layout>
            <div className="h-full flex flex-col items-center justify-center space-y-6 min-h-[60vh]">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full scale-150 animate-pulse" />
                    <BrainCircuit className="w-16 h-16 text-primary relative z-10" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm animate-pulse">Loading Insights...</p>
            </div>
        </Layout>
    );

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Assistant</h1>
                        <p className="text-sm text-slate-500 mt-3 font-medium max-w-md leading-relaxed">Your smart fellowship companion. Ready to help you lead better.</p>
                    </div>
                </div>

                {/* Assistant Suggestions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <button 
                        onClick={handleGenerateSummary}
                        disabled={generatingSummary}
                        className="section-card section-card-hover p-8 text-left group relative overflow-hidden border-purple-100"
                    >
                        <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50/50 rounded-bl-full -mr-8 -mt-8 group-hover:bg-purple-100/50 transition-colors" />
                        <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100 mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm relative z-10">
                            {generatingSummary ? <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" /> : <Sparkles size={24} />}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-3">Summarize attendance</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] leading-relaxed">Quick breakdown of recent patterns</p>
                    </button>

                    <button 
                        onClick={handleGenerateReport}
                        disabled={generatingReport}
                        className="bg-white border border-purple-100 p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgba(124,58,237,0.02)] hover:shadow-xl hover:shadow-purple-900/5 transition-all text-left group relative overflow-hidden"
                    >
                        <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50/50 rounded-bl-full -mr-8 -mt-8 group-hover:bg-purple-100/50 transition-colors" />
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100 mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm relative z-10">
                            {generatingReport ? <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" /> : <FileText size={22} />}
                        </div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-2">Generate report</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">Comprehensive monthly growth audit</p>
                    </button>

                    <button 
                        onClick={() => {}}
                        className="bg-white border border-purple-100 p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgba(124,58,237,0.02)] hover:shadow-xl hover:shadow-purple-900/5 transition-all text-left group relative overflow-hidden"
                    >
                        <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50/50 rounded-bl-full -mr-8 -mt-8 group-hover:bg-purple-100/50 transition-colors" />
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100 mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm relative z-10">
                            <Calendar size={22} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-2">Write announcement</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">Draft a message for your fellowship</p>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard 
                        title="Total Members" 
                        value={data.summary.active_base} 
                        delta={5} 
                        icon={Users} 
                        color="blue" 
                    />
                    <MetricCard 
                        title="Engagement Rate" 
                        value={`${Math.round((data.summary.weekly_active / data.summary.active_base) * 100)}%`} 
                        delta={12} 
                        icon={HeartPulse} 
                        color="emerald" 
                    />
                    <MetricCard 
                        title="Giving Trend" 
                        value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(data.trends.financials[data.trends.financials.length - 1]?.income || 0)} 
                        delta={8} 
                        icon={DollarSign} 
                        color="amber" 
                    />
                    <MetricCard 
                        title="Expected Growth" 
                        value={data.summary.projected_growth} 
                        icon={TrendingUp} 
                        color="indigo" 
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <TrendChart 
                        title="Attendance Growth" 
                        subtitle="Last 6 months of attendance trends."
                        data={data.trends.growth.map(d => ({ month: d.month.split('-')[1], value: Math.min(100, (d.count / data.summary.active_base) * 100) }))} 
                    />
                    <TrendChart 
                        title="Giving Trends" 
                        subtitle="Income overview across the same period."
                        data={data.trends.financials.map(d => ({ month: d.month.split('-')[1], value: Math.min(100, (d.income / 5000) * 100) }))} 
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <ParticipationBar 
                            title="Recent Attendance" 
                            data={data.departments.map(d => ({ label: d.name, value: d.recent_attendance }))}
                            color="emerald"
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.02)] h-full">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-bold text-xl text-slate-900 tracking-tight">Department Health</h3>
                                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                                    <Target className="text-slate-400" size={20} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {data.departments.map((dept, i) => {
                                    return (
                                        <div key={i} className="p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-md transition-all hover:border-primary/20">
                                            <div className="flex justify-between items-center mb-4">
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">{dept.name}</p>
                                                <p className="text-xl font-black text-slate-900">
                                                    {Math.round((dept.recent_attendance / (dept.total_members || 1)) * 100)}%
                                                </p>
                                            </div>
                                            <div className="w-full h-2 bg-white rounded-full overflow-hidden shadow-inner border border-slate-100">
                                                <div 
                                                    className="h-full bg-secondary transition-all duration-1000"
                                                    style={{ width: `${(dept.recent_attendance / (dept.total_members || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                {data.departments.length === 0 && (
                                    <div className="col-span-full py-10 text-center">
                                        <p className="text-sm font-bold text-slate-400">No department data available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Guided Assistant Response */}
                        <div className="bg-purple-50/50 border border-purple-100 p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(124,58,237,0.03)] relative overflow-hidden group min-h-[200px] flex flex-col justify-center">
                            <div className="absolute -right-6 -top-6 w-32 h-32 bg-purple-600/5 rounded-full blur-3xl group-hover:bg-purple-600/10 transition-all" />
                            <div className="flex items-center gap-4 mb-8 relative z-10">
                                <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/20 shrink-0">
                                    <Sparkles size={22} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Assistant Response</h3>
                            </div>
                            <div className="relative z-10">
                                {generatingSummary ? (
                                    <div className="space-y-4">
                                        <div className="h-4 bg-purple-100 rounded-full w-3/4 animate-pulse" />
                                        <div className="h-4 bg-purple-100 rounded-full w-1/2 animate-pulse" />
                                    </div>
                                ) : (
                                    <p className="text-lg text-slate-700 leading-relaxed font-medium">
                                        {aiSummary || "I'm ready to help you analyze your fellowship. Choose a suggestion above or check the health metrics below."}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Retention Risk - Converted to Cards */}
                        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.02)] p-6 sm:p-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h3 className="font-bold text-xl text-slate-900 tracking-tight">Members at Risk</h3>
                                    <p className="text-sm text-slate-500 font-medium mt-1">People who haven't attended recently.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {data.risk_assessment.map((member) => (
                                    <RiskCard key={member.id} member={member} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Alerts */}
                        <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-bold text-xl text-slate-900 tracking-tight">Alerts</h3>
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            </div>
                            <div className="space-y-4">
                                {data.recommendations.map((rec, i) => (
                                    <RecommendationCard key={i} {...rec} />
                                ))}
                                {data.recommendations.length === 0 && (
                                    <div className="text-center py-10 px-6 border-2 border-dashed border-slate-50 rounded-3xl">
                                        <p className="text-sm font-bold text-slate-400">Everything looks great!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {report && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="bg-white border border-slate-100 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md">
                                            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">Monthly Report</h2>
                                            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setReport(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 sm:p-10">
                                    <div className="bg-white text-sm sm:text-base whitespace-pre-wrap font-sans leading-relaxed text-slate-700 font-medium">
                                        {report}
                                    </div>
                                </div>
                                <div className="p-6 sm:p-8 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
                                    <button 
                                        onClick={() => setReport(null)}
                                        className="btn-outline w-full sm:w-auto"
                                    >
                                        Close
                                    </button>
                                    <button 
                                        onClick={() => window.print()}
                                        className="btn-primary w-full sm:w-auto"
                                    >
                                        <Download size={20} />
                                        <span>Download PDF</span>
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </Layout>
    );
};

export default IntelligenceCenter;
