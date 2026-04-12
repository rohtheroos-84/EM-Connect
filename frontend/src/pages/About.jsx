import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ExternalLink,
  Github,
  Globe,
  Linkedin,
  Mail,
  Radio,
  Server,
  ShieldCheck,
  Ticket,
  Users,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';

const PRODUCT_LINKS = [
  {
    label: 'GitHub Repository',
    href: 'https://github.com/rohtheroos-84/EM-Connect',
    note: 'Source code, architecture docs, and runbooks',
    Icon: Github,
  },
  {
    label: 'Status Page',
    href: 'https://stats.uptimerobot.com/v6aGZHL957',
    note: 'Public health and uptime visibility',
    Icon: Activity,
  },
];

const LIVE_SERVICES = [
  {
    label: 'Frontend',
    href: 'https://tryemconnect.netlify.app',
    note: 'React + Vite client app',
  },
  {
    label: 'API',
    href: 'https://em-connect-backend-api.onrender.com/actuator/health',
    note: 'Spring Boot health endpoint',
  },
  {
    label: 'WebSocket Hub',
    href: 'https://em-connect-websocket-hub.onrender.com/health',
    note: 'Realtime push service health',
  },
  {
    label: 'Notification Worker',
    href: 'https://em-connect-notification-worker.onrender.com/health',
    note: 'Email worker health',
  },
  {
    label: 'Ticket Worker',
    href: 'https://em-connect-ticket-worker.onrender.com/health',
    note: 'Ticket generation worker health',
  },
];

const CAPABILITIES = [
  {
    title: 'Event Lifecycle Management',
    text: 'Draft, publish, cancel, and complete events with clear organizer ownership flows.',
    Icon: Radio,
    accent: '#1040C0',
  },
  {
    title: 'Concurrency-safe Registrations',
    text: 'Registration flow uses transactional checks to protect capacity and avoid duplicate seats.',
    Icon: Users,
    accent: '#D02020',
  },
  {
    title: 'Async Ticket + Notification Pipeline',
    text: 'RabbitMQ events drive ticket generation, email notifications, and realtime updates.',
    Icon: Ticket,
    accent: '#F0C020',
  },
  {
    title: 'Role-based Security',
    text: 'JWT authentication with role-gated admin actions and protected user account areas.',
    Icon: ShieldCheck,
    accent: '#16A34A',
  },
];

const ARCH_BLOCKS = [
  {
    title: 'Frontend',
    text: 'React app for discovery, registration, profile, admin, and analytics.',
    accent: '#1040C0',
  },
  {
    title: 'API Core',
    text: 'Spring Boot manages auth, business rules, persistence, and event publishing.',
    accent: '#D02020',
  },
  {
    title: 'Message Backbone',
    text: 'RabbitMQ topic exchange decouples side effects from core request latency.',
    accent: '#F0C020',
  },
  {
    title: 'Workers',
    text: 'Go workers handle notifications, tickets, and websocket fan-out.',
    accent: '#16A34A',
  },
];

const FOUNDER_LINKS = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/rohitnagendran84/',
    Icon: Linkedin,
  },
  {
    label: 'Portfolio',
    href: 'https://rohit-builds.netlify.app',
    Icon: Globe,
  },
  {
    label: 'Email',
    href: 'mailto:rohit84.official@gmail.com',
    Icon: Mail,
  },
];

function ExternalLinkCard({ label, href, note, Icon }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-bauhaus-white/80 border border-[#1F2937]/20 p-4 hover:border-bauhaus-blue/50 transition-colors"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon ? <Icon className="w-4 h-4 text-bauhaus-fg/55 shrink-0" /> : null}
          <div className="min-w-0">
            <p className="text-sm font-bold text-bauhaus-fg uppercase tracking-tight truncate">{label}</p>
            {note ? <p className="text-[11px] text-[#6B7280] mt-0.5">{note}</p> : null}
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-bauhaus-fg/35 group-hover:text-bauhaus-blue transition-colors shrink-0" />
      </div>
    </a>
  );
}

export default function About() {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pb-12">
        <div className="pt-8 pb-6 border-b border-[#E0E0E0]">
          <p className="text-[11px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em]">Product</p>
          <h1 className="text-2xl font-black text-bauhaus-fg tracking-tight uppercase mt-1">About EM-Connect</h1>
          <p className="text-sm text-[#6B7280] mt-2 max-w-3xl">
            EM-Connect is a backend-first event management prototype focused on production-style architecture,
            resilient workflows, and clean user experience from discovery to registration.
          </p>
        </div>

        <section className="mt-6 bg-bauhaus-white/80 border border-[#1F2937]/20 overflow-hidden">
          <div className="flex h-1">
            <div className="flex-1 bg-bauhaus-red" />
            <div className="flex-1 bg-bauhaus-yellow" />
            <div className="flex-1 bg-bauhaus-blue" />
          </div>
          <div className="p-6 lg:p-7 flex flex-col lg:flex-row gap-6 lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-lg font-black text-bauhaus-fg uppercase tracking-tight">What this product solves</h2>
              <p className="text-sm text-[#374151] leading-relaxed mt-2">
                It demonstrates how to build a multi-service event system where core transactions stay fast,
                side effects run asynchronously, and users still get realtime feedback in the interface.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/events"
                className="h-11 px-4 inline-flex items-center gap-1.5 bg-bauhaus-blue text-white text-[11px] font-bold uppercase tracking-wider hover:bg-[#0D3399] transition-colors"
              >
                Browse Events <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <a
                href="https://github.com/rohtheroos-84/EM-Connect"
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-4 inline-flex items-center gap-1.5 bg-bauhaus-white border border-[#1F2937]/25 text-bauhaus-fg text-[11px] font-bold uppercase tracking-wider hover:bg-bauhaus-bg transition-colors"
              >
                View Source <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-bauhaus-fg/45" />
            <h2 className="text-[11px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em]">Core Capabilities</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CAPABILITIES.map(({ title, text, Icon, accent }) => (
              <div key={title} className="bg-bauhaus-white/80 border border-[#1F2937]/20 overflow-hidden">
                <div className="h-0.75" style={{ backgroundColor: accent }} />
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 shrink-0 flex items-center justify-center" style={{ backgroundColor: accent }}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-bauhaus-fg uppercase tracking-tight">{title}</p>
                      <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{text}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="w-4 h-4 text-bauhaus-fg/45" />
            <h2 className="text-[11px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em]">Architecture Snapshot</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ARCH_BLOCKS.map(({ title, text, accent }) => (
              <div key={title} className="bg-bauhaus-white/80 border border-[#1F2937]/20 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: accent }}>
                  {title}
                </p>
                <p className="text-xs text-[#6B7280] leading-relaxed mt-2">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-bauhaus-fg/45" />
              <h2 className="text-[11px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em]">Project Links</h2>
            </div>
            <div className="space-y-3">
              {PRODUCT_LINKS.map(({ label, href, note, Icon }) => (
                <ExternalLinkCard key={label} label={label} href={href} note={note} Icon={Icon} />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-bauhaus-fg/45" />
              <h2 className="text-[11px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em]">Live Services</h2>
            </div>
            <div className="space-y-3">
              {LIVE_SERVICES.map(({ label, href, note }) => (
                <ExternalLinkCard key={label} label={label} href={href} note={note} />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 bg-bauhaus-white/80 border border-[#1F2937]/20 overflow-hidden">
          <div className="h-1 bg-bauhaus-yellow" />
          <div className="p-6 lg:p-7">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-bauhaus-fg/45" />
              <h2 className="text-[11px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em]">Founder</h2>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
              <div>
                <p className="text-xl font-black text-bauhaus-fg tracking-tight uppercase">Rohit N</p>
                <p className="text-sm text-[#6B7280] mt-1">Builder of EM-Connect and full-stack developer focused on product-minded systems.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {FOUNDER_LINKS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith('mailto:') ? undefined : '_blank'}
                    rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                    className="h-10 px-3.5 inline-flex items-center gap-1.5 bg-bauhaus-white border border-[#1F2937]/25 text-bauhaus-fg text-[11px] font-bold uppercase tracking-wider hover:bg-bauhaus-bg transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}