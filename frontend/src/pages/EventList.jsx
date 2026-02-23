import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { searchEvents } from '../services/api';
import { Search, MapPin, Clock, Users, ChevronLeft, ChevronRight, AlertCircle, Calendar, X } from 'lucide-react';
import AppLayout from '../components/AppLayout';

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const STATUS_STYLE = {
  PUBLISHED: { bg: '#16A34A', label: 'Live' },
  DRAFT: { bg: '#9CA3AF', label: 'Draft' },
  CANCELLED: { bg: '#D02020', label: 'Cancelled' },
  COMPLETED: { bg: '#1040C0', label: 'Completed' },
};

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const debounceRef = useRef(null);

  const PAGE_SIZE = 15;

  const fetchEvents = useCallback(async (keyword, pg) => {
    setLoading(true);
    setError(null);
    try {
      // Always use search endpoint — empty keyword returns all published events
      const data = await searchEvents(keyword || '', pg, PAGE_SIZE);
      setEvents(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchEvents('', 0); }, [fetchEvents]);

  // Debounced search — fires 400ms after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      fetchEvents(search.trim(), 0);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search, fetchEvents]);

  // Page change
  const changePage = (newPage) => {
    setPage(newPage);
    fetchEvents(search.trim(), newPage);
  };

  const clearSearch = () => {
    setSearch('');
    setPage(0);
    fetchEvents('', 0);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-bauhaus-fg tracking-tight uppercase">
              Events
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              {loading ? 'Loading…' : `${totalElements} event${totalElements !== 1 ? 's' : ''} available`}
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events…"
              className="pl-9 pr-9 h-10 w-72 bg-bauhaus-white/80 border border-[#D1D5DB] text-sm text-bauhaus-fg placeholder:text-[#BCBCBC] placeholder:italic focus:border-bauhaus-blue focus:shadow-[0_0_0_3px_rgba(16,64,192,0.08)] transition-all duration-150"
            />
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-[#9CA3AF] hover:text-bauhaus-fg cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-[#FEF2F2] border-l-[3px] border-bauhaus-red px-4 py-3">
            <AlertCircle className="w-4 h-4 text-bauhaus-red shrink-0" />
            <p className="text-sm text-bauhaus-red">{error}</p>
            <button onClick={() => fetchEvents(search.trim(), page)} className="ml-auto text-sm font-bold text-bauhaus-red underline cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-bauhaus-white/80 border border-[#1F2937]/20 overflow-hidden animate-pulse">
                <div className="h-0.75 bg-[#E0E0E0]" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-[#E5E7EB] rounded w-3/4" />
                  <div className="h-4 bg-[#E5E7EB] rounded w-1/2" />
                  <div className="h-4 bg-[#E5E7EB] rounded w-2/3" />
                  <div className="h-4 bg-[#E5E7EB] rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && events.length === 0 && (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-[#D1D5DB] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-bauhaus-fg uppercase tracking-tight">
              {search.trim() ? 'No events found' : 'No events yet'}
            </h3>
            <p className="text-sm text-[#6B7280] mt-1">
              {search.trim()
                ? `No events match "${search.trim()}". Try a different search.`
                : 'Events will appear here once they are published.'}
            </p>
            {search.trim() && (
              <button
                onClick={clearSearch}
                className="mt-4 px-4 py-2 bg-bauhaus-blue text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0D3399] transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Event grid */}
        {!loading && events.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#111827]/40">
                <span className="text-xs text-[#6B7280]">
                  Page {page + 1} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => changePage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-1 px-3 py-1.5 bg-bauhaus-white/80 border border-[#D1D5DB] text-xs font-bold text-bauhaus-fg uppercase tracking-wider disabled:opacity-30 disabled:pointer-events-none hover:bg-bauhaus-bg transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <button
                    onClick={() => changePage(Math.min(totalPages - 1, page + 1))}
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
    </AppLayout>
  );
}

/* ── Event Card ── */
function EventCard({ event }) {
  const status = STATUS_STYLE[event.status] || STATUS_STYLE.DRAFT;
  const isPast = event.endDate && new Date(event.endDate) < new Date();

  return (
    <Link
      to={`/events/${event.id}`}
      className="block bg-bauhaus-white/80 border border-[#1F2937]/20 overflow-hidden hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.7)] hover:border-bauhaus-fg transition-all duration-150 group"
    >
      <div className="h-0.75" style={{ backgroundColor: status.bg }} />
      <div className="p-5">
        {/* Status + date */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider"
            style={{ backgroundColor: status.bg }}
          >
            {status.label}
          </span>
          <span className="text-[11px] text-[#9CA3AF]">{fmtDate(event.startDate)}</span>
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-bold text-bauhaus-fg uppercase tracking-tight leading-snug mb-3 group-hover:text-bauhaus-blue transition-colors">
          {event.title}
        </h3>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-[#6B7280] leading-relaxed mb-4 line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#9CA3AF]">
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {event.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {fmtTime(event.startDate)}
          </span>
          {event.capacity > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {event.capacity} capacity
            </span>
          )}
        </div>

        {isPast && (
          <p className="mt-3 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
            Event ended
          </p>
        )}
      </div>
    </Link>
  );
}