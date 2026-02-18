import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Ticket,
  Zap,
  MapPin,
  Clock,
  ChevronRight,
  Loader2,
  QrCode,
} from 'lucide-react';
import { searchEvents, getMyRegistrations, getMyTickets } from '../services/api';
import AppLayout from '../components/AppLayout';
import TicketModal from '../components/TicketModal';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

const STATUS_ACCENT = {
  PUBLISHED: '#16A34A',
  CONFIRMED: '#16A34A',
  CANCELLED: '#D02020',
  ATTENDED: '#1040C0',
  DRAFT: '#9CA3AF',
  COMPLETED: '#1040C0',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ events: 0, registrations: 0, tickets: 0, liveNow: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentRegs, setRecentRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketModal, setTicketModal] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [evData, regData, tickets] = await Promise.all([
          searchEvents('', 0, 5).catch(() => ({ content: [], totalElements: 0 })),
          getMyRegistrations(0, 5, false).catch(() => ({ content: [], totalElements: 0 })),
          getMyTickets().catch(() => []),
        ]);

        if (cancelled) return;

        const now = new Date();
        const liveNow = (evData.content || []).filter(
          (e) => e.startDate && e.endDate && new Date(e.startDate) <= now && new Date(e.endDate) >= now
        ).length;

        setStats({
          events: evData.totalElements || 0,
          registrations: regData.totalElements || 0,
          tickets: Array.isArray(tickets) ? tickets.length : 0,
          liveNow,
        });
        setRecentEvents((evData.content || []).slice(0, 3));
        setRecentRegs((regData.content || []).slice(0, 3));
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
            <StatCard
              icon={<Calendar className="w-4 h-4" />}
              label="Events"
              value={loading ? '—' : stats.events}
              sub="Published events"
              accent="#D02020"
            />
            <StatCard
              icon={<Users className="w-4 h-4" />}
              label="Registrations"
              value={loading ? '—' : stats.registrations}
              sub="Across all events"
              accent="#1040C0"
            />
            <StatCard
              icon={<Ticket className="w-4 h-4" />}
              label="Tickets"
              value={loading ? '—' : stats.tickets}
              sub="Issued to date"
              accent="#F0C020"
            />
            <StatCard
              icon={<Zap className="w-4 h-4" />}
              label="Live Now"
              value={loading ? '—' : stats.liveNow}
              sub="Happening right now"
              accent="#121212"
            />
          </div>
        </section>

        {/* Two-column previews */}
        <section className="pb-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Browse Events preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em]">
                Upcoming Events
              </h3>
              <Link
                to="/events"
                className="flex items-center gap-0.5 text-[11px] font-bold text-bauhaus-blue uppercase tracking-wider hover:underline"
              >
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="bg-white border border-[#E0E0E0] p-8 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-[#9CA3AF] animate-spin" />
              </div>
            ) : recentEvents.length === 0 ? (
              <div className="bg-white border border-[#E0E0E0] p-6 text-center">
                <p className="text-sm text-[#9CA3AF]">No published events yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    to={`/events/${ev.id}`}
                    className="block bg-white border border-[#E0E0E0] overflow-hidden hover:border-[#C0C0C0] transition-colors"
                  >
                    <div className="h-0.75" style={{ backgroundColor: STATUS_ACCENT[ev.status] || '#9CA3AF' }} />
                    <div className="p-4">
                      <p className="text-[13px] font-bold text-bauhaus-fg uppercase tracking-tight truncate">
                        {ev.title}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#9CA3AF] mt-1.5">
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {ev.location}
                          </span>
                        )}
                        {ev.startDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {fmtDate(ev.startDate)} at {fmtTime(ev.startDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* My Registrations preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em]">
                My Registrations
              </h3>
              <Link
                to="/my-registrations"
                className="flex items-center gap-0.5 text-[11px] font-bold text-bauhaus-blue uppercase tracking-wider hover:underline"
              >
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="bg-white border border-[#E0E0E0] p-8 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-[#9CA3AF] animate-spin" />
              </div>
            ) : recentRegs.length === 0 ? (
              <div className="bg-white border border-[#E0E0E0] p-6 text-center">
                <p className="text-sm text-[#9CA3AF]">No registrations yet.</p>
                <Link
                  to="/events"
                  className="mt-2 inline-block text-xs font-bold text-bauhaus-blue uppercase tracking-wider hover:underline"
                >
                  Browse Events
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentRegs.map((reg) => {
                  const ev = reg.event || {};
                  return (
                    <div
                      key={reg.id}
                      className="bg-white border border-[#E0E0E0] overflow-hidden"
                    >
                      <div
                        className="h-0.75"
                        style={{ backgroundColor: STATUS_ACCENT[reg.status] || '#9CA3AF' }}
                      />
                      <div className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shrink-0"
                              style={{ backgroundColor: STATUS_ACCENT[reg.status] || '#9CA3AF' }}
                            >
                              {reg.status}
                            </span>
                            {reg.ticketCode && (
                              <span className="text-[10px] text-[#9CA3AF] font-mono truncate">
                                {reg.ticketCode}
                              </span>
                            )}
                          </div>
                          <Link
                            to={`/events/${ev.id}`}
                            className="text-[13px] font-bold text-bauhaus-fg uppercase tracking-tight truncate block hover:text-bauhaus-blue transition-colors"
                          >
                            {ev.title || 'Event'}
                          </Link>
                          <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                            {fmtDate(ev.startDate)}
                            {ev.location && ` · ${ev.location}`}
                          </p>
                        </div>
                        {reg.ticketCode && reg.status === 'CONFIRMED' && (
                          <button
                            onClick={() => setTicketModal({ ticketCode: reg.ticketCode, event: ev })}
                            className="p-2 bg-[#FAFAFA] border border-[#E0E0E0] hover:bg-bauhaus-bg transition-colors cursor-pointer shrink-0"
                            title="View Ticket"
                          >
                            <QrCode className="w-4 h-4 text-bauhaus-fg" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {ticketModal && (
        <TicketModal
          ticketCode={ticketModal.ticketCode}
          event={ticketModal.event}
          onClose={() => setTicketModal(null)}
        />
      )}
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