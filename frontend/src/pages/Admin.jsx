import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Calendar,
  BarChart3,
  Shield,
  ShieldOff,
  Plus,
  Pencil,
  Trash2,
  Send,
  XCircle,
  CheckCircle,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  UserCircle,
  Eye,
} from 'lucide-react';
import {
  getAdminDashboard,
  getAllUsers,
  promoteUser,
  demoteUser,
  getAdminEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  cancelEvent,
  completeEvent,
  getEventRegistrations,
} from '../services/api';
import AppLayout from '../components/AppLayout';
import EventFormModal from '../components/EventFormModal';
import { Link } from 'react-router-dom';

/* ── Helpers ── */
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  return `${fmtDate(iso)} at ${fmtTime(iso)}`;
}

const STATUS_STYLE = {
  DRAFT: { bg: '#9CA3AF', label: 'Draft' },
  PUBLISHED: { bg: '#16A34A', label: 'Published' },
  CANCELLED: { bg: '#D02020', label: 'Cancelled' },
  COMPLETED: { bg: '#1040C0', label: 'Completed' },
};

const ROLE_STYLE = {
  ADMIN: { bg: '#F0C020', text: '#121212' },
  USER: { bg: '#1040C0', text: '#FFFFFF' },
};

const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'events', label: 'Events', icon: Calendar },
  { key: 'users', label: 'Users', icon: Users },
];

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="pt-8 pb-6 border-b border-[#E0E0E0]">
          <p className="text-[11px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em]">
            Administration
          </p>
          <div className="flex items-end justify-between mt-1">
            <h2 className="text-2xl font-black text-bauhaus-fg tracking-tight uppercase">
              Admin Panel
            </h2>
            <span className="px-2.5 py-1 bg-bauhaus-yellow text-bauhaus-fg text-[10px] font-bold uppercase tracking-wider">
              {user?.name || 'Admin'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 pt-6 pb-2 border-b border-[#E0E0E0]">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === key
                  ? 'bg-bauhaus-fg text-bauhaus-bg'
                  : 'text-bauhaus-fg/40 hover:text-bauhaus-fg/70 hover:bg-bauhaus-fg/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="py-6 pb-10">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'events' && <EventsTab />}
          {activeTab === 'users' && <UsersTab currentUserId={user?.id} />}
        </div>
      </div>
    </AppLayout>
  );
}

/* ══════════════════════════════════════════════
   OVERVIEW TAB
   ══════════════════════════════════════════════ */
function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAdminDashboard();
        setStats(data);
      } catch {
        /* fail silently */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#9CA3AF] animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-10 h-10 text-bauhaus-red mx-auto mb-3" />
        <p className="text-sm text-[#6B7280]">Failed to load dashboard stats.</p>
      </div>
    );
  }

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, accent: '#D02020', icon: <Users className="w-4 h-4" /> },
    { label: 'Total Events', value: stats.totalEvents, accent: '#1040C0', icon: <Calendar className="w-4 h-4" /> },
    { label: 'Total Registrations', value: stats.totalRegistrations, accent: '#F0C020', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Confirmed Regs', value: stats.confirmedRegistrations, accent: '#16A34A', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  const eventBreakdown = [
    { label: 'Draft', value: stats.draftEvents, color: '#9CA3AF' },
    { label: 'Published', value: stats.publishedEvents, color: '#16A34A' },
    { label: 'Cancelled', value: stats.cancelledEvents, color: '#D02020' },
    { label: 'Completed', value: stats.completedEvents, color: '#1040C0' },
  ];

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div>
        <h3 className="text-[11px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em] mb-4">
          Platform Stats
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((c) => (
            <div key={c.label} className="bg-bauhaus-white/80 border border-[#1F2937]/20 overflow-hidden">
              <div className="h-0.75" style={{ backgroundColor: c.accent }} />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 flex items-center justify-center text-white" style={{ backgroundColor: c.accent }}>
                    {c.icon}
                  </div>
                  <span className="text-[11px] font-bold text-bauhaus-fg/40 uppercase tracking-wider">{c.label}</span>
                </div>
                <p className="text-2xl font-black text-bauhaus-fg tracking-tight leading-none">{c.value ?? '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Event Breakdown */}
      <div>
        <h3 className="text-[11px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em] mb-4">
          Events by Status
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {eventBreakdown.map((item) => (
            <div key={item.label} className="bg-bauhaus-white/80 border border-[#1F2937]/20 overflow-hidden">
              <div className="h-0.75" style={{ backgroundColor: item.color }} />
              <div className="p-4 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <div>
                  <p className="text-lg font-black text-bauhaus-fg leading-none">{item.value ?? 0}</p>
                  <p className="text-[11px] text-bauhaus-fg/40 font-bold uppercase tracking-wider mt-0.5">{item.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   EVENTS TAB
   ══════════════════════════════════════════════ */
function EventsTab() {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // eventId being acted on
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [regLoading, setRegLoading] = useState(false);

  const PAGE_SIZE = 15;

  const fetchEvents = useCallback(async (pg, status) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminEvents(pg, PAGE_SIZE, status);
      setEvents(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(0, statusFilter);
  }, [fetchEvents, statusFilter]);

  const changePage = (newPage) => {
    setPage(newPage);
    fetchEvents(newPage, statusFilter);
  };

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    setPage(0);
  };

  /* ── Event actions ── */
  const handleCreateEvent = async (data) => {
    await createEvent(data);
    setShowModal(false);
    fetchEvents(page, statusFilter);
  };

  const handleEditEvent = async (data) => {
    await updateEvent(editingEvent.id, data);
    setEditingEvent(null);
    fetchEvents(page, statusFilter);
  };

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      if (action === 'publish') await publishEvent(id);
      else if (action === 'cancel') await cancelEvent(id);
      else if (action === 'complete') await completeEvent(id);
      else if (action === 'delete') {
        if (!window.confirm('Are you sure you want to delete this event?')) {
          setActionLoading(null);
          return;
        }
        await deleteEvent(id);
      }
      fetchEvents(page, statusFilter);
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  // View registrations for an event
  const handleViewRegistrations = async (eventId) => {
    if (expandedEvent === eventId) {
      setExpandedEvent(null);
      return;
    }
    setExpandedEvent(eventId);
    setRegLoading(true);
    try {
      const data = await getEventRegistrations(eventId, 0, 100);
      setRegistrations(data.content || []);
    } catch {
      setRegistrations([]);
    } finally {
      setRegLoading(false);
    }
  };

  const filters = [
    { value: '', label: 'All' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  return (
    <div>
      {/* Header & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-[11px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em]">
            Event Management
          </h3>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {loading ? 'Loading…' : `${totalElements} event${totalElements !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status filter */}
          <div className="flex gap-1">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => handleFilterChange(f.value)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  statusFilter === f.value
                    ? 'bg-bauhaus-fg text-bauhaus-bg'
                    : 'bg-bauhaus-white/60 text-bauhaus-fg/40 hover:text-bauhaus-fg/70 border border-[#1F2937]/15'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-bauhaus-blue text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0D3399] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Event
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-3 bg-[#FEF2F2] border-l-[3px] border-bauhaus-red px-4 py-3">
          <AlertCircle className="w-4 h-4 text-bauhaus-red shrink-0" />
          <p className="text-sm text-bauhaus-red">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-[#9CA3AF] animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && events.length === 0 && (
        <div className="text-center py-20">
          <Calendar className="w-12 h-12 text-[#D1D5DB] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-bauhaus-fg uppercase tracking-tight">No events found</h3>
          <p className="text-sm text-[#6B7280] mt-1">
            {statusFilter ? `No ${statusFilter.toLowerCase()} events.` : 'Create your first event to get started.'}
          </p>
        </div>
      )}

      {/* Event list */}
      {!loading && events.length > 0 && (
        <div className="space-y-2">
          {events.map((ev) => {
            const status = STATUS_STYLE[ev.status] || STATUS_STYLE.DRAFT;
            const isDraft = ev.status === 'DRAFT';
            const isPublished = ev.status === 'PUBLISHED';
            const isTerminal = ev.status === 'CANCELLED' || ev.status === 'COMPLETED';
            const isActing = actionLoading === ev.id;
            const isExpanded = expandedEvent === ev.id;

            return (
              <div key={ev.id} className="bg-bauhaus-white/80 border border-[#1F2937]/20 overflow-hidden">
                <div className="h-0.75" style={{ backgroundColor: status.bg }} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left - info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shrink-0"
                          style={{ backgroundColor: status.bg }}
                        >
                          {status.label}
                        </span>
                        <span className="text-[10px] text-[#9CA3AF] font-mono">ID: {ev.id}</span>
                      </div>
                      <Link
                        to={`/events/${ev.id}`}
                        className="text-[14px] font-bold text-bauhaus-fg uppercase tracking-tight hover:text-bauhaus-blue transition-colors"
                      >
                        {ev.title}
                      </Link>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[11px] text-[#9CA3AF]">
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {ev.location}
                          </span>
                        )}
                        {ev.startDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {fmtDateTime(ev.startDate)}
                          </span>
                        )}
                        {ev.capacity > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {ev.capacity} capacity
                          </span>
                        )}
                        {ev.organizer && (
                          <span className="flex items-center gap-1">
                            <UserCircle className="w-3 h-3" /> {ev.organizer.name || ev.organizer.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right - actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActing ? (
                        <Loader2 className="w-4 h-4 text-[#9CA3AF] animate-spin" />
                      ) : (
                        <>
                          {/* View registrations */}
                          <button
                            onClick={() => handleViewRegistrations(ev.id)}
                            title="View registrations"
                            className={`p-1.5 border text-[#9CA3AF] hover:text-bauhaus-blue hover:border-bauhaus-blue transition-colors cursor-pointer ${
                              isExpanded ? 'border-bauhaus-blue text-bauhaus-blue bg-bauhaus-blue/5' : 'border-[#D1D5DB]'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {/* Edit - only DRAFT */}
                          {isDraft && (
                            <button
                              onClick={() => setEditingEvent(ev)}
                              title="Edit event"
                              className="p-1.5 border border-[#D1D5DB] text-[#9CA3AF] hover:text-bauhaus-fg hover:border-bauhaus-fg transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Publish - only DRAFT */}
                          {isDraft && (
                            <button
                              onClick={() => handleAction(ev.id, 'publish')}
                              title="Publish event"
                              className="p-1.5 border border-[#D1D5DB] text-[#9CA3AF] hover:text-[#16A34A] hover:border-[#16A34A] transition-colors cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Complete - only PUBLISHED */}
                          {isPublished && (
                            <button
                              onClick={() => handleAction(ev.id, 'complete')}
                              title="Mark as completed"
                              className="p-1.5 border border-[#D1D5DB] text-[#9CA3AF] hover:text-bauhaus-blue hover:border-bauhaus-blue transition-colors cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Cancel - DRAFT or PUBLISHED */}
                          {!isTerminal && (
                            <button
                              onClick={() => handleAction(ev.id, 'cancel')}
                              title="Cancel event"
                              className="p-1.5 border border-[#D1D5DB] text-[#9CA3AF] hover:text-bauhaus-red hover:border-bauhaus-red transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Delete - non-PUBLISHED */}
                          {!isPublished && (
                            <button
                              onClick={() => handleAction(ev.id, 'delete')}
                              title="Delete event"
                              className="p-1.5 border border-[#D1D5DB] text-[#9CA3AF] hover:text-bauhaus-red hover:border-bauhaus-red transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded registrations */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#1F2937]/10">
                      <h4 className="text-[10px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em] mb-2">
                        Registrations
                      </h4>
                      {regLoading ? (
                        <div className="flex items-center gap-2 py-3">
                          <Loader2 className="w-3.5 h-3.5 text-[#9CA3AF] animate-spin" />
                          <span className="text-xs text-[#9CA3AF]">Loading…</span>
                        </div>
                      ) : registrations.length === 0 ? (
                        <p className="text-xs text-[#9CA3AF] py-2">No registrations for this event.</p>
                      ) : (
                        <div className="space-y-1">
                          {registrations.map((reg) => {
                            const regUser = reg.user || {};
                            const regStatusColor =
                              reg.status === 'CONFIRMED' ? '#16A34A' :
                              reg.status === 'CANCELLED' ? '#D02020' :
                              reg.status === 'ATTENDED' ? '#1040C0' : '#9CA3AF';
                            return (
                              <div key={reg.id} className="flex items-center gap-3 py-1.5 px-2 bg-bauhaus-bg/50 text-xs">
                                <span
                                  className="px-1.5 py-0.5 text-[8px] font-bold text-white uppercase tracking-wider shrink-0"
                                  style={{ backgroundColor: regStatusColor }}
                                >
                                  {reg.status}
                                </span>
                                <span className="text-bauhaus-fg font-medium truncate">{regUser.name || regUser.email || '—'}</span>
                                <span className="text-[#9CA3AF] truncate">{regUser.email || ''}</span>
                                {reg.ticketCode && (
                                  <span className="text-[#9CA3AF] font-mono text-[10px] ml-auto shrink-0">{reg.ticketCode}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#111827]/40">
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

      {/* Create modal */}
      {showModal && (
        <EventFormModal onSubmit={handleCreateEvent} onClose={() => setShowModal(false)} />
      )}

      {/* Edit modal */}
      {editingEvent && (
        <EventFormModal event={editingEvent} onSubmit={handleEditEvent} onClose={() => setEditingEvent(null)} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   USERS TAB
   ══════════════════════════════════════════════ */
function UsersTab({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handlePromote = async (id) => {
    if (!window.confirm('Promote this user to Admin?')) return;
    setActionLoading(id);
    try {
      await promoteUser(id);
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Failed to promote user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemote = async (id) => {
    if (!window.confirm('Demote this admin to regular User?')) return;
    setActionLoading(id);
    try {
      await demoteUser(id);
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Failed to demote user');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter users by search
  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-[11px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em]">
            User Management
          </h3>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {loading ? 'Loading…' : `${users.length} user${users.length !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="pl-3 pr-3 h-10 w-64 bg-bauhaus-white/80 border border-[#D1D5DB] text-sm text-bauhaus-fg placeholder:text-[#BCBCBC] placeholder:italic focus:border-bauhaus-blue transition-all duration-150"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-3 bg-[#FEF2F2] border-l-[3px] border-bauhaus-red px-4 py-3">
          <AlertCircle className="w-4 h-4 text-bauhaus-red shrink-0" />
          <p className="text-sm text-bauhaus-red">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-[#9CA3AF] animate-spin" />
        </div>
      )}

      {/* User list */}
      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-[#D1D5DB] mx-auto mb-4" />
          <p className="text-sm text-[#6B7280]">{search.trim() ? 'No users match your search.' : 'No users found.'}</p>
        </div>
      )}

      {!loading && filteredUsers.length > 0 && (
        <div className="space-y-2">
          {filteredUsers.map((u) => {
            const role = ROLE_STYLE[u.role] || ROLE_STYLE.USER;
            const isSelf = u.id === currentUserId;
            const isAdmin = u.role === 'ADMIN';
            const isActing = actionLoading === u.id;

            return (
              <div key={u.id} className="bg-bauhaus-white/80 border border-[#1F2937]/20 overflow-hidden">
                <div className="h-0.75" style={{ backgroundColor: isAdmin ? '#F0C020' : '#1040C0' }} />
                <div className="p-4 flex items-center justify-between gap-4">
                  {/* Left - user info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0"
                        style={{ backgroundColor: role.bg, color: role.text }}
                      >
                        {u.role}
                      </span>
                      <span className="text-[10px] text-[#9CA3AF] font-mono">ID: {u.id}</span>
                      {isSelf && (
                        <span className="text-[9px] font-bold text-bauhaus-blue uppercase tracking-wider">(You)</span>
                      )}
                    </div>
                    <p className="text-[14px] font-bold text-bauhaus-fg uppercase tracking-tight truncate">
                      {u.name || '(no name)'}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-[#9CA3AF]">
                      <span>{u.email}</span>
                      {u.oauthProvider && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full" />
                          {u.oauthProvider}
                        </span>
                      )}
                      {u.createdAt && (
                        <span>Joined {fmtDate(u.createdAt)}</span>
                      )}
                    </div>
                  </div>

                  {/* Right - actions */}
                  <div className="shrink-0">
                    {isSelf ? (
                      <span className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider">
                        Current user
                      </span>
                    ) : isActing ? (
                      <Loader2 className="w-4 h-4 text-[#9CA3AF] animate-spin" />
                    ) : isAdmin ? (
                      <button
                        onClick={() => handleDemote(u.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-bauhaus-red/30 text-bauhaus-red text-[10px] font-bold uppercase tracking-wider hover:bg-bauhaus-red/5 transition-colors cursor-pointer"
                      >
                        <ShieldOff className="w-3.5 h-3.5" />
                        Demote
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePromote(u.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-bauhaus-yellow/50 text-bauhaus-fg text-[10px] font-bold uppercase tracking-wider hover:bg-bauhaus-yellow/10 transition-colors cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Promote
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
  );
}
