import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, User } from 'lucide-react';
import { MemberService } from '../api/services';

const normalizePublicMember = (response) => response?.profile || response?.member || response?.data || response || null;

const PublicMemberProfile = () => {
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;

        const loadProfile = async () => {
            try {
                const response = await MemberService.getPublicProfile(id);
                if (mounted) setProfile(normalizePublicMember(response));
            } catch (err) {
                if (mounted) setError(err?.message || 'This public member profile is unavailable.');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadProfile();
        return () => {
            mounted = false;
        };
    }, [id]);

    const name = profile?.name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');

    return (
        <main className="min-h-screen bg-[#F9FAFB] px-4 py-10 text-slate-900">
            <div className="max-w-3xl mx-auto">
                <Link to="/login" className="text-xs font-black uppercase tracking-widest text-primary">Gatherly</Link>
                <section className="mt-8 bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm">
                    {loading ? (
                        <div className="flex items-center gap-3 text-slate-500">
                            <Loader2 className="animate-spin" size={18} />
                            <span className="text-sm font-bold">Loading public profile...</span>
                        </div>
                    ) : error || !profile ? (
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">Profile unavailable</h1>
                            <p className="mt-3 text-sm font-medium text-slate-500">{error || 'No public member profile was found.'}</p>
                        </div>
                    ) : (
                        <div>
                            <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mb-6">
                                <User size={24} />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{name || 'Member'}</h1>
                            {profile?.bio && <p className="mt-4 text-sm leading-6 text-slate-600">{profile.bio}</p>}
                            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <PublicInfo label="Role" value={profile?.public_role || profile?.role} />
                                <PublicInfo label="Department" value={profile?.department_name || profile?.department} />
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
};

const PublicInfo = ({ label, value }) => (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-2 text-sm font-bold text-slate-800 break-words capitalize">{value ? String(value).replace(/_/g, ' ') : 'Not published'}</p>
    </div>
);

export default PublicMemberProfile;
