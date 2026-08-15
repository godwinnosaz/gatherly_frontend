import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, Calendar, Wallet, MessageSquare, 
  Settings, LogOut, Menu, X, ChevronRight, BarChart3, ShieldCheck,
  BrainCircuit, Sparkles, Zap, LayoutGrid, CheckSquare, LineChart,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationCenter from './notifications/NotificationCenter';
import logo from '../assets/logo.png';
import { canAccess, ROLE_GROUPS } from '../utils/permissions';

const SidebarItem = ({ icon: Icon, label, path, active, collapsed }) => (
  <Link to={path}>
    <motion.div 
      whileHover={{ x: 4 }}
      className={`
        flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative
        ${active 
          ? 'bg-blue-50 text-primary border border-blue-100 shadow-sm' 
          : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'}
      `}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'group-hover:text-slate-900'} transition-colors`} />
      {!collapsed && <span className="font-bold whitespace-nowrap text-sm tracking-tight">{label}</span>}
      {active && (
        <motion.div 
          layoutId="activeIndicator" 
          className="absolute left-0 w-1 h-6 bg-primary rounded-full" 
        />
      )}
    </motion.div>
  </Link>
);

const Layout = ({ children }) => {
  const { user, logout, role, roles } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/dashboard', roles: ['all'] },
    { icon: User, label: 'My Profile', path: '/profile', roles: ['all'] },
    { icon: BrainCircuit, label: 'Insights', path: '/dashboard/intelligence', roles: ROLE_GROUPS.EXECUTIVES },
    { icon: Users, label: 'Members', path: '/dashboard/members', roles: ROLE_GROUPS.LEADERS },
    { icon: LayoutGrid, label: 'Units', path: '/dashboard/units', roles: ROLE_GROUPS.LEADERS },
    { icon: CheckSquare, label: 'Attendance', path: '/dashboard/attendance', roles: ['all'] },
    { icon: Calendar, label: 'Events', path: '/dashboard/events', roles: ['all'] },
    { icon: Wallet, label: 'Finances', path: '/dashboard/finance', roles: ROLE_GROUPS.FINANCE },
    { icon: BarChart3, label: 'Budgets', path: '/dashboard/budgets', roles: ['all'] },
    { icon: ShieldCheck, label: 'Approvals', path: '/dashboard/approvals', roles: ROLE_GROUPS.APPROVERS },
    { icon: LineChart, label: 'Reports', path: '/dashboard/reports', roles: ROLE_GROUPS.LEADERS },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings', roles: ['all'] },
  ];

  const activeRoles = [user?.role, role, ...(Array.isArray(roles) ? roles : [])].filter(Boolean);
  const filteredItems = menuItems.filter(item => 
    item.roles.includes('all') || canAccess(activeRoles, item.roles)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col md:flex-row overflow-hidden selection:bg-blue-100 selection:text-primary">
      {/* Desktop Sidebar */}
      <motion.aside 
        animate={{ width: collapsed ? 84 : 280 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="hidden md:flex flex-col bg-white border-r border-slate-200 relative z-50 h-screen shadow-sm"
      >
        <div className="p-8 mb-4 flex items-center gap-3 overflow-hidden">
          <img src={logo} alt="Logo" className="w-10 h-10 object-contain shrink-0" />
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="font-black text-xl tracking-tighter text-slate-900 leading-none uppercase">Gatherly</span>
              <span className="text-[10px] font-black text-primary tracking-[0.2em] mt-1 opacity-80 uppercase leading-none">Administration</span>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar pt-4">
          {filteredItems.map((item) => (
            <SidebarItem 
              key={item.path}
              {...item}
              active={location.pathname === item.path}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3.5 w-full rounded-2xl hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {!collapsed && <span className="font-bold text-sm">Sign Out</span>}
          </button>
        </div>

        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-24 w-7 h-7 bg-white border border-slate-200 text-slate-400 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-50"
        >
          <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-20 md:h-24 flex items-center justify-between px-6 md:px-12 relative z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-3 bg-white rounded-2xl text-slate-400 border border-slate-200 shadow-sm"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex flex-col">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">Here's your fellowship at a glance.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">

            <NotificationCenter />
            <Link to="/dashboard/settings" className="relative group flex">
                <div className="w-11 h-11 md:w-13 md:h-13 rounded-2xl bg-white border border-slate-200 p-0.5 overflow-hidden transition-all group-hover:border-primary/50 group-hover:shadow-lg">
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center font-black text-primary text-lg">
                        {user?.name?.[0]}
                    </div>
                </div>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-secondary rounded-full border-2 border-white shadow-sm pointer-events-none select-none" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 pb-32 md:pb-12 custom-scrollbar relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-4 left-4 right-4 h-20 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-[2rem] flex items-center justify-around px-2 z-[100] shadow-2xl">
          {filteredItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="flex flex-col items-center justify-center gap-1 w-full h-full relative">
                <div className={`p-3.5 rounded-2xl transition-all ${active ? 'bg-primary text-white scale-110 shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-slate-600'}`}>
                  <Icon size={24} />
                </div>
                {active && (
                    <motion.div layoutId="mobileActive" className="absolute -top-1 w-1 h-1 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
          <button 
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center justify-center gap-1 w-full h-full text-slate-400"
          >
            <div className="p-3.5 rounded-2xl hover:text-slate-600 transition-colors">
              <Menu size={24} />
            </div>
          </button>
        </nav>


      </main>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setMobileOpen(false)}
               className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] md:hidden"
            />
            <motion.div 
               initial={{ x: '-100%' }}
               animate={{ x: 0 }}
               exit={{ x: '-100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed inset-y-0 left-0 w-[85%] bg-white z-[120] md:hidden flex flex-col border-r border-slate-200 shadow-2xl"
            >
               <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <img src={logo} alt="Logo" className="w-10 h-10 object-contain shrink-0" />
                    <div className="flex flex-col">
                        <span className="font-black text-2xl tracking-tighter text-slate-900 uppercase leading-none">Gatherly</span>
                        <span className="text-[10px] font-black text-primary tracking-[0.2em] uppercase mt-1">Mobile Admin</span>
                    </div>
                 </div>
                 <button onClick={() => setMobileOpen(false)} className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                   <X className="text-slate-400" />
                 </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 space-y-2">
                 {filteredItems.map((item) => (
                   <SidebarItem 
                     key={item.path}
                     {...item}
                     active={location.pathname === item.path}
                     collapsed={false}
                   />
                 ))}
               </div>

               <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-primary font-black text-xl shadow-sm">
                      {user?.name?.[0]}
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-900">{user?.name}</p>
                      <p className="text-xs text-primary font-black uppercase tracking-widest">{user?.role?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-red-50 text-red-600 font-black text-sm border border-red-100"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
