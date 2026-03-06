import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyRegistrations, cancelRegistration } from '../services/api';
import {
  Ticket,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarX,
  QrCode,
  CalendarPlus,
  Download,
  Filter,
  Search,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import TicketModal from '../components/TicketModal';
import { downloadICS, getGoogleCalendarUrl } from '../services/calendar';

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

function timeAgo(iso) {
  if (!iso) return '';
  const now = new Date();
  const date = new Date(iso);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

const REG_STATUS_STYLE = {
  CONFIRMED: { bg: '#16A34A', label: 'Confirmed' },
  CANCELLED: { bg: '#D02020', label: 'Cancelled' },
  ATTENDED: { bg: '#1040C0', label: 'Attended' },
  NO_SHOW: { bg: '#9CA3AF', label: 'No Show' },
};

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'ATTENDED', label: 'Attended' },
  { value: 'NO_SHOW', label: 'No Show' },
];

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [cancelling, setCancelling] = useState(null); // registration id being cancelled
  const [actionMsg, setActionMsg] = useState(null);
  const [ticketModal, setTicketModal] = useState(null); // { ticketCode, event }
  const [cancelConfirm, setCancelConfirm] = useState(null); // registration id to confirm cancel
  const [searchQuery, setSearchQuery] = useState('');

  const PAGE_SIZE = 10;

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyRegistrations(page, PAGE_SIZE, statusFilter);
      setRegistrations(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleCancelClick = (regId) => {
    setCancelConfirm(regId);
  };

  const handleCancelConfirm = async () => {
    if (!cancelConfirm) return;
    const regId = cancelConfirm;
    setCancelConfirm(null);
    setCancelling(regId);
    setActionMsg(null);
    try {
      await cancelRegistration(regId);
      setActionMsg({ type: 'success', text: 'Registration cancelled successfully.' });
      fetchRegistrations();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message });
    } finally {
      setCancelling(null);
    }
  };

  // Client-side search filter on loaded registrations
  const filteredRegistrations = registrations.filter((reg) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const ev = reg.event || {};
    return (
      (ev.title && ev.title.toLowerCase().includes(q)) ||
      (ev.location && ev.location.toLowerCase().includes(q)) ||
      (reg.ticketCode && reg.ticketCode.toLowerCase().includes(q))
    );
  });

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(0);
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="mb-4">
          <h1 className="text-2xl font-black text-bauhaus-fg tracking-tight uppercase">
            My Registrations
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {loading ? 'Loading…' : `${totalElements} registration${totalElements !== 1 ? 's' : ''}${statusFilter ? ` · ${STATUS_FILTERS.find(f => f.value === statusFilter)?.label}` : ''}`}
          </p>
        </div>

        {/* Sticky filter bar */}
        <div className="sticky top-0 z-10 bg-bauhaus-bg -mx-6 px-6 lg:-mx-8 lg:px-8 py-3 mb-6 border-b border-[#E0E0E0] dark:border-white/10">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, location, or ticket…"
                className="w-full pl-8 pr-3 h-9 text-xs bg-bauhaus-white/80 border border-[#D1D5DB] text-bauhaus-fg placeholder:text-[#BCBCBC] placeholder:italic focus:border-bauhaus-blue focus:outline-none transition-colors"
              />
            </div>
            {/* Status filter dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#6B7280] hidden sm:block" />
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="h-9 px-3 pr-8 text-xs font-bold uppercase tracking-wider border border-[#D1D5DB] bg-bauhaus-white/80 text-bauhaus-fg cursor-pointer appearance-none focus:outline-none focus:border-bauhaus-blue transition-colors"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
              >
                {STATUS_FILTERS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action message */}
        {actionMsg && (
          <div
            className={`mb-6 flex items-center gap-3 px-4 py-3 border-l-[3px] ${
              actionMsg.type === 'success'
                ? 'bg-[#F0FDF4] border-[#16A34A]'
                : 'bg-[#FEF2F2] border-bauhaus-red'
            }`}
          >
            {actionMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-bauhaus-red shrink-0" />
            )}
            <p className={`text-sm ${actionMsg.type === 'success' ? 'text-[#16A34A]' : 'text-bauhaus-red'}`}>
              {actionMsg.text}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-[#FEF2F2] border-l-[3px] border-bauhaus-red px-4 py-3">
            <AlertCircle className="w-4 h-4 text-bauhaus-red shrink-0" />
            <p className="text-sm text-bauhaus-red">{error}</p>
            <button onClick={fetchRegistrations} className="ml-auto text-sm font-bold text-bauhaus-red underline cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-bauhaus-white/80 border border-[#1F2937]/20 overflow-hidden animate-pulse">
                <div className="h-0.75 bg-[#E0E0E0]" />
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-5 w-20 bg-[#E5E7EB]" />
                        <div className="h-4 w-24 bg-[#E5E7EB]" />
                      </div>
                      <div className="h-5 w-48 bg-[#E5E7EB] mb-2" />
                      <div className="flex gap-4 mt-2">
                        <div className="h-3 w-24 bg-[#E5E7EB]" />
                        <div className="h-3 w-32 bg-[#E5E7EB]" />
                      </div>
                      <div className="h-3 w-28 bg-[#E5E7EB] mt-2" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-9 w-20 bg-[#E5E7EB]" />
                      <div className="h-9 w-16 bg-[#E5E7EB]" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && registrations.length === 0 && (
          <div className="text-center py-20">
            <CalendarX className="w-12 h-12 text-[#D1D5DB] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-bauhaus-fg uppercase tracking-tight">
              {statusFilter ? `No ${STATUS_FILTERS.find(f => f.value === statusFilter)?.label.toLowerCase()} registrations` : 'No registrations yet'}
            </h3>
            <p className="text-sm text-[#6B7280] mt-1">
              {statusFilter
                ? 'Try selecting a different filter or view all registrations.'
                : 'Browse events and register to see them here.'}
            </p>
            <Link
              to="/events"
              className="mt-4 inline-block px-4 py-2 bg-bauhaus-blue text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0D3399] transition-colors"
            >
              Browse Events
            </Link>
          </div>
        )}

        {/* Registration list */}
        {!loading && registrations.length > 0 && (
          <>
            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-8 h-8 text-[#D1D5DB] mx-auto mb-3" />
                <p className="text-sm text-[#6B7280]">No registrations match "{searchQuery}"</p>
              </div>
            ) : (
            <div className="space-y-3">
              {filteredRegistrations.map((reg) => (
                <RegistrationRow
                  key={reg.id}
                  registration={reg}
                  onCancel={handleCancelClick}
                  cancelling={cancelling}
                  onViewTicket={(tc, ev) => setTicketModal({ ticketCode: tc, event: ev })}
                />
              ))}
            </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#111827]/40">
                <span className="text-xs text-[#6B7280]">
                  Page {page + 1} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-1 px-3 py-1.5 bg-bauhaus-white/80 border border-[#D1D5DB] text-xs font-bold text-bauhaus-fg uppercase tracking-wider disabled:opacity-30 disabled:pointer-events-none hover:bg-bauhaus-bg transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="flex items-center gap-1 px-3 py-1.5 bg-bauhaus-white/80 border border-[#D1D5DB] text-xs font-bold text-bauhaus-fg uppercase tracking-wider disabled:opacity-30 disabled:pointer-events-none hover:bg-bauhaus-bg transition-colors cursor-pointer"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Ticket Modal */}
      {ticketModal && (
        <TicketModal
          ticketCode={ticketModal.ticketCode}
          event={ticketModal.event}
          onClose={() => setTicketModal(null)}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      {cancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setCancelConfirm(null)}>
          <div
            className="bg-bauhaus-white border-2 border-bauhaus-fg shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] p-6 max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-bauhaus-red flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-black text-bauhaus-fg uppercase tracking-tight">Cancel Registration?</h3>
            </div>
            <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
              This action cannot be undone. You will lose your spot and ticket for this event.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCancelConfirm(null)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider border border-[#D1D5DB] bg-bauhaus-white/80 text-bauhaus-fg hover:bg-bauhaus-bg transition-colors cursor-pointer"
              >
                Keep Registration
              </button>
              <button
                onClick={handleCancelConfirm}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-bauhaus-red text-white hover:bg-[#B01010] transition-colors cursor-pointer"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

/* ── Registration Row ── */
function RegistrationRow({ registration: reg, onCancel, cancelling, onViewTicket }) {
  const statusInfo = REG_STATUS_STYLE[reg.status] || REG_STATUS_STYLE.CONFIRMED;
  const event = reg.event || {};
  const isPast = event.endDate && new Date(event.endDate) < new Date();
  const canCancel = reg.status === 'CONFIRMED' && !isPast;
  const isCancelling = cancelling === reg.id;

  return (
    <div className="bg-bauhaus-white/80 border border-[#1F2937]/20 overflow-hidden hover:border-bauhaus-fg/60 transition-colors">
      <div className="h-0.75" style={{ backgroundColor: statusInfo.bg }} />
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Left — Event info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span
                className="px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shrink-0"
                style={{ backgroundColor: statusInfo.bg }}
              >
                {statusInfo.label}
              </span>
              {reg.ticketCode && (
                <span className="flex items-center gap-1 text-[11px] text-[#6B7280] font-mono">
                  <Ticket className="w-3 h-3" /> {reg.ticketCode}
                </span>
              )}
            </div>

            <Link
              to={`/events/${event.id}`}
              className="text-[15px] font-bold text-bauhaus-fg uppercase tracking-tight hover:text-bauhaus-blue transition-colors"
            >
              {event.title || 'Event'}
            </Link>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#9CA3AF] mt-2">
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {event.location}
                </span>
              )}
              {event.startDate && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {fmtDate(event.startDate)} at {fmtTime(event.startDate)}
                </span>
              )}
            </div>

            <p className="text-[11px] text-[#9CA3AF] mt-1">
              <span title={fmtDate(reg.registeredAt)}>Registered {timeAgo(reg.registeredAt)}</span>
              {reg.cancelledAt && <span title={fmtDate(reg.cancelledAt)}> · Cancelled {timeAgo(reg.cancelledAt)}</span>}
            </p>
          </div>

          {/* Right — Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {reg.ticketCode && reg.status === 'CONFIRMED' && (
              <button
                onClick={() => onViewTicket(reg.ticketCode, event)}
                className="px-4 h-9 flex items-center gap-1.5 bg-bauhaus-white/80 border border-[#D1D5DB] text-xs font-bold text-bauhaus-fg uppercase tracking-wider hover:bg-bauhaus-bg transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" /> Ticket
              </button>
            )}
            {reg.status === 'CONFIRMED' && (
              <>
                <button
                  onClick={() => downloadICS(event)}
                  title="Download .ics file"
                  className="px-3 h-9 flex items-center gap-1 bg-bauhaus-white/80 border border-[#D1D5DB] text-xs font-bold text-bauhaus-fg uppercase tracking-wider hover:bg-bauhaus-bg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> .ics
                </button>
                <a
                  href={getGoogleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Add to Google Calendar"
                  className="px-3 h-9 flex items-center gap-1 bg-bauhaus-white/80 border border-[#D1D5DB] text-xs font-bold text-bauhaus-fg uppercase tracking-wider hover:bg-bauhaus-bg transition-colors"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                </a>
              </>
            )}
            <Link
              to={`/events/${event.id}`}
              className="px-4 h-9 flex items-center bg-bauhaus-white/80 border border-[#D1D5DB] text-xs font-bold text-bauhaus-fg uppercase tracking-wider hover:bg-bauhaus-bg transition-colors"
            >
              View
            </Link>
            {canCancel && (
              <button
                onClick={() => onCancel(reg.id)}
                disabled={isCancelling}
                className="px-4 h-9 flex items-center gap-1 bg-bauhaus-white/80 border border-[#D1D5DB] text-xs font-bold text-bauhaus-red uppercase tracking-wider hover:bg-[#FEF2F2] disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isCancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}