import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, CheckCircle2, AlertCircle, X,
    Database, FileText, Download, Copy, ExternalLink
} from 'lucide-react';
import { FinanceService, FinanceAccountsService } from '../../api/services';

const FinanceImport = ({ isOpen, onClose, onComplete }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState(null);
    const [csvData, setCsvData] = useState({ headers: [], rows: [] });
    const [mapping, setMapping] = useState({});
    const [previewRows, setPreviewRows] = useState([]);
    
    // Lookups
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    
    const [importing, setImporting] = useState(false);
    const [importSummary, setImportSummary] = useState(null);
    const fileInputRef = useRef();

    const MAPPING_FIELDS = [
        { key: 'date', label: 'Date', required: true },
        { key: 'type', label: 'Type (Income/Expense)', required: true },
        { key: 'amount', label: 'Amount', required: true },
        { key: 'account', label: 'Account Name/ID', required: true },
        { key: 'category', label: 'Category Name/ID', required: true },
        { key: 'description', label: 'Description' },
        { key: 'reference_number', label: 'Reference Number' }
    ];

    // Preload Accounts and Categories for mapping Lookups
    useEffect(() => {
        if (!isOpen) return;
        (async () => {
            try {
                const [acctsRes, catsRes] = await Promise.all([
                    FinanceAccountsService.getAll(),
                    FinanceService.getCategories()
                ]);
                
                // Extremely defensive normalization (same as Finance.jsx)
                const extractData = (payload) => Array.isArray(payload) ? payload : (payload?.data?.data || payload?.data || []);
                const extractedAccts = extractData(acctsRes);
                const extractedCats = extractData(catsRes);
                
                setAccounts(extractedAccts.map(a => ({ id: a.id || a.account_id, name: String(a.account_name || a.name || '').trim().toLowerCase() })));
                
                // Flatten categories if they are grouped by income/expense
                let flatCats = [];
                if (!Array.isArray(extractedCats) && typeof extractedCats === 'object') {
                    flatCats = [...(extractedCats.income || []), ...(extractedCats.expense || [])];
                } else {
                    flatCats = extractedCats;
                }
                setCategories(flatCats.map(c => ({ id: c.id || c.category_id, name: String(c.name || c.category_name || '').trim().toLowerCase() })));

            } catch (e) {
                console.error('Failed to load lookups for finance import', e);
            }
        })();
    }, [isOpen]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseCSV(selectedFile);
        }
    };

    const parseCsvText = (text) => {
        if (!text) return { headers: [], rows: [] };
        const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l !== undefined);
        let headerLineIndex = 0;
        while (headerLineIndex < lines.length && lines[headerLineIndex].trim() === '') headerLineIndex++;
        if (headerLineIndex >= lines.length) return { headers: [], rows: [] };

        const parseLine = (line) => {
            const cols = [];
            let cur = '', inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (ch === '"') {
                    if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; } 
                    else { inQuotes = !inQuotes; }
                } else if (ch === ',' && !inQuotes) { cols.push(cur.trim()); cur = ''; } 
                else { cur += ch; }
            }
            cols.push(cur.trim());
            return cols;
        };

        const headers = parseLine(lines[headerLineIndex]).map(h => h.trim());
        const rawRows = [];
        for (let i = headerLineIndex + 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line || line.trim() === '') continue;
            const cols = parseLine(line);
            const row = {};
            headers.forEach((h, idx) => { row[h] = cols[idx] !== undefined ? cols[idx] : ''; });
            if (Object.values(row).some((v) => v && String(v).trim() !== '')) rawRows.push(row);
        }
        return { headers, rows: rawRows };
    };

    const headerToKey = (header) => {
        const h = String(header).trim().toLowerCase();
        const map = {
            'date': 'date', 'transaction date': 'date',
            'type': 'type', 'transaction type': 'type', 'income/expense': 'type',
            'amount': 'amount', 'value': 'amount',
            'account': 'account', 'account name': 'account', 'ledger': 'account',
            'category': 'category', 'category name': 'category',
            'description': 'description', 'title': 'description', 'memo': 'description',
            'reference': 'reference_number', 'ref': 'reference_number', 'reference number': 'reference_number'
        };
        return map[h] || '';
    };

    const parseCSV = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const parsed = parseCsvText(e.target.result);
            setCsvData(parsed);
            
            const initialMap = {};
            parsed.headers.forEach(h => {
                const key = headerToKey(h);
                if (key && !initialMap[key]) initialMap[key] = h;
            });
            setMapping(initialMap);
            setPreviewRows(buildPreviewRows(parsed.rows, initialMap));
            setStep(2);
        };
        reader.readAsText(file);
    };

    const buildPreviewRows = (rawRows, mappingObj) => {
        return rawRows.map((raw, idx) => {
            const get = (key) => (mappingObj[key] ? (raw[mappingObj[key]] ?? '').trim() : '');

            // Normalizations
            const rawAmount = get('amount');
            const cleanAmount = parseFloat(rawAmount.replace(/[^0-9.-]+/g,"")); // strips commas and currency symbols
            
            const rawType = get('type').toLowerCase();
            const type = ['income', 'expense'].includes(rawType) ? rawType : 
                         ['in', 'credit', 'deposit'].includes(rawType) ? 'income' :
                         ['out', 'debit', 'withdrawal'].includes(rawType) ? 'expense' : 'income'; // default fallback

            const rawDate = get('date');
            let parsedDate = rawDate;
            try {
                if (rawDate) parsedDate = new Date(rawDate).toISOString().split('T')[0];
            } catch (e) { /* keep raw if invalid */ }

            const acctSearch = get('account').toLowerCase();
            const matchedAcct = accounts.find(a => a.name === acctSearch || String(a.id) === acctSearch);
            
            const catSearch = get('category').toLowerCase();
            const matchedCat = categories.find(c => c.name === catSearch || String(c.id) === catSearch);

            // Validations
            const validation = [];
            if (!parsedDate || isNaN(Date.parse(parsedDate))) validation.push('Invalid Date');
            if (isNaN(cleanAmount) || cleanAmount <= 0) validation.push('Invalid Amount');
            if (!matchedAcct) validation.push('Unknown Account');
            if (!matchedCat) validation.push('Unknown Category');

            return {
                index: idx,
                original: raw,
                date: parsedDate || new Date().toISOString().split('T')[0], // Fallback to today
                type,
                amount: cleanAmount,
                account_id: matchedAcct?.id || '',
                account_label: matchedAcct?.name || get('account'),
                category_id: matchedCat?.id || '',
                category_label: matchedCat?.name || get('category'),
                description: get('description'),
                reference_number: get('reference_number'),
                validation: { valid: validation.length === 0, errors: validation },
                importStatus: 'pending'
            };
        });
    };

    const handleValidate = () => setPreviewRows(buildPreviewRows(csvData.rows, mapping));

    const downloadTemplate = () => {
        const csv = 'Date,Type,Amount,Account,Category,Description,Reference Number\n2026-06-22,income,50000,"General Account","Tithe","Sunday Service","REF-001"\n2026-06-23,expense,15000,"Choir Sub-Ledger","Equipment","Microphone Cable","REF-002"';
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        a.download = 'finance-import-template.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    const startImport = async () => {
        setImportSummary(null);
        setImporting(true);
        setStep(3);
        const rows = [...previewRows];
        let summary = { total: rows.length, success: 0, failed: 0, skipped: 0 };

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            if (!r.validation.valid) {
                r.importStatus = 'skipped';
                summary.skipped++;
                setPreviewRows([...rows]);
                continue;
            }

            r.importStatus = 'importing';
            setPreviewRows([...rows]);

            try {
                await FinanceService.recordTransaction({
                    amount: r.amount,
                    type: r.type,
                    account_id: r.account_id,
                    category_id: r.category_id,
                    description: r.description || `${r.category_label} Import`,
                    date: r.date,
                    reference_number: r.reference_number || null,
                    strict_mode: false
                });
                r.importStatus = 'success';
                summary.success++;
            } catch (err) {
                r.importStatus = 'failed';
                r.importError = err.message || 'Import failed';
                summary.failed++;
            } finally {
                setPreviewRows([...rows]);
            }
        }

        setImportSummary(summary);
        setImporting(false);
        setStep(4);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-5xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
                <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 md:w-10 md:h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                            <Database size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-tight">Import Transactions</h2>
                            <p className="text-[10px] md:text-sm text-slate-500">Step {step} of 4: {step === 1 ? 'Upload' : step === 2 ? 'Preview & Validate' : step === 3 ? 'Importing' : 'Results'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full"><X size={20} className="text-slate-400" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer" onClick={() => fileInputRef.current.click()}>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Upload size={28} /></div>
                                    <h3 className="text-lg font-bold text-slate-900">Upload CSV</h3>
                                    <p className="text-sm text-slate-500 mt-2">Drag & drop or click to choose a CSV file containing your transactions.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={downloadTemplate} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold">Download CSV Template</button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-900">Preview & Validate</h3>
                                    <div className="flex items-center gap-2">
                                        <button onClick={handleValidate} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold">Validate CSV</button>
                                        <button onClick={startImport} disabled={importing || previewRows.filter(r => r.validation.valid).length === 0} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">Start Import</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1 space-y-3">
                                        <p className="text-xs text-slate-500">Column mapping (adjust if auto-detection is incorrect)</p>
                                        <div className="space-y-2">
                                            {MAPPING_FIELDS.map((f) => (
                                                <div key={f.key} className="flex items-center gap-2">
                                                    <div className="w-32 text-sm font-bold text-slate-700">{f.label}</div>
                                                    <select value={mapping[f.key] || ''} onChange={(e) => { setMapping({ ...mapping, [f.key]: e.target.value }); handleValidate(); }} className="flex-1 bg-white border border-slate-200 rounded-xl p-2 text-sm">
                                                        <option value="">(not mapped)</option>
                                                        {csvData.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <div className="text-xs text-slate-500 mb-2">Showing first {Math.min(10, previewRows.length)} of {previewRows.length} rows</div>
                                        <div className="overflow-x-auto rounded-lg border border-slate-100">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 text-xs text-slate-500">
                                                    <tr>
                                                        <th className="p-2 text-left">Date</th>
                                                        <th className="p-2 text-left">Type</th>
                                                        <th className="p-2 text-left">Amount</th>
                                                        <th className="p-2 text-left">Account</th>
                                                        <th className="p-2 text-left">Category</th>
                                                        <th className="p-2 text-left">Validation</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {previewRows.slice(0, 10).map((r) => (
                                                        <tr key={r.index} className={r.validation.valid ? 'bg-white' : 'bg-rose-50'}>
                                                            <td className="p-2 align-top">{r.date}</td>
                                                            <td className="p-2 align-top capitalize">{r.type}</td>
                                                            <td className="p-2 align-top font-mono">{r.amount || '-'}</td>
                                                            <td className="p-2 align-top capitalize">{r.account_label}</td>
                                                            <td className="p-2 align-top capitalize">{r.category_label}</td>
                                                            <td className="p-2 align-top text-xs text-rose-600">{r.validation.valid ? 'OK' : r.validation.errors.join('; ')}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="importing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                    <FileText size={36} className="animate-spin text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold">Importing rows...</h3>
                                <div className="overflow-y-auto max-h-60 mt-4 border-t border-slate-100 pt-4">
                                    {previewRows.map((r) => (
                                        <div key={r.index} className="flex items-center justify-between py-2 text-sm">
                                            <div className="truncate">{r.index + 1}. {r.description || r.category_label}</div>
                                            <div className="text-xs">
                                                {r.importStatus === 'importing' && <span className="text-amber-600">Importing…</span>}
                                                {r.importStatus === 'success' && <span className="text-emerald-600">Imported</span>}
                                                {r.importStatus === 'failed' && <span className="text-rose-600">Failed: {r.importError}</span>}
                                                {r.importStatus === 'skipped' && <span className="text-amber-600">Skipped</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div key="result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900">Import complete</h3>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl text-center">
                                        <div className="text-2xl font-bold">{importSummary?.total ?? 0}</div>
                                        <div className="text-xs text-slate-400">Total</div>
                                    </div>
                                    <div className="bg-emerald-50 p-4 rounded-2xl text-center">
                                        <div className="text-2xl font-bold text-emerald-600">{importSummary?.success ?? 0}</div>
                                        <div className="text-xs text-emerald-600">Imported</div>
                                    </div>
                                    <div className="bg-amber-50 p-4 rounded-2xl text-center">
                                        <div className="text-2xl font-bold text-amber-600">{importSummary?.skipped ?? 0}</div>
                                        <div className="text-xs text-amber-600">Skipped</div>
                                    </div>
                                    <div className="bg-rose-50 p-4 rounded-2xl text-center">
                                        <div className="text-2xl font-bold text-rose-600">{importSummary?.failed ?? 0}</div>
                                        <div className="text-xs text-rose-600">Failed</div>
                                    </div>
                                </div>
                                <button onClick={() => { onComplete?.(); onClose(); }} className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold">Done</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default FinanceImport;