import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { 
    Search, Plus, Mail, Phone, Edit, Trash2, 
    Users, UserPlus, Download, ChevronRight, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PermissionGate from '../components/PermissionGate';
import MemberImport from '../components/members/MemberImport';
import SectionCard from '../components/ui/SectionCard';

const MemberCard = ({ member }) => (
    <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="section-card section-card-hover p-8 group cursor-pointer"
    >
        <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-primary text-lg">
                    {member.first_name[0]}{member.last_name[0]}
                </div>
                <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
                        {member.first_name} {member.last_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-secondary' : 'bg-slate-300'}`} />
                        <span className="text-xs text-slate-400 capitalize">{member.status || 'Active'}</span>
                    </div>
                </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-primary/20 rounded-xl text-slate-400 hover:text-primary transition-all" title="Edit member">
                    <Edit size={16} />
                </button>
            </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-50">
            {member.email && (
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <Mail size={16} className="text-slate-300 shrink-0" />
                    <span className="truncate">{member.email}</span>
                </div>
            )}
            {member.phone && (
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <Phone size={16} className="text-slate-300 shrink-0" />
                    <span>{member.phone}</span>
                </div>
            )}
            {!member.email && !member.phone && (
                <p className="text-sm text-slate-300 italic">No contact info added yet</p>
            )}
        </div>
    </motion.div>
);

const Members = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isImportOpen, setIsImportOpen] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, [searchTerm]);

    const fetchMembers = async () => {
        try {
            const response = await api.get(`/members?search=${searchTerm}`);
            setMembers(response.data);
        } catch (error) {
            console.error('Error fetching members', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Members</h1>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-lg">
                            Monitor and manage your fellowship base.
                        </p>
                    </div>
                    
                    <PermissionGate allowedRoles={['super_admin', 'pastor', 'fellowship_admin']}>
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                            <button 
                                onClick={() => setIsImportOpen(true)}
                                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <Download size={18} />
                                <span>Import</span>
                            </button>
                            <button className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-blue-900/10">
                                <UserPlus size={18} />
                                <span>Add Member</span>
                            </button>
                        </div>
                    </PermissionGate>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SectionCard 
                        title="Total Members" 
                        description="Complete fellowship base"
                        icon={Users}
                    >
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-slate-900 tracking-tighter">{members.length}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Members</span>
                        </div>
                    </SectionCard>

                    <SectionCard 
                        title="Active Status" 
                        description="Engaged in last 30 days"
                        icon={UserPlus}
                    >
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-secondary tracking-tighter">
                                {members.filter(m => m.status === 'active').length || members.length}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Active</span>
                        </div>
                    </SectionCard>

                    <SectionCard 
                        title="Contact Reached" 
                        description="With valid email or phone"
                        icon={Mail}
                    >
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-primary tracking-tighter">
                                {members.filter(m => m.email || m.phone).length}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Reached</span>
                        </div>
                    </SectionCard>
                </div>

                <div className="relative w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={22} />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name..." 
                        className="bg-white border border-slate-200 rounded-3xl pl-16 pr-6 py-5 text-base text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all w-full placeholder:text-slate-400 shadow-sm"
                    />
                </div>

                {/* Member Cards Grid */}
                {loading ? (
                    <div className="py-24 flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-slate-400 font-medium">Loading members...</p>
                    </div>
                ) : members.length === 0 ? (
                    <div className="py-24 flex flex-col items-center text-center max-w-md mx-auto space-y-8">
                        <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center border border-blue-100 shadow-inner">
                            <Users size={40} className="text-primary/30" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">No members yet</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                Add your first member to start managing your fellowship. You can add them one by one or import your existing list.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
                            <button className="btn-primary flex-1">
                                <Plus size={18} />
                                <span>Add First Member</span>
                            </button>
                            <button 
                                onClick={() => setIsImportOpen(true)}
                                className="btn-outline flex-1"
                            >
                                <Download size={18} />
                                <span>Import List</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <AnimatePresence>
                                {members.map((member) => (
                                    <MemberCard key={member.id} member={member} />
                                ))}
                            </AnimatePresence>
                        </div>
                        <div className="text-center pt-4">
                            <p className="text-sm text-slate-400">{members.length} member{members.length !== 1 ? 's' : ''} total</p>
                        </div>
                    </>
                )}
            </div>

            <MemberImport 
                isOpen={isImportOpen} 
                onClose={() => setIsImportOpen(false)} 
                onComplete={fetchMembers}
            />
        </Layout>
    );
};

export default Members;
