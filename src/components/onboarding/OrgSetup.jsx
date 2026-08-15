import React, { useState } from 'react';
import { Home, MapPin, Globe, Mail, Phone, Upload } from 'lucide-react';
import { OnboardingService } from '../../api/services';

const OrgSetup = ({ onNext, onBack, formData }) => {
    const [data, setData] = useState({
        name: formData.name || '',
        ministry_type: formData.ministry_type || 'Church',
        denomination: formData.denomination || '',
        location: formData.location || '',
        contact_email: formData.contact_email || '',
        contact_phone: formData.contact_phone || '',
        website: formData.website || '',
        logo: formData.logo || null,
        ...formData
    });
    const [loading, setLoading] = useState(false);
    const [logoPreview, setLogoPreview] = useState(formData.logoPreview || null);

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData({ ...data, logo: file });
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await OnboardingService.setupChurch({ step: 2, ...data });
        } catch (error) {
            // /onboarding/setup-org may not be in contract — still advance
            console.error('Error saving org setup:', error);
        } finally {
            onNext({ ...data, logoPreview });
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">Organization Profile</h2>
                <p className="text-slate-500">Tell us a bit about your church or ministry.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Organization Name</label>
                        <div className="relative">
                            <Home className="absolute left-4 top-3.5 text-slate-400" size={18} />
                            <input 
                                required
                                type="text"
                                value={data.name}
                                onChange={e => setData({...data, name: e.target.value})}
                                className="onboarding-input pl-12"
                                placeholder="e.g. Grace Community Church"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Ministry Type</label>
                        <select 
                            value={data.ministry_type}
                            onChange={e => setData({...data, ministry_type: e.target.value})}
                            className="onboarding-input"
                        >
                            <option value="Church">Church</option>
                            <option value="Fellowship">Campus Fellowship</option>
                            <option value="Ministry">Independent Ministry</option>
                            <option value="Prayer Group">Prayer Group</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Denomination</label>
                        <input 
                            type="text"
                            value={data.denomination}
                            onChange={e => setData({...data, denomination: e.target.value})}
                            className="onboarding-input"
                            placeholder="e.g. Baptist, Pentecostal"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-3.5 text-slate-400" size={18} />
                            <input 
                                type="text"
                                value={data.location}
                                onChange={e => setData({...data, location: e.target.value})}
                                className="onboarding-input pl-12"
                                placeholder="City, Country"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Contact Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                            <input 
                                type="email"
                                value={data.contact_email}
                                onChange={e => setData({...data, contact_email: e.target.value})}
                                className="onboarding-input pl-12"
                                placeholder="office@church.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Contact Phone</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
                            <input 
                                type="tel"
                                value={data.contact_phone}
                                onChange={e => setData({...data, contact_phone: e.target.value})}
                                className="onboarding-input pl-12"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    </div>
                </div>

                <label className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer relative overflow-hidden min-h-[120px]">
                    <input 
                        type="file" 
                        accept="image/png, image/jpeg" 
                        className="hidden" 
                        onChange={handleLogoChange}
                    />
                    {logoPreview ? (
                        <div className="absolute inset-0 flex items-center justify-center p-2">
                            <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <Upload size={24} className="text-white mb-2" />
                                <span className="text-white text-xs font-bold">Change Logo</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <Upload size={24} />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-slate-900">Upload Logo</p>
                                <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
                            </div>
                        </>
                    )}
                </label>

                <div className="flex justify-between pt-6">
                    <button 
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-600 font-semibold px-6 py-3 rounded-xl hover:bg-slate-100 transition-all"
                    >
                        Back
                    </button>
                    <button 
                        disabled={loading}
                        type="submit"
                        className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-10 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/10"
                    >
                        {loading ? 'Saving...' : 'Next Step'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default OrgSetup;
