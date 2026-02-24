import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { LogOut, LayoutDashboard, Calendar, ClipboardList, LogIn, UserCircle } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const PUBLIC_NAV = [
  { to: '/events', label: 'Events', icon: Calendar },
];

const AUTH_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/events', label: 'Events', icon: Calendar },
  { to: '/my-registrations', label: 'My Registrations', icon: ClipboardList },
  { to: '/profile', label: 'Profile', icon: UserCircle },
];

export default function AppLayout({ children }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { connected } = useWebSocket();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  const navItems = isAuthenticated ? AUTH_NAV : PUBLIC_NAV;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-bauhaus-bg">
      {/* ── Navbar ── */}
      <nav className="bg-bauhaus-nav shrink-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-14">
          {/* Left: brand + nav links */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 bg-bauhaus-red" />
                <div className="w-2.5 h-2.5 bg-bauhaus-yellow" />
                <div className="w-2.5 h-2.5 bg-bauhaus-blue" />
              </div>
              <span className="text-base font-black text-white tracking-tight uppercase">
                EM-Connect
              </span>
              {connected && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full animate-live-pulse" />
                  <span className="text-[9px] font-bold text-[#16A34A] uppercase tracking-wider">Live</span>
                </span>
              )}
            </div>

            {/* Nav links */}
            <div className="hidden sm:flex items-center gap-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors duration-150 ${
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'text-white/40 hover:text-white/70'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right: theme toggle + user actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <span className="hidden md:block text-sm text-white/50">{user?.email}</span>
                  {isAdmin && (
                    <span className="hidden md:block px-2 py-0.5 bg-bauhaus-yellow text-bauhaus-fg text-[10px] font-bold uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-2 py-1 text-bauhaus-red text-xs font-semibold uppercase tracking-wider hover:opacity-70 transition-opacity duration-150 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-bauhaus-blue text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0D3399] transition-colors duration-150"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
        {/* Accent bar */}
        <div className="flex h-0.75">
          <div className="flex-1 bg-bauhaus-red" />
          <div className="flex-1 bg-bauhaus-yellow" />
          <div className="flex-1 bg-bauhaus-blue" />
        </div>
      </nav>

      {/* ── Mobile nav ── */}
      <div className="sm:hidden flex bg-bauhaus-nav border-t border-white/10 shrink-0">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                isActive ? 'text-white bg-white/10' : 'text-white/35'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </div>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="shrink-0 bg-bauhaus-nav">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3 flex items-center justify-between">
          <span className="text-[11px] text-white/25 font-medium">EM-Connect © 2026</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-bauhaus-red" />
            <div className="w-2 h-2 bg-bauhaus-yellow" />
            <div className="w-2 h-2 bg-bauhaus-blue" />
          </div>
        </div>
      </footer>
    </div>
  );
}