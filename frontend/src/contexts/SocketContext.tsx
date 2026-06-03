import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';

type SocketContextValue = {
  socket: Socket | null;
  lastUpdate: number;
};

const SocketContext = createContext<SocketContextValue>({ socket: null, lastUpdate: 0 });

import { getSocketUrl } from '@/lib/env';

const SOCKET_URL = getSocketUrl();

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lastUpdate, setLastUpdate] = useState(0);

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    s.on('dashboard:update', () => setLastUpdate(Date.now()));
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, lastUpdate }}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
