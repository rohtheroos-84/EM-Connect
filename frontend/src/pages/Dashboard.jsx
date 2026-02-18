import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Calendar, Users, Ticket, Zap } from 'lucide-react';
import AppLayout from '../components/AppLayout';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Welcome */}
        <div className="pt-8 pb-6 border-b border-[#E0E0E0]">
          <p className="text-[11px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em]">
            Welcome back
          </p>
          <div className="flex items-end justify-between mt-1">
            <h2 className="text-2xl font-black text-bauhaus-fg tracking-tight uppercase">
              {user?.name || 'User'}
            </h2>
            <span className="px-2.5 py-1 bg-bauhaus-blue text-white text-[10px] font-bold uppercase tracking-wider">
              {user?.role || 'USER'}
            </span>
          </div>
        </div>

        {/* Stats */}
        <section className="pt-8 pb-6">
          <h3 className="text-[11px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em] mb-4">
            Overview
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={<Calendar className="w-4 h-4" />} label="Events" value="0" sub="Total created" accent="#D02020" />
            <StatCard icon={<Users className="w-4 h-4" />} label="Registrations" value="0" sub="Across all events" accent="#1040C0" />
            <StatCard icon={<Ticket className="w-4 h-4" />} label="Tickets" value="0" sub="Issued to date" accent="#F0C020" />
            <StatCard icon={<Zap className="w-4 h-4" />} label="Live Now" value="0" sub="Active events" accent="#121212" />
          </div>
        </section>

        {/* Quick Actions */}
        <section className="pb-10">
          <h3 className="text-[11px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em] mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Link to="/events" className="block group">
              <FeatureCard
                title="Browse Events"
                desc="Discover upcoming events, search by keyword, and register with a single click."
                accent="#D02020"
              />
            </Link>
            <Link to="/my-registrations" className="block group">
              <FeatureCard
                title="My Registrations"
                desc="View your active and past registrations, ticket codes, and manage your bookings."
                accent="#1040C0"
              />
            </Link>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

/* ── Stat Card ── */
function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="bg-white border border-[#E0E0E0] overflow-hidden">
      <div className="h-0.75" style={{ backgroundColor: accent }} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 flex items-center justify-center text-white" style={{ backgroundColor: accent }}>
            {icon}
          </div>
          <span className="text-[11px] font-bold text-bauhaus-fg/40 uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-2xl font-black text-bauhaus-fg tracking-tight leading-none">{value}</p>
        <p className="text-[11px] text-bauhaus-fg/30 mt-1">{sub}</p>
      </div>
    </div>
  );
}

/* ── Feature Card ── */
function FeatureCard({ title, desc, accent }) {
  return (
    <div className="bg-white border border-[#E0E0E0] overflow-hidden group-hover:shadow-[3px_3px_0px_0px_#121212] group-hover:border-bauhaus-fg transition-all duration-150">
      <div className="h-0.75" style={{ backgroundColor: accent }} />
      <div className="p-5">
        <h4 className="text-[15px] font-bold text-bauhaus-fg uppercase tracking-tight mb-2">{title}</h4>
        <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}