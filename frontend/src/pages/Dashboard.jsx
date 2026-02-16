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
    <div className="h-screen flex flex-col overflow-hidden bg-[#F0F0F0]">
      {/* ── Navbar ── */}
      <nav className="bg-[#121212] shrink-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 bg-[#D02020]" />
              <div className="w-2.5 h-2.5 bg-[#F0C020]" />
              <div className="w-2.5 h-2.5 bg-[#1040C0]" />
            </div>
            <span className="text-base font-black text-white tracking-tight uppercase">
              EM-Connect
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-white/50">{user?.email}</span>
            {isAdmin && (
              <span className="hidden sm:block px-2 py-0.5 bg-[#F0C020] text-[#121212] text-[10px] font-bold uppercase tracking-wider">
                Admin
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D02020] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#B91C1C] transition-colors duration-150 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
        {/* Accent bar */}
        <div className="flex h-[3px]">
          <div className="flex-1 bg-[#D02020]" />
          <div className="flex-1 bg-[#F0C020]" />
          <div className="flex-1 bg-[#1040C0]" />
        </div>
      </nav>

      {/* ── Main scrollable area ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Welcome */}
          <div className="pt-8 pb-6 border-b border-[#E0E0E0]">
            <p className="text-[11px] font-bold text-[#121212]/35 uppercase tracking-[0.15em]">
              Welcome back
            </p>
            <div className="flex items-end justify-between mt-1">
              <h2 className="text-2xl font-black text-[#121212] tracking-tight uppercase">
                {user?.name || 'User'}
              </h2>
              <span className="px-2.5 py-1 bg-[#1040C0] text-white text-[10px] font-bold uppercase tracking-wider">
                {user?.role || 'USER'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <section className="pt-8 pb-6">
            <h3 className="text-[11px] font-bold text-[#121212]/35 uppercase tracking-[0.15em] mb-4">
              Overview
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={<Calendar className="w-4 h-4" />} label="Events" value="0" sub="Total created" accent="#D02020" />
              <StatCard icon={<Users className="w-4 h-4" />} label="Registrations" value="0" sub="Across all events" accent="#1040C0" />
              <StatCard icon={<Ticket className="w-4 h-4" />} label="Tickets" value="0" sub="Issued to date" accent="#F0C020" />
              <StatCard icon={<Zap className="w-4 h-4" />} label="Live Now" value="0" sub="Active events" accent="#121212" />
            </div>
          </section>

          {/* Feature cards */}
          <section className="pb-10">
            <h3 className="text-[11px] font-bold text-[#121212]/35 uppercase tracking-[0.15em] mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <FeatureCard
                title="Event Management"
                desc="Create, publish, and manage your events. Set up registrations, track attendees, and organise everything in one place."
                phase="Phase 8.2"
                accent="#D02020"
              />
              <FeatureCard
                title="Real-Time Updates"
                desc="Live participant counts, instant announcements, and real-time notifications delivered straight to your dashboard."
                phase="Phase 8.3"
                accent="#1040C0"
              />
            </div>
          </section>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="shrink-0 bg-[#121212]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3 flex items-center justify-between">
          <span className="text-[11px] text-white/25 font-medium">EM-Connect © 2026</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-[#D02020]" />
            <div className="w-2 h-2 bg-[#F0C020]" />
            <div className="w-2 h-2 bg-[#1040C0]" />
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="bg-white border border-[#E0E0E0] overflow-hidden">
      <div className="h-[3px]" style={{ backgroundColor: accent }} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 flex items-center justify-center text-white" style={{ backgroundColor: accent }}>
            {icon}
          </div>
          <span className="text-[11px] font-bold text-[#121212]/40 uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-2xl font-black text-[#121212] tracking-tight leading-none">{value}</p>
        <p className="text-[11px] text-[#121212]/30 mt-1">{sub}</p>
      </div>
    </div>
  );
}

/* ── Feature Card ── */
function FeatureCard({ title, desc, phase, accent }) {
  return (
    <div className="bg-white border border-[#E0E0E0] overflow-hidden">
      <div className="h-[3px]" style={{ backgroundColor: accent }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h4 className="text-[15px] font-bold text-[#121212] uppercase tracking-tight">{title}</h4>
          <span className="shrink-0 px-2 py-0.5 bg-[#F0F0F0] text-[10px] font-bold text-[#BCBCBC] uppercase tracking-wider whitespace-nowrap">
            {phase}
          </span>
        </div>
        <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
