import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenancyProvider } from './context/TenancyContext';

// Eager imports for lightweight critical pages
import Splash from './pages/Splash';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AcceptInvite from './pages/AcceptInvite';
import Onboarding from './pages/Onboarding';

// Logo asset for loading screen
import logo from './assets/logo.png';

// Lazy imports for large feature pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Members = lazy(() => import('./pages/Members'));
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const Finance = lazy(() => import('./pages/Finance'));
const IntelligenceCenter = lazy(() => import('./pages/IntelligenceCenter'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Departments = lazy(() => import('./pages/Departments'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Approvals = lazy(() => import('./pages/Approvals'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Reports = lazy(() => import('./pages/Reports'));
const Profile = lazy(() => import('./pages/Profile'));
const FellowshipProfile = lazy(() => import('./pages/FellowshipProfile'));
const PublicFellowshipProfile = lazy(() => import('./pages/PublicFellowshipProfile'));
const PublicMemberProfile = lazy(() => import('./pages/PublicMemberProfile'));

const GatherlyLoadingScreen = () => {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F9FAFB] font-outfit select-none">
      <div className="relative flex flex-col items-center">
        {/* Glow backdrop */}
        <div className="absolute w-24 h-24 bg-[#1E3A8A]/10 rounded-full blur-xl animate-pulse" />
        
        {/* Spinning/pulsing logo container */}
        <div className="relative w-20 h-20 flex items-center justify-center bg-white border border-slate-100 rounded-3xl shadow-lg p-3.5 mb-6 animate-[pulse_2s_infinite]">
          <img src={logo} alt="Gatherly" className="w-full h-full object-contain" />
        </div>

        {/* Loading text with premium brand styling */}
        <div className="flex flex-col items-center">
          <span className="font-black text-lg tracking-tighter text-slate-900 uppercase leading-none">Gatherly</span>
          <span className="text-[9px] font-black text-[#1E3A8A] tracking-[0.25em] uppercase mt-1.5 opacity-80 leading-none">
            Loading Fellowship...
          </span>
        </div>

        {/* Smooth, premium progress loader bar */}
        <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-6 relative border border-slate-50/50">
          <div className="absolute top-0 left-0 h-full bg-[#1E3A8A] rounded-full animate-loading-bar" style={{ width: '40%' }} />
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, role, roles } = useAuth();
  
  if (loading) return <GatherlyLoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  
  const activeRoles = new Set([user.role, role, ...(Array.isArray(roles) ? roles : [])].filter(Boolean));
  const isAllowed = allowedRoles.length === 0 || allowedRoles.some((allowedRole) => activeRoles.has(allowedRole));

  if (!isAllowed) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  
  if (user) {
    return <Dashboard />;
  }
  
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <TenancyProvider>
        <AuthProvider>
          <Suspense fallback={<GatherlyLoadingScreen />}>
            <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/accept-invite/:inviteToken" element={<AcceptInvite />} />
          <Route path="/accept-invitation" element={<AcceptInvite />} />
          <Route path="/accept-invitation/:inviteToken" element={<AcceptInvite />} />
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/setup" 
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/intelligence" 
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'pastor', 'fellowship_admin']}>
                <IntelligenceCenter />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/members" 
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'pastor', 'fellowship_admin']}>
                <Members />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/units" 
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'pastor', 'fellowship_admin']}>
                <Departments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/events" 
            element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/events/:id" 
            element={
              <ProtectedRoute>
                <EventDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/finance" 
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'pastor', 'finance_officer']}>
                <Finance />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/budgets" 
            element={
              <ProtectedRoute>
                <Budgets />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/approvals" 
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'pastor', 'fellowship_admin', 'president', 'secretary']}>
                <Approvals />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/attendance" 
            element={
              <ProtectedRoute>
                <Attendance />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/reports" 
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'pastor', 'fellowship_admin']}>
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings/fellowship-profile" 
            element={
              <ProtectedRoute>
                <FellowshipProfile />
              </ProtectedRoute>
            } 
          />
          {/* Support dashboard-prefixed path too */}
          <Route 
            path="/dashboard/settings/fellowship-profile" 
            element={
              <ProtectedRoute>
                <FellowshipProfile />
              </ProtectedRoute>
            } 
          />
          <Route path="/public/:slug" element={<PublicFellowshipProfile />} />
          <Route path="/people/:id" element={<PublicMemberProfile />} />
          <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </TenancyProvider>
    </Router>
  );
}

export default App;
