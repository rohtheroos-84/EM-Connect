import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Calendar,
  Ticket,
  MapPin,
  Clock,
  Activity,
  BarChart3,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Zap,
} from 'lucide-react';
import { getAnalytics } from '../services/api';
import AppLayout from '../components/AppLayout';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

/* ── Bauhaus palette ── */
const COLORS = {
  red: '#D02020',
  blue: '#1040C0',
  yellow: '#F0C020',
  green: '#16A34A',
  purple: '#7C3AED',
  orange: '#EA580C',
  cyan: '#0891B2',
  pink: '#DB2777',
};

const PIE_EVENT = [COLORS.blue, COLORS.green, COLORS.red, COLORS.purple];
const PIE_REG   = [COLORS.green, COLORS.red, COLORS.blue, COLORS.yellow];

/* ── Animated counter ── */
function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) { setDisplay(0); return; }
    let start = 0;
    const step = Math.ceil(value / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{display.toLocaleString()}</span>;
}

/* ── Custom tooltip ── */
function BauhausTooltip({ active, payload, label, valueLabel = 'Count' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bauhaus-nav text-white px-3 py-2 text-xs font-medium shadow-lg border-l-[3px] border-bauhaus-red">
      <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold" style={{ color: p.color || '#fff' }}>
          {p.name || valueLabel}: {p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

/* ── Section header ── */
function SectionHeader({ title, icon: Icon, accent = 'bg-bauhaus-red' }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-1 h-6 ${accent}`} />
      <Icon className="w-4 h-4 text-bauhaus-fg/40" />
      <h3 className="text-sm font-black text-bauhaus-fg uppercase tracking-wider">{title}</h3>
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ label, value, icon: Icon, accent, sub }) {
  return (
    <div className="bg-bauhaus-white border border-bauhaus-fg/6 relative overflow-hidden group hover:shadow-md transition-shadow duration-200">
      <div className={`absolute top-0 left-0 w-1 h-full ${accent}`} />
      <div className="p-5 pl-7">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em] mb-1">{label}</p>
            <p className="text-3xl font-black text-bauhaus-fg tracking-tight">
              <AnimatedNumber value={value} />
            </p>
            {sub && <p className="text-[11px] text-bauhaus-fg/40 mt-1 font-medium">{sub}</p>}
          </div>
          <div className={`w-10 h-10 flex items-center justify-center ${accent} opacity-10 group-hover:opacity-20 transition-opacity`}>
            <Icon className="w-5 h-5 text-bauhaus-fg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Chart card wrapper ── */
function ChartCard({ children, className = '' }) {
  return (
    <div className={`bg-bauhaus-white border border-bauhaus-fg/6 p-5 ${className}`}>
      {children}
    </div>
  );
}

/* ── Fill‐rate progress bar ── */
function FillBar({ title, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-bauhaus-fg truncate max-w-45">{title}</span>
        <span className="text-[10px] font-bold text-bauhaus-fg/40 uppercase tracking-wider ml-2 whitespace-nowrap">
          {value}/{max} <span className="text-bauhaus-fg/25">·</span> {pct}%
        </span>
      </div>
      <div className="h-2.5 bg-bauhaus-fg/6 overflow-hidden">
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ── Hour formatter ── */
function fmtHour(h) {
  if (h === 0) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

/* ── Main page ── */
export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getAnalytics();
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 text-bauhaus-blue animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-bauhaus-red text-sm font-bold">Failed to load analytics: {error}</p>
        </div>
      </AppLayout>
    );
  }

  /* ── Derived data ── */
  const {
    registrationTrend = [],
    userGrowth = [],
    popularEvents = [],
    peakHours = [],
    dayOfWeek = [],
    eventStatusBreakdown = {},
    registrationStatusBreakdown = {},
    topLocations = [],
    recentActivity = [],
    totalEvents = 0,
    totalRegistrations = 0,
    totalUsers = 0,
    confirmedRegistrations = 0,
  } = data || {};

  // Combined trend for area chart (merge registration + user growth by date)
  const trendMap = {};
  registrationTrend.forEach(({ date, count }) => {
    trendMap[date] = { ...(trendMap[date] || {}), date, registrations: count };
  });
  userGrowth.forEach(({ date, count }) => {
    trendMap[date] = { ...(trendMap[date] || {}), date, users: count };
  });
  const combinedTrend = Object.values(trendMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      ...d,
      registrations: d.registrations || 0,
      users: d.users || 0,
      label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    }));

  // Event status pie data
  const eventPieData = [
    { name: 'Draft', value: eventStatusBreakdown.DRAFT || 0 },
    { name: 'Published', value: eventStatusBreakdown.PUBLISHED || 0 },
    { name: 'Cancelled', value: eventStatusBreakdown.CANCELLED || 0 },
    { name: 'Completed', value: eventStatusBreakdown.COMPLETED || 0 },
  ].filter(d => d.value > 0);

  // Registration status pie data
  const regPieData = [
    { name: 'Confirmed', value: registrationStatusBreakdown.CONFIRMED || 0 },
    { name: 'Cancelled', value: registrationStatusBreakdown.CANCELLED || 0 },
    { name: 'Attended', value: registrationStatusBreakdown.ATTENDED || 0 },
    { name: 'No Show', value: registrationStatusBreakdown.NO_SHOW || 0 },
  ].filter(d => d.value > 0);

  // Peak hours with color
  const hoursData = peakHours.map(({ hour, count }) => ({
    hour: fmtHour(hour),
    count,
    fill: hour >= 9 && hour <= 17 ? COLORS.blue : hour >= 18 && hour <= 22 ? COLORS.yellow : COLORS.red,
  }));

  // Fill rate (from popular events)
  const avgFillRate = popularEvents.length > 0
    ? Math.round(popularEvents.reduce((sum, e) => sum + (e.capacity > 0 ? (e.registrations / e.capacity) * 100 : 0), 0) / popularEvents.length)
    : 0;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pb-12">

        {/* ── Page header ── */}
        <div className="pt-8 pb-6 border-b border-bauhaus-fg/6">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-bauhaus-red" />
              <div className="w-3 h-3 bg-bauhaus-yellow" />
              <div className="w-3 h-3 bg-bauhaus-blue" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em]">Platform</p>
              <h1 className="text-2xl font-black text-bauhaus-fg tracking-tight uppercase">Analytics</h1>
            </div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatCard label="Total Events" value={totalEvents} icon={Calendar} accent="bg-bauhaus-blue" sub={`${eventStatusBreakdown.PUBLISHED || 0} live`} />
          <StatCard label="Registrations" value={totalRegistrations} icon={Ticket} accent="bg-bauhaus-red" sub={`${confirmedRegistrations} confirmed`} />
          <StatCard label="Users" value={totalUsers} icon={Users} accent="bg-bauhaus-yellow" />
          <StatCard label="Avg Fill Rate" value={avgFillRate} icon={TrendingUp} accent="bg-[#16A34A]" sub="across published events" />
        </div>

        {/* ── Registration + User growth trend ── */}
        <div className="mt-8">
          <SectionHeader title="30-Day Trend" icon={TrendingUp} accent="bg-bauhaus-blue" />
          <ChartCard>
            {combinedTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={combinedTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradReg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.blue} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={COLORS.blue} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradUser" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={COLORS.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-bauhaus-fg)" strokeOpacity={0.06} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-bauhaus-fg)', fillOpacity: 0.35 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--color-bauhaus-fg)', fillOpacity: 0.35 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<BauhausTooltip />} />
                  <Area type="monotone" dataKey="registrations" name="Registrations" stroke={COLORS.blue} fill="url(#gradReg)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="users" name="New Users" stroke={COLORS.green} fill="url(#gradUser)" strokeWidth={2} dot={false} />
                  <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-bauhaus-fg/30 text-center py-16 font-medium">No trend data yet</p>
            )}
          </ChartCard>
        </div>

        {/* ── Two-col: Popular events + Peak hours ── */}
        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          {/* Popular events */}
          <div>
            <SectionHeader title="Popular Events" icon={Flame} accent="bg-bauhaus-red" />
            <ChartCard>
              {popularEvents.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={popularEvents} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-bauhaus-fg)" strokeOpacity={0.06} horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--color-bauhaus-fg)', fillOpacity: 0.35 }} axisLine={false} tickLine={false} />
                    <YAxis
                      dataKey="title" type="category" width={100}
                      tick={{ fontSize: 10, fill: 'var(--color-bauhaus-fg)', fillOpacity: 0.6, fontWeight: 700 }}
                      axisLine={false} tickLine={false}
                      tickFormatter={(v) => v.length > 14 ? v.slice(0, 14) + '…' : v}
                    />
                    <Tooltip content={<BauhausTooltip valueLabel="Registrations" />} />
                    <Bar dataKey="registrations" name="Registrations" fill={COLORS.red} radius={[0, 3, 3, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-bauhaus-fg/30 text-center py-16 font-medium">No events yet</p>
              )}
            </ChartCard>
          </div>

          {/* Peak hours */}
          <div>
            <SectionHeader title="Peak Registration Hours" icon={Clock} accent="bg-bauhaus-yellow" />
            <ChartCard>
              {hoursData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={hoursData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-bauhaus-fg)" strokeOpacity={0.06} />
                    <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'var(--color-bauhaus-fg)', fillOpacity: 0.35, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--color-bauhaus-fg)', fillOpacity: 0.35 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<BauhausTooltip valueLabel="Registrations" />} />
                    <Bar dataKey="count" name="Registrations" radius={[3, 3, 0, 0]} barSize={14}>
                      {hoursData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-bauhaus-fg/30 text-center py-16 font-medium">No data yet</p>
              )}
            </ChartCard>
          </div>
        </div>

        {/* ── Two-col: Status breakdowns (donuts) ── */}
        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          {/* Event status */}
          <div>
            <SectionHeader title="Event Status" icon={Calendar} accent="bg-bauhaus-blue" />
            <ChartCard>
              {eventPieData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie data={eventPieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} stroke="none">
                        {eventPieData.map((_, i) => <Cell key={i} fill={PIE_EVENT[i % PIE_EVENT.length]} />)}
                      </Pie>
                      <Tooltip content={<BauhausTooltip valueLabel="Events" />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {eventPieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: PIE_EVENT[i % PIE_EVENT.length] }} />
                        <span className="text-xs font-bold text-bauhaus-fg/60 uppercase tracking-wider flex-1">{d.name}</span>
                        <span className="text-sm font-black text-bauhaus-fg">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-bauhaus-fg/30 text-center py-16 font-medium">No events yet</p>
              )}
            </ChartCard>
          </div>

          {/* Registration status */}
          <div>
            <SectionHeader title="Registration Status" icon={Ticket} accent="bg-[#16A34A]" />
            <ChartCard>
              {regPieData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie data={regPieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} stroke="none">
                        {regPieData.map((_, i) => <Cell key={i} fill={PIE_REG[i % PIE_REG.length]} />)}
                      </Pie>
                      <Tooltip content={<BauhausTooltip valueLabel="Registrations" />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {regPieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: PIE_REG[i % PIE_REG.length] }} />
                        <span className="text-xs font-bold text-bauhaus-fg/60 uppercase tracking-wider flex-1">{d.name}</span>
                        <span className="text-sm font-black text-bauhaus-fg">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-bauhaus-fg/30 text-center py-16 font-medium">No registrations yet</p>
              )}
            </ChartCard>
          </div>
        </div>

        {/* ── Two-col: Day of week + Capacity utilization ── */}
        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          {/* Day of week */}
          <div>
            <SectionHeader title="Day of Week" icon={BarChart3} accent="bg-bauhaus-yellow" />
            <ChartCard>
              {dayOfWeek.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dayOfWeek} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-bauhaus-fg)" strokeOpacity={0.06} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-bauhaus-fg)', fillOpacity: 0.5, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--color-bauhaus-fg)', fillOpacity: 0.35 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<BauhausTooltip valueLabel="Registrations" />} />
                    <Bar dataKey="count" name="Registrations" fill={COLORS.yellow} radius={[3, 3, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-bauhaus-fg/30 text-center py-8 font-medium">No data yet</p>
              )}
            </ChartCard>
          </div>

          {/* Capacity utilization */}
          <div>
            <SectionHeader title="Capacity Utilization" icon={Zap} accent="bg-bauhaus-red" />
            <ChartCard>
              {popularEvents.length > 0 ? (
                <div className="space-y-1">
                  {popularEvents.slice(0, 6).map((e, i) => (
                    <FillBar
                      key={i}
                      title={e.title}
                      value={e.registrations}
                      max={e.capacity}
                      color={[COLORS.red, COLORS.blue, COLORS.yellow, COLORS.green, COLORS.purple, COLORS.orange][i % 6]}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-bauhaus-fg/30 text-center py-8 font-medium">No events yet</p>
              )}
            </ChartCard>
          </div>
        </div>

        {/* ── Two-col: Top locations + Recent activity ── */}
        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          {/* Top locations */}
          <div>
            <SectionHeader title="Top Locations" icon={MapPin} accent="bg-bauhaus-blue" />
            <ChartCard>
              {topLocations.length > 0 ? (
                <div className="space-y-3">
                  {topLocations.map((loc, i) => {
                    const maxCount = topLocations[0]?.count || 1;
                    const pct = Math.round((loc.count / maxCount) * 100);
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-bauhaus-blue" />
                            <span className="text-xs font-bold text-bauhaus-fg">{loc.location}</span>
                          </div>
                          <span className="text-xs font-black text-bauhaus-fg/50">{loc.count} events</span>
                        </div>
                        <div className="h-2 bg-bauhaus-fg/6 overflow-hidden">
                          <div className="h-full bg-bauhaus-blue transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-bauhaus-fg/30 text-center py-8 font-medium">No location data</p>
              )}
            </ChartCard>
          </div>

          {/* Recent activity */}
          <div>
            <SectionHeader title="Recent Activity" icon={Activity} accent="bg-[#16A34A]" />
            <ChartCard>
              {recentActivity.length > 0 ? (
                <div className="space-y-0">
                  {recentActivity.map((act, i) => {
                    const isConfirmed = act.status === 'CONFIRMED';
                    return (
                      <div key={i} className="flex items-start gap-3 py-2.5 border-b border-bauhaus-fg/4 last:border-0">
                        <div className={`mt-0.5 w-6 h-6 flex items-center justify-center shrink-0 ${isConfirmed ? 'bg-[#16A34A]/10' : 'bg-bauhaus-red/10'}`}>
                          {isConfirmed
                            ? <ArrowUpRight className="w-3 h-3 text-[#16A34A]" />
                            : <ArrowDownRight className="w-3 h-3 text-bauhaus-red" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-bauhaus-fg font-bold truncate">
                            {act.userName}{' '}
                            <span className="font-medium text-bauhaus-fg/40">
                              {isConfirmed ? 'registered for' : 'cancelled'}
                            </span>{' '}
                            {act.eventTitle}
                          </p>
                          <p className="text-[10px] text-bauhaus-fg/30 mt-0.5 font-medium">
                            {act.time ? new Date(act.time).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
                            }) : '—'}
                          </p>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${isConfirmed ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'bg-bauhaus-red/10 text-bauhaus-red'}`}>
                          {act.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-bauhaus-fg/30 text-center py-8 font-medium">No activity yet</p>
              )}
            </ChartCard>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
