import { useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { useToast } from '../context/ToastContext';

/**
 * Invisible component that bridges WebSocket announcements → Toast notifications.
 * Mount once inside AppLayout or App.
 */
export default function LiveAnnouncements() {
  const { addListener, removeListener, connected } = useWebSocket();
  const { addToast } = useToast();

  useEffect(() => {
    const onPublished = (payload) => {
      addToast({
        title: 'New Event Published',
        message: `${payload.eventTitle} — ${payload.location || 'TBA'}`,
        type: 'published',
        duration: 8000,
      });
    };

    const onCancelled = (payload) => {
      addToast({
        title: 'Event Cancelled',
        message: `${payload.eventTitle} has been cancelled.${
          payload.affectedRegistrations ? ` ${payload.affectedRegistrations} registration(s) affected.` : ''
        }`,
        type: 'cancelled',
        duration: 10000,
      });
    };

    addListener('event.published', onPublished);
    addListener('event.cancelled', onCancelled);

    return () => {
      removeListener('event.published', onPublished);
      removeListener('event.cancelled', onCancelled);
    };
  }, [addListener, removeListener, addToast]);

  // Render nothing — this is a headless component
  return null;
}
