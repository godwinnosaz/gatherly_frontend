import React, { useEffect, useState } from 'react';
import { Loader2, User } from 'lucide-react';
import Layout from '../components/Layout';
import { ProfileService } from '../api/services';
import { useAuth } from '../context/AuthContext';

const pickProfile = (response, fallbackUser) => {
    return response?.profile || response?.user || response?.data || response || fallbackUser || {};
};

const Profile = () => {
    const { user, role, roles, tenant } = useAuth();
    const [profile, setProfile] = useState(user || {});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;

        const loadProfile = async () => {
            try {
                const response = await ProfileService.getMe();
                if (mounted) {
                    setProfile(pickProfile(response, user));
                    setError('');
                }
            } catch (err) {
                if (mounted) {
                    setProfile(user || {});
                    setError(err?.message || 'Could not load the latest profile details.');
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadProfile();
        return () => {
            mounted = false;
        };
    }, [user]);

    const displayName = profile?.name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Profile';
    const displayRole = role || profile?.role || 'member';
    const roleList = Array.isArray(roles) && roles.length > 0 ? roles : [displayRole];

    return (
        <Layout>
            <div className="max-w-5xl mx-auto pb-20">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center">
                        <User size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
                        <p className="text-sm text-slate-500 font-medium">Your signed-in Gatherly account details.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white border border-slate-100 rounded-2xl p-8 flex items-center gap-3 text-slate-500">
                        <Loader2 className="animate-spin" size={18} />
                        <span className="text-sm font-bold">Loading profile...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <section className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-black text-slate-900 mb-6">{displayName}</h2>
                            {error && (
                                <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                                    Showing cached session details. {error}
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Info label="Email" value={profile?.email} />
                                <Info label="Phone" value={profile?.phone} />
                                <Info label="Status" value={profile?.status} />
                                <Info label="Primary Role" value={displayRole?.replace(/_/g, ' ')} />
                                <Info label="Organization" value={tenant?.name || tenant?.organization_name || tenant?.church_name} />
                            </div>
                        </section>

                        <aside className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Roles</h2>
                            <div className="flex flex-wrap gap-2">
                                {roleList.map((item) => (
                                    <span key={item} className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-black text-slate-700 capitalize">
                                        {String(item).replace(/_/g, ' ')}
                                    </span>
                                ))}
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </Layout>
    );
};

const Info = ({ label, value }) => (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 min-h-20">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-2 text-sm font-bold text-slate-800 break-words">{value || 'Not provided'}</p>
    </div>
);

export default Profile;
