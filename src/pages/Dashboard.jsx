import React from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

// Role Dashboards
import PlatformDashboard from '../components/dashboards/PlatformDashboard';
import PastorDashboard from '../components/dashboards/PastorDashboard';
import FellowshipDashboard from '../components/dashboards/FellowshipDashboard';
import LeaderDashboard from '../components/dashboards/LeaderDashboard';
import MemberDashboard from '../components/dashboards/MemberDashboard';
import { getDashboardType } from '../utils/permissions';

const Dashboard = () => {
    const { role } = useAuth();
    
    // Mapping roles to their respective dashboard components
    const renderDashboard = () => {
        const type = getDashboardType(role);
        switch (type) {
            case 'platform':
                return <PlatformDashboard />;
            case 'fellowship':
                return <FellowshipDashboard />;
            case 'pastor':
                return <PastorDashboard />;
            case 'leader':
                return <LeaderDashboard />;
            case 'member':
            default:
                return <MemberDashboard />;
        }
    };

    const getDashboardTitle = () => {
        switch (role) {
            case 'platform_admin': return 'Overview';
            case 'super_admin': return 'System Fellowship Dashboard';
            case 'pastor': return 'Dashboard';
            case 'fellowship_admin': return 'Fellowship Dashboard';
            case 'president': return 'Presidential Dashboard';
            case 'executive': return 'Executive Dashboard';
            case 'secretary': return 'Secretariat Dashboard';
            case 'finance_officer': return 'Finance Accountability Dashboard';
            case 'leadership_committee':
            case 'unit_head':
            case 'department_leader': return 'My Department';
            case 'general_member':
            case 'member':
            case 'user': return 'My Fellowship';
            default: return 'Dashboard';
        }
    };

    const getDashboardSubtitle = () => {
        switch (role) {
            case 'platform_admin': return 'Monitor all organizations and system health.';
            case 'super_admin':
            case 'fellowship_admin': return 'Manage your fellowship activities and members.';
            case 'pastor': return "Here's what's happening in your fellowship today.";
            case 'president':
            case 'executive': return 'Fellowship overview with executive approval control.';
            case 'secretary': return 'Review dashboard for secretarial oversight and approvals.';
            case 'finance_officer': return 'Double-entry treasury ledger and cash flows.';
            case 'leadership_committee':
            case 'unit_head':
            case 'department_leader': return 'Track your team and upcoming responsibilities.';
            case 'general_member':
            case 'member':
            case 'user': return 'Stay connected and engaged with your fellowship.';
            default: return 'Your personal fellowship dashboard.';
        }
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto pb-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 relative">
                    <div className="relative z-10">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">{getDashboardTitle()}</h1>
                        <p className="text-sm text-slate-500 mt-3 font-medium max-w-md leading-relaxed">{getDashboardSubtitle()}</p>
                    </div>
                </div>

                <div className="relative z-10">
                    {renderDashboard()}
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
