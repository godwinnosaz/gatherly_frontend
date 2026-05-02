import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Upload, 
    FileText, 
    CheckCircle2, 
    AlertCircle, 
    X, 
    ArrowRight, 
    Database, 
    ChevronRight,
    Table,
    Settings2,
    Download,
    Sparkles
} from 'lucide-react';
import axios from '../../api/axios';

const MemberImport = ({ isOpen, onClose, onComplete }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState(null);
    const [csvData, setCsvData] = useState({ headers: [], rows: [] });
    const [mapping, setMapping] = useState({});
    const [loading, setLoading] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [aiSuggesting, setAiSuggesting] = useState(false);
    const fileInputRef = useRef();

    const GATHERLY_FIELDS = [
        { key: 'firstName', label: 'First Name', required: true },
        { key: 'lastName', label: 'Last Name', required: true },
        { key: 'email', label: 'Email Address', required: false },
        { key: 'phone', label: 'Phone Number', required: false },
        { key: 'gender', label: 'Gender', required: false },
        { key: 'department', label: 'Department', required: false },
    ];

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseCSV(selectedFile);
        }
    };

    const parseCSV = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const rows = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim());
                const row = {};
                headers.forEach((h, i) => row[h] = values[i]);
                return row;
            }).filter(r => Object.values(r).some(v => v));

            setCsvData({ headers, rows });
            
            // Auto-mapping attempt
            const initialMapping = {};
            headers.forEach(h => {
                const match = GATHERLY_FIELDS.find(f => 
                    f.label.toLowerCase() === h.toLowerCase() || 
                    f.key.toLowerCase() === h.toLowerCase()
                );
                if (match) initialMapping[match.key] = h;
            });
            setMapping(initialMapping);
            setStep(2);
        };
        reader.readAsText(file);
    };

    const handleAiSuggestion = async () => {
        setAiSuggesting(true);
        try {
            const response = await axios.post('/ai/csv-analyze', {
                headers: csvData.headers,
                sampleRows: csvData.rows.slice(0, 3)
            });
            setMapping({ ...mapping, ...response.data });
        } catch (error) {
            console.error('AI suggestion failed:', error);
        } finally {
            setAiSuggesting(false);
        }
    };

    const handleProcessImport = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('mapping', JSON.stringify(mapping));
            formData.append('options', JSON.stringify({ duplicateStrategy: 'skip' }));

            const response = await axios.post('/import/upload-csv', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setImportResult(response.data);
            setStep(4);
        } catch (error) {
            console.error('Import failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-4xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 md:w-10 md:h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                            <Database size={18} className="md:w-5 md:h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-tight">Member Migration</h2>
                            <p className="text-[10px] md:text-sm text-slate-500">Step {step} of 4: {
                                step === 1 ? 'Upload File' : 
                                step === 2 ? 'Map Fields' : 
                                step === 3 ? 'Processing' : 'Result Summary'
                            }</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors shrink-0">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div 
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div 
                                    onClick={() => fileInputRef.current.click()}
                                    className="border-2 border-dashed border-slate-200 rounded-2xl md:rounded-[2rem] p-8 md:p-12 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                                >
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        accept=".csv" 
                                        className="hidden" 
                                    />
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-50 text-indigo-600 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                                        <Upload size={28} className="md:w-8 md:h-8" />
                                    </div>
                                    <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">Upload your member list</h3>
                                    <p className="text-xs md:text-sm text-slate-500 max-w-xs md:max-w-sm mx-auto leading-relaxed">
                                        Drag and drop your CSV file here, or click to browse.
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-4 md:p-6 rounded-2xl flex items-start gap-3 md:gap-4 border border-slate-100">
                                    <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                                        <AlertCircle size={18} className="text-amber-500 md:w-5 md:h-5" />
                                    </div>
                                    <div className="text-xs md:text-sm text-slate-600">
                                        <p className="font-bold text-slate-900 mb-1">Important Note</p>
                                        <p>CSV must contain 'First Name' and 'Last Name' columns.</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div 
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 pb-10 sm:pb-0"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-4">
                                    <h3 className="font-bold text-slate-900">Map Columns</h3>
                                    <button 
                                        onClick={handleAiSuggestion}
                                        disabled={aiSuggesting}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-colors disabled:opacity-50 w-full sm:w-auto border border-indigo-100"
                                    >
                                        <Sparkles size={14} />
                                        {aiSuggesting ? 'AI Analyzing...' : 'Suggest Mappings (AI)'}
                                    </button>
                                </div>
                                <div className="grid gap-3">
                                    {GATHERLY_FIELDS.map((field) => (
                                        <div key={field.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-100 transition-all focus-within:border-indigo-200">
                                            <div className="sm:w-48">
                                                <p className="font-bold text-slate-900 text-sm">{field.label}</p>
                                                {field.required && <span className="text-[9px] text-rose-500 font-bold uppercase tracking-widest">Required</span>}
                                            </div>
                                            <ChevronRight className="hidden sm:block text-slate-300" size={16} />
                                            <select 
                                                value={mapping[field.key] || ''}
                                                onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                                                className="w-full sm:flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-xs md:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            >
                                                <option value="">Select Column...</option>
                                                {csvData.headers.map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && importResult && (
                            <motion.div 
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-8 py-4"
                            >
                                <div className="text-center space-y-4">
                                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900">Migration Successful!</h3>
                                    <p className="text-slate-500">We've finished importing your member list.</p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-slate-50 p-6 rounded-3xl text-center">
                                        <p className="text-3xl font-bold text-slate-900">{importResult.summary.total}</p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total</p>
                                    </div>
                                    <div className="bg-emerald-50 p-6 rounded-3xl text-center border border-emerald-100">
                                        <p className="text-3xl font-bold text-emerald-600">{importResult.summary.success}</p>
                                        <p className="text-xs font-bold text-emerald-600/60 uppercase tracking-widest mt-1">Imported</p>
                                    </div>
                                    <div className="bg-amber-50 p-6 rounded-3xl text-center border border-amber-100">
                                        <p className="text-3xl font-bold text-amber-600">{importResult.summary.duplicates}</p>
                                        <p className="text-xs font-bold text-amber-600/60 uppercase tracking-widest mt-1">Skipped</p>
                                    </div>
                                    <div className="bg-rose-50 p-6 rounded-3xl text-center border border-rose-100">
                                        <p className="text-3xl font-bold text-rose-600">{importResult.summary.failed}</p>
                                        <p className="text-xs font-bold text-rose-600/60 uppercase tracking-widest mt-1">Failed</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => {
                                        onComplete?.();
                                        onClose();
                                    }}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold transition-all hover:bg-slate-800"
                                >
                                    Finish & View Members
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                {step < 4 && (
                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                        <button 
                            onClick={onClose}
                            className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        {step === 2 && (
                            <button 
                                onClick={handleProcessImport}
                                disabled={loading}
                                className="flex items-center gap-2 px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                            >
                                {loading ? 'Importing...' : 'Start Migration'}
                                <ArrowRight size={18} />
                            </button>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default MemberImport;
