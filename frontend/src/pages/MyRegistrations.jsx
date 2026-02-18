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
  Download,
  X,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';

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

const REG_STATUS_STYLE = {
  CONFIRMED: { bg: '#16A34A', label: 'Confirmed' },
  CANCELLED: { bg: '#D02020', label: 'Cancelled' },
  ATTENDED: { bg: '#1040C0', label: 'Attended' },
  NO_SHOW: { bg: '#9CA3AF', label: 'No Show' },
};

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeOnly, setActiveOnly] = useState(false);
  const [cancelling, setCancelling] = useState(null); // registration id being cancelled
  const [actionMsg, setActionMsg] = useState(null);
  const [ticketModal, setTicketModal] = useState(null); // { ticketCode, event }

  const PAGE_SIZE = 10;

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyRegistrations(page, PAGE_SIZE, activeOnly);
      setRegistrations(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, activeOnly]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleCancel = async (regId) => {
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

  const toggleFilter = () => {
    setActiveOnly((prev) => !prev);
    setPage(0);
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-bauhaus-fg tracking-tight uppercase">
              My Registrations
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              {loading ? 'Loading…' : `${totalElements} registration${totalElements !== 1 ? 's' : ''}`}
            </p>
          </div>

          <button
            onClick={toggleFilter}
            className={`px-4 h-10 text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
              activeOnly
                ? 'bg-bauhaus-blue text-white border-bauhaus-blue'
                : 'bg-white text-[#6B7280] border-[#D1D5DB] hover:bg-[#F5F5F5]'
            }`}
          >
            {activeOnly ? 'Active Only' : 'Show All'}
          </button>
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

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-[#E0E0E0] p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="h-5 bg-[#E5E7EB] rounded w-1/4" />
                  <div className="h-5 bg-[#E5E7EB] rounded w-1/6" />
                </div>
                <div className="h-4 bg-[#E5E7EB] rounded w-1/3 mt-3" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && registrations.length === 0 && (
          <div className="text-center py-20">
            <CalendarX className="w-12 h-12 text-[#D1D5DB] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-bauhaus-fg uppercase tracking-tight">
              {activeOnly ? 'No active registrations' : 'No registrations yet'}
            </h3>
            <p className="text-sm text-[#6B7280] mt-1">
              {activeOnly
                ? 'You have no active registrations. Try showing all registrations.'
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
            <div className="space-y-3">
              {registrations.map((reg) => (
                <RegistrationRow
                  key={reg.id}
                  registration={reg}
                  onCancel={handleCancel}
                  cancelling={cancelling}
                  onViewTicket={(tc, ev) => setTicketModal({ ticketCode: tc, event: ev })}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E0E0E0]">
                <span className="text-xs text-[#6B7280]">
                  Page {page + 1} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-[#D1D5DB] text-xs font-bold text-bauhaus-fg uppercase tracking-wider disabled:opacity-30 disabled:pointer-events-none hover:bg-[#F5F5F5] transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-[#D1D5DB] text-xs font-bold text-bauhaus-fg uppercase tracking-wider disabled:opacity-30 disabled:pointer-events-none hover:bg-[#F5F5F5] transition-colors cursor-pointer"
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
    <div className="bg-white border border-[#E0E0E0] overflow-hidden hover:border-[#C0C0C0] transition-colors">
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
              Registered {fmtDate(reg.registeredAt)}
              {reg.cancelledAt && ` · Cancelled ${fmtDate(reg.cancelledAt)}`}
            </p>
          </div>

          {/* Right — Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {reg.ticketCode && reg.status === 'CONFIRMED' && (
              <button
                onClick={() => onViewTicket(reg.ticketCode, event)}
                className="px-4 h-9 flex items-center gap-1.5 bg-white border border-[#D1D5DB] text-xs font-bold text-bauhaus-fg uppercase tracking-wider hover:bg-[#F5F5F5] transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" /> Ticket
              </button>
            )}
            <Link
              to={`/events/${event.id}`}
              className="px-4 h-9 flex items-center bg-white border border-[#D1D5DB] text-xs font-bold text-bauhaus-fg uppercase tracking-wider hover:bg-[#F5F5F5] transition-colors"
            >
              View
            </Link>
            {canCancel && (
              <button
                onClick={() => onCancel(reg.id)}
                disabled={isCancelling}
                className="px-4 h-9 flex items-center gap-1 bg-white border border-[#D1D5DB] text-xs font-bold text-bauhaus-red uppercase tracking-wider hover:bg-[#FEF2F2] disabled:opacity-50 transition-colors cursor-pointer"
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

/* ── Ticket Modal ── */
function TicketModal({ ticketCode, event, onClose }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const token = localStorage.getItem('token');
  const qrUrl = `/api/tickets/${ticketCode}/qr`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(qrUrl, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('not ready');
        const blob = await res.blob();
        if (!cancelled) setImgSrc(URL.createObjectURL(blob));
      } catch {
        if (!cancelled) setImgError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [qrUrl, token]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(qrUrl, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ticketCode}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    setDownloading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white border border-[#E0E0E0] w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E0E0E0]">
          <h3 className="text-sm font-bold text-bauhaus-fg uppercase tracking-tight">Your Ticket</h3>
          <button onClick={onClose} className="p-1 hover:bg-[#F5F5F5] transition-colors cursor-pointer">
            <X className="w-4 h-4 text-[#6B7280]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 text-center">
          <p className="text-[15px] font-bold text-bauhaus-fg uppercase tracking-tight mb-1">
            {event?.title || 'Event'}
          </p>
          <p className="text-xs text-[#6B7280] font-mono mb-4">{ticketCode}</p>

          {imgSrc ? (
            <img src={imgSrc} alt="QR Code" className="w-48 h-48 mx-auto border border-[#E0E0E0]" />
          ) : imgError ? (
            <div className="w-48 h-48 mx-auto border border-[#E0E0E0] flex items-center justify-center bg-[#FAFAFA]">
              <p className="text-xs text-[#9CA3AF]">QR generating…<br />Check back shortly.</p>
            </div>
          ) : (
            <div className="w-48 h-48 mx-auto border border-[#E0E0E0] flex items-center justify-center bg-[#FAFAFA]">
              <Loader2 className="w-6 h-6 text-[#9CA3AF] animate-spin" />
            </div>
          )}

          {imgSrc && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="mt-4 inline-flex items-center gap-1.5 px-4 h-9 bg-bauhaus-fg text-white text-xs font-bold uppercase tracking-wider hover:bg-[#333] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              {downloading ? 'Saving…' : 'Download QR'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}