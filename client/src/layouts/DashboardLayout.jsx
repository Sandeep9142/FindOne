import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  Search,
} from 'lucide-react';
import { useState } from 'react';
import Logo from '@components/common/Logo';
import Button from '@components/common/Button';
import { useAuthStore, useUIStore } from '@store';
import { getDashboardPath } from '@utils';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const showToast = useUIStore((state) => state.showToast);
  const isWorker = user?.role === 'worker';
  const isClientOrAdmin = user?.role === 'client' || user?.role === 'admin';

  const primaryDashboardLink = {
    to: getDashboardPath(user?.role),
    label: user?.role === 'client' ? 'My Jobs' : user?.role === 'admin' ? 'Admin' : 'Overview',
    icon: user?.role === 'client' ? Briefcase : LayoutDashboard,
  };

  const sidebarLinks = [
    primaryDashboardLink,
    { to: '/jobs', label: user?.role === 'worker' ? 'Find Work' : 'Browse Jobs', icon: Search },
    ...(isClientOrAdmin ? [{ to: '/workers', label: 'Find Workers', icon: User }] : []),
    { to: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  ];

  async function handleLogout() {
    await logout();
    showToast('Logged out successfully');
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200
          transform transition-transform duration-200 ease-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
          <button type="button" onClick={() => navigate(getDashboardPath(user?.role))}>
            <Logo size="sm" />
          </button>
          <button
            className="lg:hidden text-slate-400 hover:text-slate-600"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {sidebarLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <User size={16} className="text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.fullName || 'FindOne User'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user?.email || 'No email available'}
              </p>
            </div>
            <button
              type="button"
              className="text-slate-400 hover:text-red-500 transition-colors"
              onClick={handleLogout}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-6">
          <button
            className="lg:hidden mr-4 text-slate-500 hover:text-slate-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
            <p className="text-xs text-slate-500 capitalize">{user?.role || 'member'} workspace</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {isClientOrAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/workers')}>
                Hire
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={() => navigate('/jobs')}>
              {isWorker ? 'Find Work' : 'Browse Jobs'}
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
