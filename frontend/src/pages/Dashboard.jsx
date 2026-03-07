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
  ClipboardList,
  Eye,
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

const STATUS_LABEL_STYLE = {
  CONFIRMED:  { bg: '#DCFCE7', text: '#166534' },
  CANCELLED:  { bg: '#FEE2E2', text: '#991B1B' },
  ATTENDED:   { bg: '#DBEAFE', text: '#1E40AF' },
  NO_SHOW:    { bg: '#F3F4F6', text: '#6B7280' },
};

const CATEGORY_COLORS = {
  TECHNOLOGY: '#1040C0',
  SOCIAL: '#D02020',
  SPORTS: '#16A34A',
  MUSIC: '#9333EA',
  EDUCATION: '#F0C020',
  BUSINESS: '#0D3399',
  HEALTH: '#059669',
  ART: '#E11D48',
  OTHER: '#6B7280',
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
          getMyRegistrations(0, 5).catch(() => ({ content: [], totalElements: 0 })),
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
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Welcome — more compact */}
        <div className="pt-8 pb-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold text-bauhaus-fg/30 uppercase tracking-[0.2em] mb-1">
                Welcome back
              </p>
              <h2 className="text-xl font-black text-bauhaus-fg tracking-tight uppercase">
                {user?.name || 'User'}
              </h2>
            </div>
            <span className="px-2 py-0.5 bg-bauhaus-blue text-white text-[9px] font-bold uppercase tracking-wider">
              {user?.role || 'USER'}
            </span>
          </div>
        </div>

        {/* Stats — bigger numbers, wider icon box, thinner borders */}
        <section className="pb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Calendar className="w-5 h-5" />}
              label="Events"
              value={loading ? '—' : stats.events}
              sub="Published events"
              accent="#D02020"
            />
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Registrations"
              value={loading ? '—' : stats.registrations}
              sub="Across all events"
              accent="#1040C0"
            />
            <StatCard
              icon={<Ticket className="w-5 h-5" />}
              label="Tickets"
              value={loading ? '—' : stats.tickets}
              sub="Issued to date"
              accent="#F0C020"
            />
            <StatCard
              icon={<Zap className="w-5 h-5" />}
              label="Live Now"
              value={loading ? '—' : stats.liveNow}
              sub="Happening right now"
              accent="#121212"
            />
          </div>
        </section>

        {/* Two-column previews — more spacious */}
        <section className="pb-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Events */}
          <div>
            <div className="flex items-center justify-between mb-4">
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
              <div className="bg-bauhaus-white/80 border border-[#E0E0E0] p-10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-[#9CA3AF] animate-spin" />
              </div>
            ) : recentEvents.length === 0 ? (
              <div className="bg-bauhaus-white/80 border border-[#E0E0E0] p-10 text-center">
                <Calendar className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
                <h4 className="text-sm font-bold text-bauhaus-fg uppercase tracking-tight mb-1">No upcoming events</h4>
                <p className="text-xs text-[#9CA3AF] mb-4">Events will show up here once they are published.</p>
                <Link
                  to="/events"
                  className="inline-block px-4 py-2 bg-bauhaus-blue text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#0D3399] transition-colors"
                >
                  Browse Events
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    to={`/events/${ev.id}`}
                    className="group block bg-bauhaus-white/80 border border-[#E0E0E0] overflow-hidden hover:border-bauhaus-fg/40 transition-colors"
                  >
                    <div className="flex">
                      {/* Left accent strip */}
                      <div className="w-1 shrink-0" style={{ backgroundColor: CATEGORY_COLORS[ev.category] || '#9CA3AF' }} />
                      <div className="flex-1 p-4 pl-4">
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="text-sm font-bold text-bauhaus-fg uppercase tracking-tight leading-snug group-hover:text-bauhaus-blue transition-colors">
                            {ev.title}
                          </p>
                          {ev.category && (
                            <span
                              className="px-1.5 py-0.5 text-[8px] font-bold text-white uppercase tracking-wider shrink-0 mt-0.5"
                              style={{ backgroundColor: CATEGORY_COLORS[ev.category] || '#6B7280' }}
                            >
                              {ev.category}
                            </span>
                          )}
                        </div>
                        {/* Meta row — grouped */}
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#6B7280]">
                          {ev.startDate && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                              {fmtDate(ev.startDate)} · {fmtTime(ev.startDate)}
                            </span>
                          )}
                          {ev.location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#9CA3AF]" />
                              {ev.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* My Registrations */}
          <div>
            <div className="flex items-center justify-between mb-4">
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
              <div className="bg-bauhaus-white/80 border border-[#E0E0E0] p-10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-[#9CA3AF] animate-spin" />
              </div>
            ) : recentRegs.length === 0 ? (
              <div className="bg-bauhaus-white/80 border border-[#E0E0E0] p-10 text-center">
                <ClipboardList className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
                <h4 className="text-sm font-bold text-bauhaus-fg uppercase tracking-tight mb-1">No registrations yet</h4>
                <p className="text-xs text-[#9CA3AF] mb-4">Register for an event to see your tickets here.</p>
                <Link
                  to="/events"
                  className="inline-block px-4 py-2 bg-bauhaus-blue text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#0D3399] transition-colors"
                >
                  Browse Events
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRegs.map((reg) => {
                  const ev = reg.event || {};
                  const sty = STATUS_LABEL_STYLE[reg.status] || { bg: '#F3F4F6', text: '#6B7280' };
                  return (
                    <div
                      key={reg.id}
                      className="bg-bauhaus-white/80 border border-[#E0E0E0] overflow-hidden"
                    >
                      <div className="p-4 flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          {/* Status + ticket code */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm"
                              style={{ backgroundColor: sty.bg, color: sty.text }}
                            >
                              {reg.status?.replace('_', ' ')}
                            </span>
                            {reg.ticketCode && (
                              <span className="text-[10px] text-[#9CA3AF] font-mono truncate">
                                {reg.ticketCode}
                              </span>
                            )}
                          </div>
                          {/* Event title */}
                          <Link
                            to={`/events/${ev.id}`}
                            className="text-sm font-bold text-bauhaus-fg uppercase tracking-tight truncate block hover:text-bauhaus-blue transition-colors leading-snug"
                          >
                            {ev.title || 'Event'}
                          </Link>
                          {/* Meta */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-[#6B7280] mt-1.5">
                            {ev.startDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#9CA3AF]" />
                                {fmtDate(ev.startDate)}
                              </span>
                            )}
                            {ev.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-[#9CA3AF]" />
                                {ev.location}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Quick actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Link
                            to={`/events/${ev.id}`}
                            className="p-2 bg-[#FAFAFA] border border-[#E0E0E0] hover:bg-bauhaus-bg transition-colors"
                            title="View Event"
                          >
                            <Eye className="w-3.5 h-3.5 text-bauhaus-fg/50" />
                          </Link>
                          {reg.ticketCode && reg.status === 'CONFIRMED' && (
                            <button
                              onClick={() => setTicketModal({ ticketCode: reg.ticketCode, event: ev })}
                              className="p-2 bg-[#FAFAFA] border border-[#E0E0E0] hover:bg-bauhaus-bg transition-colors cursor-pointer"
                              title="View Ticket"
                            >
                              <QrCode className="w-3.5 h-3.5 text-bauhaus-fg/50" />
                            </button>
                          )}
                        </div>
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
    <div className="bg-bauhaus-white/80 border border-[#E0E0E0] overflow-hidden">
      <div className="h-0.5" style={{ backgroundColor: accent }} />
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 flex items-center justify-center text-white" style={{ backgroundColor: accent }}>
            {icon}
          </div>
          <span className="text-[11px] font-bold text-bauhaus-fg/40 uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-3xl font-black text-bauhaus-fg tracking-tight leading-none">{value}</p>
        <p className="text-[11px] text-bauhaus-fg/30 mt-1.5">{sub}</p>
      </div>
    </div>
  );
}