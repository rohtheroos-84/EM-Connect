import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Users, Ticket, Zap } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-bauhaus-bg">
      {/* ── Navbar ── */}
      <nav className="bg-bauhaus-fg border-b-4 border-[#F0C020]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 bg-[#D02020]" />
              <div className="w-3 h-3 bg-[#F0C020]" />
              <div className="w-3 h-3 bg-[#1040C0]" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase">
              EM-Connect
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20">
              <span className="text-sm font-medium text-white/70">{user?.email}</span>
              {isAdmin && (
                <span className="px-2 py-0.5 bg-[#F0C020] text-[#121212] text-xs font-bold uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-[#D02020] border-2 border-white/20 text-white text-sm font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 ease-out cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* ── Welcome Banner ── */}
      <div className="bg-[#1040C0] border-b-4 border-[#121212]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-12">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white/60 uppercase tracking-wider">
                Welcome back
              </p>
              <h2 className="mt-2 text-4xl font-black text-white tracking-tighter uppercase">
                {user?.name || 'User'}
              </h2>
              <div className="mt-4 h-1 w-20 bg-[#F0C020]" />
            </div>
            <div className="hidden md:flex gap-3">
              <div className="w-16 h-16 bg-[#F0C020] border-4 border-[#121212]" />
              <div className="w-16 h-16 bg-[#D02020] border-4 border-[#121212] rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Dashboard Content ── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <StatCard
            icon={<Calendar className="w-6 h-6" />}
            label="Events"
            value="—"
            color="#D02020"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Registrations"
            value="—"
            color="#1040C0"
          />
          <StatCard
            icon={<Ticket className="w-6 h-6" />}
            label="Tickets"
            value="—"
            color="#F0C020"
          />
          <StatCard
            icon={<Zap className="w-6 h-6" />}
            label="Live Now"
            value="—"
            color="#121212"
          />
        </div>

        {/* Coming Soon Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PlaceholderCard
            title="Event Management"
            description="Create, publish, and manage your events. Coming in Phase 8.2."
            color="#D02020"
          />
          <PlaceholderCard
            title="Real-Time Updates"
            description="Live participant counts and event announcements. Coming in Phase 8.3"
            color="#1040C0"
          />
        </div>

        {/* Role badge */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white border-4 border-[#121212] shadow-[6px_6px_0px_0px_#121212]">
            <span className="text-sm font-bold text-[#121212]/60 uppercase tracking-wider">
              Signed in as
            </span>
            <span className="px-3 py-1 bg-bauhaus-fg text-white text-sm font-bold uppercase tracking-wider">
              {user?.role || 'USER'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="relative bg-white border-4 border-[#121212] shadow-[6px_6px_0px_0px_#121212] p-6">
      <div
        className="w-11 h-11 flex items-center justify-center text-white border-2 border-[#121212] mb-4"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <p className="text-3xl font-black text-[#121212] tracking-tight">{value}</p>
      <p className="text-xs font-bold text-[#121212]/50 uppercase tracking-wider mt-2">
        {label}
      </p>
    </div>
  );
}

function PlaceholderCard({ title, description, color }) {
  return (
    <div className="relative bg-white border-4 border-[#121212] shadow-[6px_6px_0px_0px_#121212] p-8 overflow-hidden">
      {/* Corner accent — inside the card, pinned to top-left */}
      <div
        className="absolute top-0 left-0 w-7 h-7 border-r-4 border-b-4 border-[#121212]"
        style={{ backgroundColor: color }}
      />
      <div className="ml-10">
        <h3 className="text-xl font-bold text-[#121212] uppercase tracking-tight">{title}</h3>
        <div className="mt-3 h-1 w-14" style={{ backgroundColor: color }} />
        <p className="mt-4 text-sm text-[#121212]/60 font-medium leading-relaxed">
          {description}
        </p>
        <div className="mt-5 inline-block px-5 py-2.5 bg-bauhaus-bg border-2 border-[#121212] text-xs font-bold uppercase tracking-wider text-[#121212]/40">
          Coming Soon
        </div>
      </div>
    </div>
  );
}
