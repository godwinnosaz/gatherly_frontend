import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  LayoutGrid, Plus, Search, Edit, Trash2, Loader2, 
  CheckCircle, AlertCircle, X, Shield, Users 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DepartmentService, MemberService } from '../api/services';
import { normalizeArrayResponse, entityValue, sameApiId } from '../utils/apiResponse';
import { ConfirmModal } from '../components/ui/Modal';

const normalizeDepartments = (response) => normalizeArrayResponse(response, ['departments', 'items']).map((department) => ({
    ...department,
    value: entityValue(department, ['department_id', 'id']),
    name: department.name || department.department_name || 'Unnamed Unit'
}));

const normalizeMembers = (response) => normalizeArrayResponse(response, ['members', 'items']).map((member) => ({
    ...member,
    value: entityValue(member, ['member_id', 'user_id', 'id']),
    name: member.name || [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email || 'Unnamed Member'
}));

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    
    // Modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    
    // Form fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [leaderId, setLeaderId] = useState('');
    const [status, setStatus] = useState('active');
    
    // Search
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [deptsData, membersData] = await Promise.all([
                DepartmentService.getAll(),
                MemberService.getAll().catch(() => ({ data: [] }))
            ]);
            
            setDepartments(normalizeDepartments(deptsData));
            setMembers(normalizeMembers(membersData));
        } catch (err) {
            console.error('[Departments] Fetch error:', err);
            setError(err.message || 'Failed to load units. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const triggerSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 4000);
    };

    const openCreateModal = () => {
        setEditingDept(null);
        setName('');
        setDescription('');
        setLeaderId(members[0]?.value || '');
        setStatus('active');
        setModalOpen(true);
    };

    const openEditModal = (dept) => {
        setEditingDept(dept);
        setName(typeof dept.name === 'string' ? dept.name : '');
        setDescription(dept.description || '');
        setLeaderId(dept.leader_member_id || '');
        setStatus(dept.status || 'active');
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setError(null);

        // Strong guard: Ensure name is always a string, never an array.
        let safeName = name;
        if (Array.isArray(safeName)) {
            safeName = safeName.join(' ').trim();
        } else if (typeof safeName !== 'string') {
            safeName = String(safeName || '').trim();
        } else {
            safeName = safeName.trim();
        }

        if (!safeName) {
            setError('Unit name is required.');
            setSubmitLoading(false);
            return;
        }

        const payload = {
            name: safeName,
            description: description.trim(),
            leader_id: leaderId || null,
            status: status,
            department_id: editingDept ? editingDept.department_id : undefined
        };

        // Submitting payload for create/update

        try {
            if (editingDept) {
                await DepartmentService.update(editingDept.value || editingDept.department_id, payload);
                triggerSuccess(`Unit "${safeName}" updated successfully!`);
            } else {
                await DepartmentService.create(payload);
                triggerSuccess(`Unit "${safeName}" created successfully!`);
            }
            setModalOpen(false);
            await fetchData();
        } catch (err) {
            console.error('[Departments] Save error:', err);
            setError(err.message || 'Failed to save unit. Check input.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = (dept) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Unit?',
            message: `Are you absolutely sure you want to delete the unit "${dept.name}"?`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setError(null);
                try {
                    await DepartmentService.delete(dept.value || dept.id);
                    triggerSuccess(`Unit "${dept.name}" deleted successfully.`);
                    await fetchData();
                } catch (err) {
                    console.error('[Departments] Delete error:', err);
                    setError(err.message || 'Failed to delete unit.');
                }
            }
        });
    };

    // Filter departments based on search
    const filteredDepts = departments.filter(d => {
        const dName = typeof d.name === 'string' ? d.name.toLowerCase() : '';
        const dDesc = typeof d.description === 'string' ? d.description.toLowerCase() : '';
        const query = searchQuery.toLowerCase();
        return dName.includes(query) || dDesc.includes(query);
    });

    const getLeaderName = (id) => {
        const leader = members.find(m => sameApiId(m.value, id));
        return leader ? leader.name : 'No leader assigned';
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Upper banner */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Fellowship Units</h1>
                        <p className="text-slate-500 font-medium leading-relaxed">Manage ministries, small groups, and functional departments inside Gatherly.</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={openCreateModal}
                        className="bg-primary hover:bg-primary/95 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 self-start transition-all"
                    >
                        <Plus size={20} />
                        Create Unit
                    </motion.button>
                </div>

                {/* Status messages */}
                <AnimatePresence>
                    {successMessage && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 font-semibold shadow-sm"
                        >
                            <CheckCircle size={20} className="text-emerald-600" />
                            <span>{successMessage}</span>
                        </motion.div>
                    )}

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3 font-semibold shadow-sm"
                        >
                            <AlertCircle size={20} className="text-red-600" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Filters */}
                <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.015)] flex items-center gap-3 max-w-md">
                    <Search className="text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search units by name or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-none outline-none font-bold text-sm text-slate-800 placeholder-slate-400"
                    />
                </div>

                {/* Main section */}
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-400">
                        <Loader2 className="animate-spin text-primary" size={40} />
                        <span className="font-bold text-sm">Loading fellowship units...</span>
                    </div>
                ) : filteredDepts.length === 0 ? (
                    <div className="bg-white border border-slate-100 p-16 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.015)] text-center flex flex-col items-center justify-center max-w-xl mx-auto space-y-6">
                        <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
                            <LayoutGrid size={36} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">No Units Found</h3>
                            <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
                                {searchQuery 
                                    ? "We couldn't find any units matching your search query. Try broadening your filter."
                                    : "There are no units created for this fellowship yet. Let's create the first one!"}
                            </p>
                        </div>
                        {!searchQuery && (
                            <button
                                onClick={openCreateModal}
                                className="bg-blue-50 hover:bg-blue-100 text-primary border border-blue-100 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
                            >
                                <Plus size={18} />
                                Add First Unit
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDepts.map((dept) => (
                            <motion.div
                                key={dept.value || dept.id}
                                layout
                                className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.015)] flex flex-col justify-between hover:shadow-xl hover:shadow-blue-900/5 hover:border-primary/10 transition-all duration-300 group relative"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors shadow-sm shrink-0">
                                            <LayoutGrid size={22} />
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                                            dept.status === 'active' 
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                            : 'bg-slate-50 text-slate-500 border border-slate-100'
                                        }`}>
                                            {dept.status || 'active'}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase group-hover:text-primary transition-colors">
                                            {dept.name}
                                        </h3>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-3">
                                            {dept.description || 'No description provided.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-slate-50 mt-6 pt-5 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Shield size={16} className="text-slate-300" />
                                        <span className="text-xs font-bold text-slate-500 truncate max-w-[120px]">
                                            {getLeaderName(dept.leader_member_id)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => openEditModal(dept)}
                                            className="p-2.5 hover:bg-blue-50 text-slate-400 hover:text-primary border border-transparent hover:border-blue-100 rounded-xl transition-all"
                                            title="Edit Unit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(dept)}
                                            className="p-2.5 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-transparent hover:border-red-100 rounded-xl transition-all"
                                            title="Delete Unit"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Add/Edit Modal */}
                <AnimatePresence>
                    {modalOpen && (
                        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                            {/* Backdrop */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setModalOpen(false)}
                                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                            />

                            {/* Modal Content */}
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: 'spring', damping: 25 }}
                                className="bg-white border border-slate-100 w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative z-10 overflow-hidden"
                            >
                                <button 
                                    onClick={() => setModalOpen(false)}
                                    className="absolute right-6 top-6 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={16} />
                                </button>

                                <div className="mb-6 space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                                        {editingDept ? 'Edit Fellowship Unit' : 'Create Fellowship Unit'}
                                    </h3>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                        {editingDept ? 'Modify details for this active fellowship unit.' : 'Register a new functional unit for attendance and organizational metrics.'}
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-900 tracking-wider uppercase">Unit Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Choir, Media Unit, Ushers"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white rounded-2xl px-5 py-3.5 outline-none font-bold text-sm text-slate-800 transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-900 tracking-wider uppercase">Description</label>
                                        <textarea 
                                            placeholder="Briefly state the purpose or duties of this unit..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white rounded-2xl px-5 py-3.5 outline-none font-bold text-sm text-slate-800 transition-all min-h-[100px] resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-900 tracking-wider uppercase">Unit Leader</label>
                                            <select 
                                                value={leaderId}
                                                onChange={(e) => setLeaderId(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white rounded-2xl px-5 py-3.5 outline-none font-bold text-sm text-slate-800 transition-all cursor-pointer"
                                            >
                                                <option value="">No leader assigned</option>
                                                {members.map(m => (
                                                    <option key={m.user_id} value={m.value}>
                                                        {m.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-900 tracking-wider uppercase">Status</label>
                                            <select 
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white rounded-2xl px-5 py-3.5 outline-none font-bold text-sm text-slate-800 transition-all cursor-pointer"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                                        <button
                                            type="button"
                                            onClick={() => setModalOpen(false)}
                                            className="px-6 py-3.5 rounded-2xl border border-slate-100 hover:bg-slate-50 text-slate-500 hover:text-slate-800 font-bold transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitLoading}
                                            className="bg-primary hover:bg-primary/95 disabled:opacity-50 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 transition-all"
                                        >
                                            {submitLoading && <Loader2 size={16} className="animate-spin" />}
                                            {editingDept ? 'Save Changes' : 'Create Unit'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={confirmModal.onConfirm}
                    title={confirmModal.title}
                    message={confirmModal.message}
                />
            </div>
        </Layout>
    );
};

export default Departments;
