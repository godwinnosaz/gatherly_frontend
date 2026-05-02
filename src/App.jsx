import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenancyProvider } from './context/TenancyContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Finance from './pages/Finance';
import IntelligenceCenter from './pages/IntelligenceCenter';
import Onboarding from './pages/Onboarding';
import AcceptInvite from './pages/AcceptInvite';
import Signup from './pages/Signup';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-primary text-white">Loading Gatherly...</div>;
  if (!user) return <Navigate to="/login" />;
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  
  if (user && !user.onboarding_completed) {
    return <Navigate to="/onboarding" />;
  }
  
  return <Dashboard />;
};

function App() {
  return (
    <TenancyProvider>
      <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route 
            path="/onboarding" 
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
              <ProtectedRoute allowedRoles={['super_admin', 'pastor']}>
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
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" />} />
        </Routes>
      </Router>
      </AuthProvider>
    </TenancyProvider>
  );
}

export default App;
