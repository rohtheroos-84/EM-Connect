import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { LogOut, LayoutDashboard, Calendar, ClipboardList, LogIn, UserCircle, ShieldCheck, TrendingUp, MoreHorizontal, ChevronDown, Info } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const PUBLIC_NAV = [
  { to: '/events', label: 'Events', icon: Calendar },
];

const AUTH_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/events', label: 'Events', icon: Calendar },
  { to: '/my-registrations', label: 'Registrations', icon: ClipboardList },
];

const ADMIN_NAV_ITEMS = [
  { to: '/analytics', label: 'Trending', icon: TrendingUp },
  { to: '/admin', label: 'Admin', icon: ShieldCheck },
];

const ABOUT_NAV_ITEM = { to: '/about', label: 'About', icon: Info };

export default function AppLayout({ children }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { connected } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';
  const navItems = isAuthenticated
    ? (isAdmin
      ? [...AUTH_NAV, ...ADMIN_NAV_ITEMS, ABOUT_NAV_ITEM]
      : [...AUTH_NAV, ABOUT_NAV_ITEM])
    : [...PUBLIC_NAV, ABOUT_NAV_ITEM];

  // User dropdown
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Mobile overflow menu
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const mobileMoreRef = useRef(null);
  const MAX_MOBILE_TABS = 4;
  const showMobileOverflow = navItems.length > MAX_MOBILE_TABS;
  const mobileVisibleItems = showMobileOverflow ? navItems.slice(0, 3) : navItems;
  const mobileOverflowItems = showMobileOverflow ? navItems.slice(3) : [];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (mobileMoreRef.current && !mobileMoreRef.current.contains(e.target)) {
        setMobileMoreOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setUserMenuOpen(false);
    setMobileMoreOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-bauhaus-bg">
      {/* ── Navbar ── */}
      <nav className="bg-bauhaus-nav shrink-0">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 h-12 flex items-center gap-3 lg:gap-4">
          {/* Left: brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex gap-0.75">
              <div className="w-2 h-2 bg-bauhaus-red" />
              <div className="w-2 h-2 bg-bauhaus-yellow" />
              <div className="w-2 h-2 bg-bauhaus-blue" />
            </div>
            <Link to={isAuthenticated ? '/dashboard' : '/events'} className="text-sm font-black text-white tracking-tight uppercase hover:text-white/80 transition-colors whitespace-nowrap">
              EM-Connect
            </Link>
            {connected && (
              <span className="flex items-center gap-1 ml-0.5 shrink-0">
                <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full animate-live-pulse" />
                <span className="text-[8px] font-bold text-[#16A34A] uppercase tracking-wider">Live</span>
              </span>
            )}
          </div>

          {/* Center: desktop nav links */}
          <div className="hidden sm:flex flex-1 min-w-0 items-center justify-center">
            <div className="flex items-center justify-center w-full max-w-170 xl:max-w-190 gap-1 lg:gap-2 xl:gap-3">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-150 border-b-2 whitespace-nowrap ${
                      isActive
                        ? 'text-white border-white'
                        : 'text-white/50 hover:text-white/80 border-transparent'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right: theme toggle + user dropdown */}
          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((p) => !p)}
                  className="flex items-center gap-2 px-2 py-1 text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 bg-bauhaus-blue flex items-center justify-center text-white text-[10px] font-black uppercase">
                    {(user?.name || user?.email || 'U').charAt(0)}
                  </div>
                  <span className="hidden md:block text-[11px] font-semibold text-white/70 max-w-30 truncate">
                    {user?.name || user?.email}
                  </span>
                  {isAdmin && (
                    <span className="hidden md:flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-bauhaus-yellow rounded-full" />
                      <span className="text-[8px] font-bold text-bauhaus-yellow uppercase tracking-wider">Admin</span>
                    </span>
                  )}
                  <ChevronDown className={`w-3 h-3 text-white/40 transition-transform duration-150 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-bauhaus-white border-2 border-bauhaus-fg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#E0E0E0]">
                      <p className="text-xs font-bold text-bauhaus-fg truncate">{user?.name || 'User'}</p>
                      <p className="text-[10px] text-[#9CA3AF] truncate">{user?.email}</p>
                      {isAdmin && (
                        <span className="inline-flex items-center gap-1 mt-1">
                          <span className="w-1.5 h-1.5 bg-bauhaus-yellow rounded-full" />
                          <span className="text-[9px] font-bold text-bauhaus-yellow uppercase tracking-wider">Administrator</span>
                        </span>
                      )}
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold text-bauhaus-fg uppercase tracking-wider hover:bg-bauhaus-bg transition-colors"
                    >
                      <UserCircle className="w-3.5 h-3.5" /> Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold text-bauhaus-red uppercase tracking-wider hover:bg-[#FEF2F2] transition-colors cursor-pointer border-t border-[#E0E0E0]"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                state={{ from: `${location.pathname}${location.search}${location.hash}` }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-bauhaus-blue text-white text-[11px] font-bold uppercase tracking-wider hover:bg-[#0D3399] transition-colors duration-150"
              >
                <LogIn className="w-3.5 h-3.5" />
                Login
              </Link>
            )}
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
      <div className="sm:hidden relative shrink-0" ref={mobileMoreRef}>
        {/* Overflow popup */}
        {mobileMoreOpen && mobileOverflowItems.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 bg-bauhaus-nav border-t border-white/10 shadow-[0_-4px_12px_rgba(0,0,0,0.3)] z-50">
            {mobileOverflowItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    isActive ? 'text-white bg-white/10' : 'text-white/50 hover:text-white/70'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </div>
        )}
        <div className="flex bg-bauhaus-nav border-t border-white/10">
          {mobileVisibleItems.map(({ to, label, icon: Icon }) => (
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
          {showMobileOverflow && (
            <button
              onClick={() => setMobileMoreOpen((prev) => !prev)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                mobileMoreOpen ? 'text-white bg-white/10' : 'text-white/35'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
              More
            </button>
          )}
        </div>
      </div>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="shrink-0 bg-bauhaus-nav">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-2.5 flex items-center justify-between">
          <span className="text-[10px] text-white/20 font-medium">EM-Connect © 2026</span>
          <div className="flex gap-0.75">
            <div className="w-1.5 h-1.5 bg-bauhaus-red" />
            <div className="w-1.5 h-1.5 bg-bauhaus-yellow" />
            <div className="w-1.5 h-1.5 bg-bauhaus-blue" />
          </div>
        </div>
      </footer>
    </div>
  );
}