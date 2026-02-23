import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { X, Megaphone, Ban } from 'lucide-react';

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const addToast = useCallback(({ title, message, type = 'info', duration = 6000 }) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    timers.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timers.current[id];
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Toast overlay */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-60 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 border-l-[3px] shadow-lg animate-slide-in ${
                t.type === 'published'
                  ? 'bg-bauhaus-white border-[#16A34A]'
                  : t.type === 'cancelled'
                    ? 'bg-bauhaus-white border-bauhaus-red'
                    : 'bg-bauhaus-white border-bauhaus-blue'
              }`}
            >
              {t.type === 'published' ? (
                <Megaphone className="w-4 h-4 text-[#16A34A] mt-0.5 shrink-0" />
              ) : t.type === 'cancelled' ? (
                <Ban className="w-4 h-4 text-bauhaus-red mt-0.5 shrink-0" />
              ) : null}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-bauhaus-fg uppercase tracking-tight">{t.title}</p>
                <p className="text-xs text-bauhaus-fg/70 mt-0.5">{t.message}</p>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="p-0.5 hover:bg-bauhaus-fg/10 transition-colors cursor-pointer shrink-0 rounded"
              >
                <X className="w-3.5 h-3.5 text-bauhaus-fg/60" />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
