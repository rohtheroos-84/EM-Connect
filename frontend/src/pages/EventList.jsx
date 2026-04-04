import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { searchEvents, getActiveCategories } from '../services/api';
import { Search, MapPin, Clock, Users, ChevronLeft, ChevronRight, AlertCircle, Calendar, X, SlidersHorizontal, ArrowUpDown, ChevronDown, Tag } from 'lucide-react';
import { generateBauhausBanner } from '../services/bauhausBanner';
import { toApiUrl } from '../services/urls';
import AppLayout from '../components/AppLayout';
import { useWebSocket } from '../context/WebSocketContext';

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

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'title', label: 'Title A–Z' },
];

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [activeCategories, setActiveCategories] = useState([]);
  const [liveCounts, setLiveCounts] = useState({});
  const [seatPulseByEventId, setSeatPulseByEventId] = useState({});
  const debounceRef = useRef(null);
  const pulseTimersRef = useRef(new Map());
  const { subscribe, unsubscribe, addListener, removeListener } = useWebSocket();

  const PAGE_SIZE = 15;

  // Fetch active categories on mount
  useEffect(() => {
    getActiveCategories().then(setActiveCategories).catch(() => {});
  }, []);

  const fetchEvents = useCallback(async (keyword, pg, category = '', tag = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchEvents(keyword || '', pg, PAGE_SIZE, category, tag);
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
      fetchEvents(search.trim(), 0, categoryFilter, tagFilter.trim());
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search, categoryFilter, tagFilter, fetchEvents]);

  // Page change
  const changePage = (newPage) => {
    setPage(newPage);
    fetchEvents(search.trim(), newPage, categoryFilter, tagFilter.trim());
  };

  const clearSearch = () => {
    setSearch('');
    setCategoryFilter('');
    setTagFilter('');
    setPage(0);
    fetchEvents('', 0);
  };

  const clearOnlySearch = () => {
    setSearch('');
    setPage(0);
  };

  const clearOnlyCategory = () => {
    setCategoryFilter('');
    setPage(0);
  };

  const clearOnlyTag = () => {
    setTagFilter('');
    setPage(0);
  };

  const handleCategoryClick = (cat) => {
    const next = categoryFilter === cat ? '' : cat;
    setCategoryFilter(next);
    setPage(0);
  };

  // Client-side sort (server doesn't support sort param)
  const sortedEvents = [...events].sort((a, b) => {
    if (sortBy === 'oldest') return new Date(a.startDate || 0) - new Date(b.startDate || 0);
    if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
    return new Date(b.startDate || 0) - new Date(a.startDate || 0); // newest
  });

  const hasActiveFilters = search.trim() || categoryFilter || tagFilter.trim();
  const visibleEventIds = useMemo(
    () => events.map((ev) => Number(ev.id)).filter(Number.isFinite),
    [events],
  );

  // Subscribe to participant updates for currently visible cards.
  useEffect(() => {
    if (visibleEventIds.length === 0) return;

    visibleEventIds.forEach((eventId) => subscribe(eventId));
    return () => {
      visibleEventIds.forEach((eventId) => unsubscribe(eventId));
    };
  }, [visibleEventIds, subscribe, unsubscribe]);

  // Pulse the seats line when participant count changes.
  useEffect(() => {
    const onParticipantCount = (payload) => {
      const eventId = Number(payload?.eventId);
      const count = Number(payload?.count);
      if (!Number.isFinite(eventId) || !Number.isFinite(count)) return;

      setLiveCounts((prev) => {
        if (prev[eventId] === count) return prev;
        return { ...prev, [eventId]: count };
      });

      setSeatPulseByEventId((prev) => ({ ...prev, [eventId]: true }));

      const prevTimer = pulseTimersRef.current.get(eventId);
      if (prevTimer) clearTimeout(prevTimer);

      const timer = setTimeout(() => {
        setSeatPulseByEventId((prev) => ({ ...prev, [eventId]: false }));
        pulseTimersRef.current.delete(eventId);
      }, 1100);

      pulseTimersRef.current.set(eventId, timer);
    };

    addListener('participant.count', onParticipantCount);

    return () => {
      removeListener('participant.count', onParticipantCount);
      pulseTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      pulseTimersRef.current.clear();
    };
  }, [addListener, removeListener]);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-8 pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-black text-bauhaus-fg tracking-tight uppercase">
            Events
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            {loading ? 'Loading…' : `${totalElements} event${totalElements !== 1 ? 's' : ''} available`}
          </p>
        </div>

        {/* ── Unified Toolbar — sticky ── */}
        <div className="sticky top-0 z-10 bg-bauhaus-bg -mx-6 px-6 lg:-mx-8 lg:px-8 py-3 mb-6 border-b border-[#E0E0E0] dark:border-white/10 space-y-3">
          {/* Row 1: Search + Category dropdown + Tag input + Sort */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-50 max-w-sm">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events…"
                className="w-full pl-9 pr-8 h-9 bg-bauhaus-white/80 border border-[#D1D5DB] text-xs text-bauhaus-fg placeholder:text-[#BCBCBC] placeholder:italic focus:border-bauhaus-blue focus:outline-none transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-[#9CA3AF] hover:text-bauhaus-fg cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category dropdown */}
            {activeCategories.length > 0 && (
              <div className="flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#6B7280] hidden sm:block" />
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
                    style={{ textAlignLast: 'center' }}
                    className="h-9 min-w-54 pl-3 pr-8 text-[11px] font-bold uppercase tracking-wider text-center border border-[#D1D5DB] bg-bauhaus-white/80 text-bauhaus-fg cursor-pointer appearance-none focus:outline-none focus:border-bauhaus-blue transition-colors"
                  >
                    <option value="">All Categories</option>
                    {activeCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat.charAt(0) + cat.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280]" />
                </div>
              </div>
            )}

            {/* Tag filter */}
            <div className="relative">
              <input
                type="text"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                placeholder="Filter by tag…"
                className="pl-7 pr-3 h-9 w-40 bg-bauhaus-white/80 border border-[#D1D5DB] text-xs text-bauhaus-fg placeholder:text-[#BCBCBC] placeholder:italic focus:border-bauhaus-blue focus:outline-none transition-colors"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1 ml-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#6B7280] hidden sm:block" />
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ textAlignLast: 'center' }}
                  className="h-9 min-w-52 pl-3 pr-8 text-[11px] font-bold uppercase tracking-wider text-center border border-[#D1D5DB] bg-bauhaus-white/80 text-bauhaus-fg cursor-pointer appearance-none focus:outline-none focus:border-bauhaus-blue transition-colors"
                >
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280]" />
              </div>
            </div>

            {/* Clear all */}
            {hasActiveFilters && (
              <button
                onClick={clearSearch}
                className="h-9 px-3 text-[10px] font-bold uppercase tracking-wider text-bauhaus-red hover:bg-[#FEF2F2] border border-transparent hover:border-bauhaus-red/20 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Row 2: Category pills (quick toggles) */}
          {activeCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activeCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'text-white border-transparent'
                      : 'text-bauhaus-fg/40 border-[#E0E0E0] hover:border-bauhaus-fg/30 bg-bauhaus-white/60'
                  }`}
                  style={categoryFilter === cat ? { backgroundColor: CATEGORY_COLORS[cat] || '#6B7280' } : {}}
                >
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-[#FEF2F2] border-l-[3px] border-bauhaus-red px-4 py-3">
            <AlertCircle className="w-4 h-4 text-bauhaus-red shrink-0" />
            <p className="text-sm text-bauhaus-red">{error}</p>
            <button onClick={() => fetchEvents(search.trim(), page, categoryFilter, tagFilter.trim())} className="ml-auto text-sm font-bold text-bauhaus-red underline cursor-pointer">
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
              {hasActiveFilters ? 'No matching events' : 'No events yet'}
            </h3>
            <p className="text-sm text-[#6B7280] mt-1">
              {hasActiveFilters
                ? 'Try relaxing one filter below to recover results quickly.'
                : 'Events will appear here once they are published.'}
            </p>

            {hasActiveFilters && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {search.trim() && (
                  <button
                    onClick={clearOnlySearch}
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-[#D1D5DB] bg-bauhaus-white/80 text-bauhaus-fg hover:border-bauhaus-blue/40 hover:text-bauhaus-blue transition-colors cursor-pointer"
                  >
                    Clear search
                  </button>
                )}

                {categoryFilter && (
                  <button
                    onClick={clearOnlyCategory}
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-[#D1D5DB] bg-bauhaus-white/80 text-bauhaus-fg hover:border-bauhaus-blue/40 hover:text-bauhaus-blue transition-colors cursor-pointer"
                  >
                    Clear category
                  </button>
                )}

                {tagFilter.trim() && (
                  <button
                    onClick={clearOnlyTag}
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-[#D1D5DB] bg-bauhaus-white/80 text-bauhaus-fg hover:border-bauhaus-blue/40 hover:text-bauhaus-blue transition-colors cursor-pointer"
                  >
                    Clear tag
                  </button>
                )}

                <button
                  onClick={clearSearch}
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-bauhaus-blue text-white border border-bauhaus-blue hover:bg-[#0D3399] transition-colors cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Event grid */}
        {!loading && sortedEvents.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  liveRegistered={liveCounts[Number(event.id)]}
                  pulseSeats={!!seatPulseByEventId[Number(event.id)]}
                />
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
function EventCard({ event, liveRegistered, pulseSeats }) {
  const status = STATUS_STYLE[event.status] || STATUS_STYLE.DRAFT;
  const isPast = event.endDate && new Date(event.endDate) < new Date();
  const capacity = Number(event.capacity) || 0;
  const hasCapacity = capacity > 0;
  const hasLiveCount = Number.isFinite(liveRegistered);
  const seatsLeft = hasLiveCount ? Math.max(capacity - liveRegistered, 0) : null;

  return (
    <Link
      to={`/events/${event.id}`}
      className="block bg-bauhaus-white/80 border border-[#1F2937]/20 overflow-hidden hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.7)] hover:border-bauhaus-fg transition-all duration-150 group"
    >
      {/* Banner image */}
      <div className="h-36 overflow-hidden bg-[#E5E7EB]">
        <img
          src={event.bannerUrl ? toApiUrl(event.bannerUrl) : generateBauhausBanner(event.title, event.id)}
          alt=""
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
        />
      </div>

      <div className="p-5">
        {/* Status + category + date */}
        <div className="flex items-center flex-wrap gap-1.5 mb-3">
          <span
            className="px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider"
            style={{ backgroundColor: status.bg }}
          >
            {status.label}
          </span>
          {event.category && (
            <span
              className="px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider"
              style={{ backgroundColor: CATEGORY_COLORS[event.category] || '#6B7280' }}
            >
              {event.category}
            </span>
          )}
          <span className="text-[11px] text-[#9CA3AF] ml-auto">{fmtDate(event.startDate)}</span>
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

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {event.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-[9px] font-bold text-bauhaus-fg/50 uppercase tracking-wider border border-[#D1D5DB] bg-bauhaus-bg/50"
              >
                {tag}
              </span>
            ))}
            {event.tags.length > 4 && (
              <span className="px-1.5 py-0.5 text-[9px] text-[#9CA3AF]">+{event.tags.length - 4}</span>
            )}
          </div>
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
          {hasCapacity && (
            <span
              className={`flex items-center gap-1 transition-colors duration-300 ${
                pulseSeats ? 'text-bauhaus-blue animate-pulse font-semibold' : ''
              }`}
            >
              <Users className="w-3 h-3" />
              {hasLiveCount ? `${seatsLeft} seats left` : `${capacity} capacity`}
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