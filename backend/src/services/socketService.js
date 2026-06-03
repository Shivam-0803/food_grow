let io = null;

export const initSocket = (socketServer) => {
  io = socketServer;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

export const emitDashboardUpdate = (event, payload = {}) => {
  if (io) {
    io.emit('dashboard:update', { event, ...payload, timestamp: Date.now() });
  }
};
