import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

const WebSocketContext = createContext(null);

const WS_URL =
  typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
    : 'ws://localhost:8081/ws';

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;
const PING_INTERVAL_MS = 30000;

export function WebSocketProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const pingTimer = useRef(null);
  const reconnectDelay = useRef(RECONNECT_BASE_MS);
  const listenersRef = useRef(new Map()); // type -> Set<callback>
  const subscriptionsRef = useRef(new Set()); // eventIds currently subscribed
  const mountedRef = useRef(true);

  /* ── Send helper ── */
  const send = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  /* ── Connect ── */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setConnected(true);
        reconnectDelay.current = RECONNECT_BASE_MS;

        // Re-subscribe to all topics
        subscriptionsRef.current.forEach((eventId) => {
          ws.send(JSON.stringify({ type: 'subscribe', payload: { eventId: Number(eventId) } }));
        });

        // Start keep-alive pings
        pingTimer.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, PING_INTERVAL_MS);
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          const callbacks = listenersRef.current.get(msg.type);
          if (callbacks) {
            callbacks.forEach((cb) => {
              try { cb(msg.payload, msg.type); } catch { /* ignore */ }
            });
          }
          // Also fire wildcard listeners
          const wildcard = listenersRef.current.get('*');
          if (wildcard) {
            wildcard.forEach((cb) => {
              try { cb(msg.payload, msg.type); } catch { /* ignore */ }
            });
          }
        } catch { /* ignore non-JSON */ }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        clearInterval(pingTimer.current);
        scheduleReconnect();
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      scheduleReconnect();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleReconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    reconnectTimer.current = setTimeout(() => {
      if (mountedRef.current) {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, RECONNECT_MAX_MS);
        connect();
      }
    }, reconnectDelay.current);
  }, [connect]);

  /* ── Subscribe / Unsubscribe to event topics ── */
  const subscribe = useCallback(
    (eventId) => {
      subscriptionsRef.current.add(eventId);
      send({ type: 'subscribe', payload: { eventId: Number(eventId) } });
    },
    [send],
  );

  const unsubscribe = useCallback(
    (eventId) => {
      subscriptionsRef.current.delete(eventId);
      send({ type: 'unsubscribe', payload: { eventId: Number(eventId) } });
    },
    [send],
  );

  /* ── Listener management ── */
  const addListener = useCallback((type, callback) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type).add(callback);
  }, []);

  const removeListener = useCallback((type, callback) => {
    listenersRef.current.get(type)?.delete(callback);
  }, []);

  /* ── Lifecycle ── */
  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      clearInterval(pingTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [connect]);

  const value = { connected, subscribe, unsubscribe, addListener, removeListener };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export function useWebSocket() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWebSocket must be used inside WebSocketProvider');
  return ctx;
}
