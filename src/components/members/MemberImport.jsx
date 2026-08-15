import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    CheckCircle2,
    AlertCircle,
    X,
    ArrowRight,
    Database,
    ChevronRight,
    Download,
    FileText,
    Copy,
    ExternalLink
} from 'lucide-react';
import { MemberService, DepartmentService } from '../../api/services';
import { normalizeArrayResponse, entityValue } from '../../utils/apiResponse';

const MemberImport = ({ isOpen, onClose, onComplete }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState(null);
    const [csvData, setCsvData] = useState({ headers: [], rows: [] });
    const [mapping, setMapping] = useState({});
    const [previewRows, setPreviewRows] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importSummary, setImportSummary] = useState(null);
    const fileInputRef = useRef();

    const MAPPING_FIELDS = [
        { key: 'full_name', label: 'Full Name' },
        { key: 'first_name', label: 'First Name', required: true },
        { key: 'last_name', label: 'Last Name', required: true },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'status', label: 'Status', required: true },
        { key: 'grant_login_access', label: 'Grant Login Access' },
        { key: 'role', label: 'Role' },
        { key: 'department', label: 'Department' },
        { key: 'department_id', label: 'Department ID' }
    ];

    useEffect(() => {
        if (!isOpen) return;
        // preload departments for matching
        (async () => {
            try {
                const res = await DepartmentService.getAll();
                const depts = normalizeArrayResponse(res, ['departments', 'items']).map((d) => ({
                    value: entityValue(d, ['department_id', 'id']),
                    name: (d.name || d.department_name || '').trim()
                }));
                setDepartments(depts);
            } catch (e) {
                console.error('Failed to load departments for import', e);
                setDepartments([]);
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

    // Basic CSV line parser supporting quoted values and trimming
    const parseCsvText = (text) => {
        if (!text) return { headers: [], rows: [] };
        const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const lines = normalized.split('\n').filter((l) => l !== undefined);
        let headerLineIndex = 0;
        while (headerLineIndex < lines.length && lines[headerLineIndex].trim() === '') headerLineIndex++;
        if (headerLineIndex >= lines.length) return { headers: [], rows: [] };

        const parseLine = (line) => {
            const cols = [];
            let cur = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (ch === '"') {
                    if (inQuotes && line[i + 1] === '"') {
                        cur += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (ch === ',' && !inQuotes) {
                    cols.push(cur.trim());
                    cur = '';
                } else {
                    cur += ch;
                }
            }
            cols.push(cur.trim());
            return cols;
        };

        const headers = parseLine(lines[headerLineIndex]).map((h) => h.trim());
        const rawRows = [];
        for (let i = headerLineIndex + 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line || line.trim() === '') continue;
            const cols = parseLine(line);
            const row = {};
            headers.forEach((h, idx) => {
                row[h] = cols[idx] !== undefined ? cols[idx] : '';
            });
            // ignore fully empty rows
            if (Object.values(row).some((v) => v && String(v).trim() !== '')) {
                rawRows.push(row);
            }
        }

        return { headers, rows: rawRows };
    };

    const headerToKey = (header) => {
        if (!header) return '';
        const h = String(header).trim().toLowerCase();
        const map = {
            'first name': 'first_name',
            'firstname': 'first_name',
            'first_name': 'first_name',
            'last name': 'last_name',
            'lastname': 'last_name',
            'last_name': 'last_name',
            'full name': 'full_name',
            'fullname': 'full_name',
            'name': 'full_name',
            'email address': 'email',
            'emailaddress': 'email',
            'email_address': 'email',
            'email': 'email',
            'phone number': 'phone',
            'phonenumber': 'phone',
            'phone': 'phone',
            'active status': 'status',
            'status': 'status',
            'login access': 'grant_login_access',
            'login': 'grant_login_access',
            'grant_login_access': 'grant_login_access',
            'role name': 'role',
            'role': 'role',
            'unit': 'department',
            'department': 'department',
            'dept': 'department',
            'department id': 'department_id',
            'department_id': 'department_id'
        };
        return map[h] || '';
    };

    const autoMapHeaders = (headers) => {
        const m = {};
        headers.forEach((h) => {
            const key = headerToKey(h);
            if (key && !m[key]) m[key] = h;
        });
        return m;
    };

    const parseCSV = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const parsed = parseCsvText(text);
            setCsvData(parsed);
            const initialMap = autoMapHeaders(parsed.headers);
            setMapping(initialMap);
            // build initial preview rows
            const built = buildPreviewRows(parsed.rows, initialMap, departments);
            setPreviewRows(built);
            setStep(2);
        };
        reader.readAsText(file);
    };

    const isYes = (v) => {
        if (v === undefined || v === null) return false;
        const s = String(v).trim().toLowerCase();
        return ['yes', 'true', '1', 'login'].includes(s);
    };

    const parseLoginAccess = (v) => isYes(v);

    const normalizeRole = (v) => {
        // 1. Fallback to general_member if empty
        if (!v && v !== 0) return 'general_member';

        const s = String(v).trim().toLowerCase();
        const map = {
            'super admin': 'super_admin',
            'super_admin': 'super_admin',
            'fellowship admin': 'fellowship_admin',
            'fellowship_admin': 'fellowship_admin',
            'leadership committee': 'leadership_committee',
            'leadership_committee': 'leadership_committee',
            'executive': 'executive',
            'general member': 'general_member',
            'member': 'general_member' // Map old 'member' terminology safely
        };
        return map[s] || s;
    };

    const normalizeStatus = (v) => {
        if (!v && v !== 0) return '';
        const s = String(v).trim().toLowerCase();
        if (['active', 'inactive', 'pending'].includes(s)) return s === 'pending' ? 'inactive' : s;
        if (['yes', 'true', '1'].includes(s)) return 'active';
        if (['no', 'false', '0'].includes(s)) return 'inactive';
        return '';
    };

    const isValidEmail = (email) => {
        if (!email) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
    };

    const buildPreviewRows = (rawRows, mappingObj, depts) => {
        return rawRows.map((raw, idx) => {
            const get = (key) => (mappingObj[key] ? (raw[mappingObj[key]] ?? '').trim() : '');

            // Name handling
            const full = get('full_name');
            let first = get('first_name');
            let last = get('last_name');
            if (!first && full) {
                const parts = full.split(/\s+/).filter(Boolean);
                first = parts.shift() || '';
                last = parts.join(' ') || '';
            }

            const email = get('email');
            const phone = get('phone');

            const rawStatus = get('status');
            // THE FALLBACK: If status evaluates to empty, force 'active'
            const status = normalizeStatus(rawStatus) || 'active';

            const grant_login_access = parseLoginAccess(get('grant_login_access'));

            const role_raw = get('role');
            // THE FALLBACK: Force 'general_member' if somehow still empty
            const role = normalizeRole(role_raw) || 'general_member';

            const deptName = get('department');
            const deptIdRaw = get('department_id');
            // ---------------------------------------------

            let matchedDeptId = '';
            let deptMatchLabel = '';
            if (deptIdRaw) {
                const found = depts.find((d) => String(d.value) === String(deptIdRaw).trim());
                if (found) {
                    matchedDeptId = found.value;
                    deptMatchLabel = found.name;
                }
            } else if (deptName) {
                const found = depts.find((d) => d.name.trim().toLowerCase() === String(deptName).trim().toLowerCase());
                if (found) {
                    matchedDeptId = found.value;
                    deptMatchLabel = found.name;
                }
            }
            const validation = [];
            if (!first) validation.push('Missing first name');

            if (grant_login_access) {
                if (!email) validation.push('Missing email');
                else if (!isValidEmail(email)) validation.push('Invalid email');
                if (!role) validation.push('Missing or invalid role');
            }

            // 1. UPDATED: Check against your new 4-tier hierarchy
            const allowedRoles = ['super_admin', 'fellowship_admin', 'leadership_committee', 'executive', 'general_member'];
            if (role && !allowedRoles.includes(role)) {
                validation.push('Invalid role: ' + role);
            }

            if (!status) validation.push('Invalid status');

            // 2. UPDATED: Removed the old unit_head dependency checks
            if ((get('department') || get('department_id')) && !matchedDeptId) {
                validation.push('Unknown department');
            }
            return {
                index: idx,
                original: raw,
                first_name: first,
                last_name: last,
                email,
                phone,
                status,
                grant_login_access,
                role_raw,
                role,
                department_raw: deptName,
                department_id_raw: deptIdRaw,
                department_id: matchedDeptId,
                department_label: deptMatchLabel,
                validation: {
                    valid: validation.length === 0,
                    errors: validation
                },
                importStatus: 'pending',
                importError: null,
                inviteResult: null
            };
        });
    };

    const handleValidate = () => {
        const built = buildPreviewRows(csvData.rows, mapping, departments);
        setPreviewRows(built);
    };

    const downloadTemplate = () => {
        const headers = ['first_name', 'last_name', 'email', 'phone', 'status', 'grant_login_access', 'role', 'department'];
        const rows = [
            ['John', 'Choir', 'john@example.com', '08012345678', 'active', 'yes', 'fellowship_admin', 'Choir'],
            ['Sarah', 'James', 'sarah@example.com', '08012345679', 'active', 'yes', 'leadership_committee', ''],
            ['Michael', 'Paul', 'michael@example.com', '08012345670', 'active', 'yes', 'executive', ''],
            ['Mary', 'Member', 'mary@example.com', '08012345671', 'active', 'no', 'general_member', '']
        ];
        const csv = [headers.join(',')].concat(rows.map(r => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'members-template.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const downloadFailedRows = () => {
        const failed = previewRows.filter((r) => r.importStatus === 'failed' || (r.validation && !r.validation.valid));
        if (failed.length === 0) return;
        const headers = Array.from(new Set([...csvData.headers, 'errors']));
        const lines = [headers.join(',')];
        failed.forEach((fr) => {
            const row = csvData.headers.map((h) => `"${String(fr.original[h] ?? '').replace(/"/g, '""')}"`).join(',');
            const errors = `"${fr.validation.errors.concat(fr.importError ? [fr.importError] : []).join('; ')}"`;
            lines.push(`${row},${errors}`);
        });
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'members-import-failed.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const downloadInviteLinks = () => {
        const rows = previewRows.filter((r) => r.inviteResult && r.importStatus === 'success');
        if (rows.length === 0) return;
        const headers = ['name', 'email', 'role', 'invite_link', 'expires_at', 'email_sent'];
        const lines = [headers.join(',')];
        rows.forEach((r) => {
            const name = `"${[r.first_name, r.last_name].filter(Boolean).join(' ').replace(/"/g, '""')}"`;
            const email = `"${String(r.email || '').replace(/"/g, '""')}"`;
            const role = `"${String(r.role || '').replace(/"/g, '""')}"`;
            const link = `"${String(r.inviteResult?.invite_link || '').replace(/"/g, '""')}"`;
            const expires = `"${String(r.inviteResult?.expires_at || '').replace(/"/g, '""')}"`;
            const sent = `"${r.inviteResult?.email_sent ? 'true' : 'false'}"`;
            lines.push([name, email, role, link, expires, sent].join(','));
        });
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'invite-links.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const startImport = async () => {
        setImportSummary(null);
        setImporting(true);
        setStep(3);
        const rows = [...previewRows];
        let summary = { total: rows.length, success: 0, failed: 0, skipped: 0, invites_created: 0, emails_sent: 0, invite_links_available: 0 };

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
                const payload = {
                    first_name: (r.first_name || '').trim(),
                    last_name: (r.last_name || '').trim(),
                    email: (r.email || '').trim(),
                    phone: (r.phone || '').trim(),
                    status: r.status || 'inactive'
                };

                if (r.role) {
                    payload.role = r.role;
                    if ((r.role === 'unit_head' || r.role === 'department_leader') && r.department_id) {
                        payload.department_id = r.department_id;
                    }
                }

                const response = await MemberService.create(payload);
                // response is unwrapped payload
                r.importStatus = 'success';
                summary.success++;
                if (response?.invite_created) {
                    r.inviteResult = {
                        invite_link: response.invite_link,
                        email_sent: !!response.email_sent,
                        expires_at: response.expires_at,
                        invite_created: true
                    };
                    summary.invites_created++;
                    if (r.inviteResult.email_sent) summary.emails_sent++;
                    if (r.inviteResult.invite_link && !r.inviteResult.email_sent) summary.invite_links_available++;
                }
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
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-5xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
            >
                <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 md:w-10 md:h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                            <Database size={18} className="md:w-5 md:h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-tight">Import Members</h2>
                            <p className="text-[10px] md:text-sm text-slate-500">Step {step} of 4: {step === 1 ? 'Upload' : step === 2 ? 'Preview & Validate' : step === 3 ? 'Importing' : 'Results'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors shrink-0">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer" onClick={() => fileInputRef.current.click()}>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Upload size={28} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">Upload CSV</h3>
                                    <p className="text-sm text-slate-500 mt-2">Drag & drop or click to choose a CSV file containing your members.</p>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={downloadTemplate} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold">Download CSV Template</button>
                                    <button onClick={() => fileInputRef.current.click()} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold">Choose File</button>
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
                                                    <select value={mapping[f.key] || ''} onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })} className="flex-1 bg-white border border-slate-200 rounded-xl p-2 text-sm">
                                                        <option value="">(not mapped)</option>
                                                        {csvData.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pt-2">
                                            <button onClick={downloadTemplate} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold mr-2">Download Template</button>
                                            <button onClick={handleValidate} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold">Rebuild Preview</button>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <div className="text-xs text-slate-500 mb-2">Showing first {Math.min(10, previewRows.length)} of {previewRows.length} rows</div>
                                        <div className="overflow-x-auto rounded-lg border border-slate-100">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 text-xs text-slate-500">
                                                    <tr>
                                                        <th className="p-2 text-left">#</th>
                                                        <th className="p-2 text-left">Name</th>
                                                        <th className="p-2 text-left">Email</th>
                                                        <th className="p-2 text-left">Phone</th>
                                                        <th className="p-2 text-left">Status</th>
                                                        <th className="p-2 text-left">Login Access</th>
                                                        <th className="p-2 text-left">Role</th>
                                                        <th className="p-2 text-left">Department</th>
                                                        <th className="p-2 text-left">Validation</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {previewRows.slice(0, 10).map((r, i) => (
                                                        <tr key={r.index} className={r.validation.valid ? 'bg-white' : 'bg-rose-50'}>
                                                            <td className="p-2 align-top">{r.index + 1}</td>
                                                            <td className="p-2 align-top">{[r.first_name, r.last_name].filter(Boolean).join(' ')}</td>
                                                            <td className="p-2 align-top">{r.email}</td>
                                                            <td className="p-2 align-top">{r.phone}</td>
                                                            <td className="p-2 align-top">{r.status}</td>
                                                            <td className="p-2 align-top">{r.grant_login_access ? 'Yes' : 'No'}</td>
                                                            <td className="p-2 align-top">{r.role}</td>
                                                            <td className="p-2 align-top">{r.department_label || r.department_raw || r.department_id_raw}</td>
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
                                <p className="text-sm text-slate-500">This may take a few moments depending on your file size.</p>
                                <div className="overflow-y-auto max-h-60 mt-4 border-t border-slate-100 pt-4">
                                    {previewRows.map((r) => (
                                        <div key={r.index} className="flex items-center justify-between py-2 text-sm">
                                            <div className="truncate">{r.index + 1}. {[r.first_name, r.last_name].filter(Boolean).join(' ')}</div>
                                            <div className="text-xs">
                                                {r.importStatus === 'importing' && <span className="text-amber-600">Importing…</span>}
                                                {r.importStatus === 'success' && <span className="text-emerald-600">Imported</span>}
                                                {r.importStatus === 'failed' && <span className="text-rose-600">Failed</span>}
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
                                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900">Import complete</h3>
                                    <p className="text-sm text-slate-500">Review the summary and download any results you need.</p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                                    <div className="bg-slate-50 p-4 rounded-2xl text-center">
                                        <div className="text-2xl font-bold">{importSummary?.invites_created ?? 0}</div>
                                        <div className="text-xs text-slate-400">Invitations</div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={downloadFailedRows} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold">Download Failed Rows</button>
                                    <button onClick={downloadInviteLinks} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold">Download Invite Links</button>
                                </div>

                                <div className="overflow-y-auto max-h-64 border-t border-slate-100 pt-4">
                                    {previewRows.map((r) => (
                                        <div key={r.index} className="flex items-center justify-between py-2 text-sm border-b border-slate-50">
                                            <div className="truncate">{r.index + 1}. {[r.first_name, r.last_name].filter(Boolean).join(' ')} — {r.email}</div>
                                            <div className="flex items-center gap-2">
                                                {r.inviteResult?.invite_link && (
                                                    <>
                                                        <input readOnly value={r.inviteResult.invite_link} className="hidden" />
                                                        <button onClick={async () => { try { await navigator.clipboard.writeText(r.inviteResult.invite_link); } catch { } }} className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs">Copy Invite Link</button>
                                                        {!r.inviteResult.email_sent && <a href={r.inviteResult.invite_link} target="_blank" rel="noreferrer" className="px-3 py-1 bg-white border rounded-lg text-xs">Open</a>}
                                                    </>
                                                )}
                                                {r.importStatus === 'failed' && <span className="text-rose-600 text-xs">{r.importError || 'Failed'}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <button onClick={() => { onComplete?.(); onClose(); }} className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold">Done</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default MemberImport;
