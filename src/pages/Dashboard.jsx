import React from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

// Role Dashboards
import PlatformDashboard from '../components/dashboards/PlatformDashboard';
import PastorDashboard from '../components/dashboards/PastorDashboard';
import FellowshipDashboard from '../components/dashboards/FellowshipDashboard';
import LeaderDashboard from '../components/dashboards/LeaderDashboard';
import MemberDashboard from '../components/dashboards/MemberDashboard';

const Dashboard = () => {
    const { user } = useAuth();
    
    // Mapping roles to their respective dashboard components
    const renderDashboard = () => {
        switch (user?.role) {
            case 'platform_admin':
                return <PlatformDashboard />;
            case 'super_admin':
            case 'pastor':
                return <PastorDashboard />;
            case 'fellowship_admin':
                return <FellowshipDashboard />;
            case 'department_leader':
                return <LeaderDashboard />;
            case 'member':
                return <MemberDashboard />;
            default:
                return <MemberDashboard />;
        }
    };

    const getDashboardTitle = () => {
        switch (user?.role) {
            case 'platform_admin': return 'Overview';
            case 'super_admin':
            case 'pastor': return 'Dashboard';
            case 'fellowship_admin': return 'Fellowship Dashboard';
            case 'department_leader': return 'My Department';
            case 'member': return 'My Fellowship';
            default: return 'Dashboard';
        }
    };

    const getDashboardSubtitle = () => {
        switch (user?.role) {
            case 'platform_admin': return 'Monitor all organizations and system health.';
            case 'super_admin':
            case 'pastor': return "Here's what's happening in your fellowship today.";
            case 'fellowship_admin': return 'Manage your fellowship activities and members.';
            case 'department_leader': return 'Track your team and upcoming responsibilities.';
            case 'member': return 'Stay connected and engaged with your fellowship.';
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
