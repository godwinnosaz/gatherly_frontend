import React, { useEffect, useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import Layout from '../components/Layout';
import { TenantService } from '../api/services';
import { useAuth } from '../context/AuthContext';

const normalizeTenant = (response, cachedTenant) => {
    return response?.tenant || response?.profile || response?.data?.tenant || response?.data || cachedTenant || {};
};

const FellowshipProfile = () => {
    const { tenant } = useAuth();
    const [profile, setProfile] = useState(tenant || {});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;

        const loadProfile = async () => {
            try {
                const response = await TenantService.getCurrentTenantProfile();
                if (mounted) {
                    setProfile(normalizeTenant(response, tenant));
                    setError('');
                }
            } catch (err) {
                if (mounted) {
                    setProfile(tenant || {});
                    setError(err?.message || 'Could not load fellowship profile.');
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadProfile();
        return () => {
            mounted = false;
        };
    }, [tenant]);

    const name = profile?.name || profile?.organization_name || profile?.church_name || 'Fellowship Profile';

    return (
        <Layout>
            <div className="max-w-5xl mx-auto pb-20">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fellowship Profile</h1>
                        <p className="text-sm text-slate-500 font-medium">Organization details currently available from the backend session.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white border border-slate-100 rounded-2xl p-8 flex items-center gap-3 text-slate-500">
                        <Loader2 className="animate-spin" size={18} />
                        <span className="text-sm font-bold">Loading fellowship profile...</span>
                    </div>
                ) : (
                    <section className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-xl font-black text-slate-900 mb-6">{name}</h2>
                        {error && (
                            <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                                Showing cached organization details. {error}
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Info label="Organization" value={name} />
                            <Info label="Slug" value={profile?.slug} />
                            <Info label="Email" value={profile?.email || profile?.contact_email} />
                            <Info label="Phone" value={profile?.phone || profile?.contact_phone} />
                            <Info label="Location" value={profile?.location || profile?.address} />
                            <Info label="Status" value={profile?.status} />
                        </div>
                    </section>
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

export default FellowshipProfile;
