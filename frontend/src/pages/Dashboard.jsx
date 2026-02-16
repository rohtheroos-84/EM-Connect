import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Users, Ticket, Zap, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F0F0]">
      {/* ── Navbar ── */}
      <nav className="bg-[#121212] border-b-4 border-[#F0C020] shrink-0">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
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
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-white/60">{user?.email}</span>
              {isAdmin && (
                <span className="px-2 py-0.5 bg-[#F0C020] text-[#121212] text-[11px] font-bold uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D02020] border-2 border-[#D02020] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#B01C1C] active:bg-[#901818] transition-colors duration-150 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* ── Welcome Banner ── */}
      <div className="bg-[#1040C0] border-b-[3px] border-[#121212] shrink-0">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest">
            Welcome back
          </p>
          <div className="flex items-end justify-between mt-1">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                {user?.name || 'User'}
              </h2>
              <div className="mt-3 h-1 w-14 bg-[#F0C020]" />
            </div>
            <span className="hidden sm:inline-flex px-3 py-1 bg-white/10 border border-white/20 text-xs font-bold text-white/70 uppercase tracking-wider">
              {user?.role || 'USER'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-10">
          {/* Section: Overview */}
          <h3 className="text-[13px] font-bold text-[#121212]/40 uppercase tracking-widest mb-5">
            Overview
          </h3>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard
              icon={<Calendar className="w-5 h-5" />}
              label="Events"
              value="0"
              accent="#D02020"
            />
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Registrations"
              value="0"
              accent="#1040C0"
            />
            <StatCard
              icon={<Ticket className="w-5 h-5" />}
              label="Tickets"
              value="0"
              accent="#F0C020"
            />
            <StatCard
              icon={<Zap className="w-5 h-5" />}
              label="Live Now"
              value="0"
              accent="#121212"
            />
          </div>

          {/* Section: Quick Actions */}
          <h3 className="text-[13px] font-bold text-[#121212]/40 uppercase tracking-widest mb-5">
            Quick Actions
          </h3>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FeatureCard
              title="Event Management"
              description="Create, publish, and manage your events. Set up registrations, track attendees, and organize everything in one place."
              phase="Phase 8.2"
              accent="#D02020"
            />
            <FeatureCard
              title="Real-Time Updates"
              description="Live participant counts, instant event announcements, and real-time notifications delivered straight to your dashboard."
              phase="Phase 8.3"
              accent="#1040C0"
            />
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="shrink-0 border-t-[3px] border-[#121212]">
        <div className="flex h-1.5">
          <div className="flex-1 bg-[#D02020]" />
          <div className="flex-1 bg-[#F0C020]" />
          <div className="flex-1 bg-[#1040C0]" />
        </div>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-[#121212]/30 font-medium">
            EM-Connect © 2026
          </span>
          <div className="flex gap-1.5">
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
function StatCard({ icon, label, value, accent }) {
  return (
    <div className="bg-white border-[3px] border-[#121212] shadow-[4px_4px_0px_0px_#121212] overflow-hidden">
      {/* Top color accent bar */}
      <div className="h-1" style={{ backgroundColor: accent }} />
      <div className="p-5">
        <div
          className="w-9 h-9 flex items-center justify-center text-white mb-3"
          style={{ backgroundColor: accent }}
        >
          {icon}
        </div>
        <p className="text-2xl font-black text-[#121212] tracking-tight leading-none">
          {value}
        </p>
        <p className="text-[11px] font-bold text-[#121212]/40 uppercase tracking-widest mt-1.5">
          {label}
        </p>
      </div>
    </div>
  );
}

/* ── Feature Card (non-interactive, clearly "coming soon") ── */
function FeatureCard({ title, description, phase, accent }) {
  return (
    <div className="bg-white border-[3px] border-[#121212] shadow-[4px_4px_0px_0px_#121212] overflow-hidden">
      {/* Top color accent bar */}
      <div className="h-1" style={{ backgroundColor: accent }} />
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h4 className="text-lg font-bold text-[#121212] uppercase tracking-tight leading-snug">
            {title}
          </h4>
          <span className="shrink-0 px-2.5 py-1 bg-[#F0F0F0] border border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
            {phase}
          </span>
        </div>
        <p className="text-sm text-[#6B7280] leading-relaxed mb-4">
          {description}
        </p>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
          Coming Soon <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}
