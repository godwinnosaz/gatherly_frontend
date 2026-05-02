import React from 'react';
import Layout from '../components/Layout';
import { Settings as SettingsIcon, Bell, Shield, Database, Globe, Mail } from 'lucide-react';

const SettingsCard = ({ icon: Icon, title, description }) => (
    <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all cursor-pointer group hover:shadow-xl hover:shadow-blue-900/5 hover:border-primary/20">
        <div className="flex items-start gap-6">
            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-blue-50 group-hover:border-blue-100 transition-all shrink-0 shadow-sm">
                <Icon size={24} />
            </div>
            <div>
                <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight uppercase group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{description}</p>
            </div>
        </div>
    </div>
);

const Settings = () => {
    return (
        <Layout>
            <div className="max-w-5xl mx-auto space-y-12">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
                    <p className="text-slate-500 font-medium leading-relaxed max-w-lg">Manage your fellowship details, team members, and preferences.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
                    <SettingsCard 
                        icon={SettingsIcon} 
                        title="General" 
                        description="Update your church name, logo, and basic contact information."
                    />
                    <SettingsCard 
                        icon={Shield} 
                        title="Roles & Permissions" 
                        description="Invite leaders, assign roles, and manage who has access to the dashboard."
                    />
                    <SettingsCard 
                        icon={Bell} 
                        title="Notifications" 
                        description="Choose how and when you receive alerts and summaries from the platform."
                    />
                    <SettingsCard 
                        icon={Database} 
                        title="Data & Export" 
                        description="Download your member lists and attendance history for your records."
                    />
                    <SettingsCard 
                        icon={Globe} 
                        title="Public Page" 
                        description="Customize the link you share with members to join your fellowship."
                    />
                    <SettingsCard 
                        icon={Mail} 
                        title="Messaging" 
                        description="Set up automatic welcome emails and service reminders for your members."
                    />
                </div>
            </div>
        </Layout>
    );
};

export default Settings;
