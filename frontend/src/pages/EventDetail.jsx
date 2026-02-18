import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getEvent,
  getEventRegistrationStatus,
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
} from '../services/api';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Ticket,
  Loader2,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
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

const STATUS_STYLE = {
  PUBLISHED: { bg: '#16A34A', label: 'Live' },
  DRAFT: { bg: '#9CA3AF', label: 'Draft' },
  CANCELLED: { bg: '#D02020', label: 'Cancelled' },
  COMPLETED: { bg: '#1040C0', label: 'Completed' },
};

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [regStatus, setRegStatus] = useState(null); // { isRegistered, totalRegistrations }
  const [myReg, setMyReg] = useState(null); // user's registration for this event (if any)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState(null); // { type: 'success'|'error', text }

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ev, status] = await Promise.all([
        getEvent(id),
        getEventRegistrationStatus(id).catch(() => null),
      ]);
      setEvent(ev);
      setRegStatus(status);

      // If registered, find the user's registration to get id/ticketCode
      if (status?.isRegistered) {
        try {
          const myRegs = await getMyRegistrations(0, 50, false);
          const match = (myRegs.content || []).find(
            (r) => String(r.event?.id) === String(id) && r.status === 'CONFIRMED'
          );
          setMyReg(match || null);
        } catch {
          setMyReg(null);
        }
      } else {
        setMyReg(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRegister = async () => {
    setActionLoading(true);
    setActionMsg(null);
    try {
      const reg = await registerForEvent(id);
      setActionMsg({ type: 'success', text: `Registered! Your ticket: ${reg.ticketCode}` });
      setMyReg(reg);
      // Refresh status
      const status = await getEventRegistrationStatus(id).catch(() => null);
      setRegStatus(status);
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!myReg?.id) return;
    setActionLoading(true);
    setActionMsg(null);
    try {
      await cancelRegistration(myReg.id);
      setActionMsg({ type: 'success', text: 'Registration cancelled.' });
      setMyReg(null);
      const status = await getEventRegistrationStatus(id).catch(() => null);
      setRegStatus(status);
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-[#E5E7EB] rounded w-24" />
            <div className="h-8 bg-[#E5E7EB] rounded w-2/3" />
            <div className="h-4 bg-[#E5E7EB] rounded w-1/3" />
            <div className="h-40 bg-[#E5E7EB] rounded" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-bauhaus-red mx-auto mb-4" />
          <h2 className="text-lg font-bold text-bauhaus-fg uppercase mb-2">Failed to Load Event</h2>
          <p className="text-sm text-[#6B7280] mb-4">{error}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-bauhaus-blue text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0D3399] transition-colors cursor-pointer"
            >
              Retry
            </button>
            <Link
              to="/events"
              className="px-4 py-2 bg-white border border-[#D1D5DB] text-xs font-bold text-bauhaus-fg uppercase tracking-wider hover:bg-[#F5F5F5] transition-colors"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const status = STATUS_STYLE[event.status] || STATUS_STYLE.DRAFT;
  const isPast = event.endDate && new Date(event.endDate) < new Date();
  const isPublished = event.status === 'PUBLISHED';
  const isRegistered = regStatus?.isRegistered === true;
  const regActive = myReg && myReg.status === 'CONFIRMED';
  const canRegister = isPublished && !isPast && !isRegistered;
  const canCancel = regActive && !isPast;

  const capacityUsed = regStatus?.totalRegistrations || 0;
  const capacityTotal = event.capacity || 0;
  const capacityPct = capacityTotal > 0 ? Math.min(100, Math.round((capacityUsed / capacityTotal) * 100)) : 0;
  const isFull = capacityTotal > 0 && capacityUsed >= capacityTotal;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B7280] uppercase tracking-wider hover:text-bauhaus-fg transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Events
        </Link>

        {/* Main card */}
        <div className="bg-white border border-[#E0E0E0] overflow-hidden">
          <div className="h-1" style={{ backgroundColor: status.bg }} />

          <div className="p-6 sm:p-8">
            {/* Status + Organizer line */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className="px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider"
                style={{ backgroundColor: status.bg }}
              >
                {status.label}
              </span>
              {event.organizer && (
                <span className="text-[11px] text-[#9CA3AF]">
                  by {event.organizer.name || event.organizer.email}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-bauhaus-fg tracking-tight uppercase leading-tight mb-6">
              {event.title}
            </h1>

            {/* Meta grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pb-6 border-b border-[#E0E0E0]">
              <MetaItem icon={Calendar} label="Date" value={`${fmtDate(event.startDate)} — ${fmtDate(event.endDate)}`} />
              <MetaItem icon={Clock} label="Time" value={`${fmtTime(event.startDate)} — ${fmtTime(event.endDate)}`} />
              {event.location && (
                <MetaItem icon={MapPin} label="Location" value={event.location} />
              )}
              {capacityTotal > 0 && (
                <MetaItem icon={Users} label="Capacity" value={`${capacityUsed} / ${capacityTotal} registered`} />
              )}
            </div>

            {/* Capacity bar */}
            {capacityTotal > 0 && (
              <div className="mb-6">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#6B7280] font-medium">Capacity</span>
                  <span className="font-bold text-bauhaus-fg">{capacityPct}%</span>
                </div>
                <div className="h-2 bg-[#F3F4F6] overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${capacityPct}%`,
                      backgroundColor: isFull ? '#D02020' : '#1040C0',
                    }}
                  />
                </div>
                {isFull && (
                  <p className="text-[10px] font-bold text-bauhaus-red uppercase tracking-wider mt-1">
                    Event is full
                  </p>
                )}
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="mb-8">
                <h2 className="text-xs font-bold text-bauhaus-fg uppercase tracking-wider mb-3">
                  About this event
                </h2>
                <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Action messages */}
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

            {/* Registration section */}
            <div className="bg-[#FAFAFA] border border-[#E0E0E0] p-5">
              {regActive && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket className="w-4 h-4 text-[#16A34A]" />
                    <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                      You're registered
                    </span>
                  </div>
                  {myReg?.ticketCode && (
                    <p className="text-sm text-[#374151]">
                      Ticket: <span className="font-mono font-bold">{myReg.ticketCode}</span>
                    </p>
                  )}
                </div>
              )}

              {isRegistered && !regActive && (
                <div className="mb-4 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-bauhaus-red" />
                  <span className="text-xs font-bold text-bauhaus-red uppercase tracking-wider">
                    Registration cancelled
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {canRegister && !isFull && (
                  <button
                    onClick={handleRegister}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-6 h-12bauhaus-red text-white text-sm font-bold uppercase tracking-wider hover:bg-[#B91C1C] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Register Now
                  </button>
                )}

                {canRegister && isFull && (
                  <span className="flex items-center px-6 h-12 bg-[#E5E7EB] text-[#9CA3AF] text-sm font-bold uppercase tracking-wider">
                    Sold Out
                  </span>
                )}

                {canCancel && (
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-6 h-12 bg-white border border-[#D1D5DB] text-sm font-bold text-bauhaus-red uppercase tracking-wider hover:bg-[#FEF2F2] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Cancel Registration
                  </button>
                )}

                {isPast && (
                  <span className="flex items-center px-6 h-12 bg-[#E5E7EB] text-[#9CA3AF] text-sm font-bold uppercase tracking-wider">
                    Event Ended
                  </span>
                )}

                {!isPublished && !isPast && (
                  <span className="flex items-center px-6 h-12 bg-[#E5E7EB] text-[#9CA3AF] text-sm font-bold uppercase tracking-wider">
                    {event.status === 'CANCELLED' ? 'Event Cancelled' : 'Registration Not Open'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/* ── Meta Item ── */
function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-[#9CA3AF] mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">{label}</p>
        <p className="text-sm text-[#374151] mt-0.5">{value}</p>
      </div>
    </div>
  );
}