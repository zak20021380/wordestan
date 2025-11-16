import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const resolveSocketUrl = () => {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit) return explicit;
  const api = import.meta.env.VITE_API_URL;
  if (!api || api === '/api') {
    return window.location.origin;
  }
  return api.replace(/\/api$/, '');
};

export const useBattleSocket = ({ enabled, token }) => {
  const [status, setStatus] = useState('disconnected');
  const socketRef = useRef(null);
  const [socketError, setSocketError] = useState(null);

  useEffect(() => {
    if (!enabled || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socketUrl = resolveSocketUrl();
    const socket = io(`${socketUrl}/battle`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;
    setStatus('connecting');
    setSocketError(null);

    socket.on('connect', () => setStatus('connected'));
    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('connect_error', (error) => {
      setSocketError(error.message);
      setStatus('error');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, token]);

  return { socket: socketRef.current, status, error: socketError };
};
