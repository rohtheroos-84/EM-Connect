import { useState, useEffect } from 'react';
import { Loader2, Download, QrCode, X } from 'lucide-react';

/**
 * Shared Ticket Modal — shows QR code with authenticated fetch,
 * event info, ticket code, and download button.
 *
 * Props:
 *   ticketCode  — e.g. "TKT-008C0A30"
 *   event       — { title, location } (or null)
 *   onClose     — callback to dismiss
 */
export default function TicketModal({ ticketCode, event, onClose }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const token = localStorage.getItem('em_token');
  const qrUrl = `/api/tickets/${ticketCode}/qr`;

  /* Fetch QR with auth header → blob URL */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(qrUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('not ready');
        const blob = await res.blob();
        if (!cancelled) setImgSrc(URL.createObjectURL(blob));
      } catch {
        if (!cancelled) setImgError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qrUrl, token]);

  /* Download QR as PNG file */
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(qrUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ticketCode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      /* ignore – QR may still be generating */
    }
    setDownloading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-bauhaus-white border border-[#1F2937]/30 w-full max-w-md mx-4 overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent bar */}
        <div className="h-1 bg-[#16A34A]" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-bauhaus-fg uppercase tracking-tight">
              Your Ticket
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-bauhaus-fg/10 transition-colors cursor-pointer rounded"
            >
              <X className="w-4 h-4 text-bauhaus-fg/70" />
            </button>
          </div>

          {/* Event info */}
          <div className="bg-bauhaus-bg/50 border border-[#1F2937]/20 p-4 mb-4 rounded">
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">
              Event
            </p>
            <p className="text-sm font-bold text-bauhaus-fg uppercase">
              {event?.title || 'Event'}
            </p>
            {event?.location && (
              <p className="text-[11px] text-[#6B7280] mt-1">{event.location}</p>
            )}
          </div>

          {/* Ticket code */}
          <div className="bg-bauhaus-bg/50 border border-[#1F2937]/20 p-4 mb-4 rounded">
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">
              Ticket Code
            </p>
            <p className="text-lg font-mono font-bold text-bauhaus-fg">{ticketCode}</p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center py-4">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={`QR code for ${ticketCode}`}
                className="w-48 h-48 border border-[#1F2937]/30 rounded"
              />
            ) : imgError ? (
              <div className="w-48 h-48 border border-dashed border-bauhaus-fg/30 flex flex-col items-center justify-center text-center p-4 rounded">
                <QrCode className="w-8 h-8 text-bauhaus-fg/40 mb-2" />
                <p className="text-[11px] text-bauhaus-fg/60">
                  QR code is being generated. Check back shortly.
                </p>
              </div>
            ) : (
              <div className="w-48 h-48 border border-[#1F2937]/30 flex items-center justify-center rounded">
                <Loader2 className="w-6 h-6 text-bauhaus-fg/50 animate-spin" />
              </div>
            )}
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={downloading || !imgSrc}
            className="w-full flex items-center justify-center gap-2 h-12 bg-bauhaus-nav text-white text-sm font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Saving…' : 'Download QR Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
