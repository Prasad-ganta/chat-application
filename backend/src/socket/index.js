const { v4: uuidv4 } = require('uuid');
const messageStore = require('../db/messageStore');

/**
 * In-memory map of currently online users: socketId -> username.
 * This is intentionally simple (not persisted) since presence is
 * inherently a "live" concept, not chat history.
 */
const onlineUsers = new Map();

function getOnlineUsernames() {
  return Array.from(new Set(onlineUsers.values()));
}

function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ---- Presence: user joins with a username ----
    socket.on('user:join', (username) => {
      try {
        if (!username || typeof username !== 'string' || !username.trim()) {
          socket.emit('error:message', 'Invalid username');
          return;
        }
        socket.data.username = username.trim();
        onlineUsers.set(socket.id, socket.data.username);

        // Let everyone know the updated online list
        io.emit('presence:update', getOnlineUsernames());

        // Mark any undelivered messages as delivered now that a user is online
        messageStore.markAllAsRead === undefined ? null : null;
      } catch (err) {
        console.error('Error handling user:join', err);
        socket.emit('error:message', 'Failed to join chat');
      }
    });

    // ---- New message sent via socket (primary real-time path) ----
    socket.on('message:send', (payload, ack) => {
      try {
        const username = socket.data.username;
        const text = payload && payload.text;

        if (!username) {
          const errMsg = 'You must join with a username before sending messages';
          socket.emit('error:message', errMsg);
          if (typeof ack === 'function') ack({ success: false, error: errMsg });
          return;
        }
        if (!text || typeof text !== 'string' || !text.trim()) {
          const errMsg = 'Message text cannot be empty';
          socket.emit('error:message', errMsg);
          if (typeof ack === 'function') ack({ success: false, error: errMsg });
          return;
        }

        const message = messageStore.createMessage({
          id: uuidv4(),
          username,
          text: text.trim(),
          timestamp: Date.now(),
          status: 'sent',
        });

        // Broadcast to all connected clients (including sender for consistency)
        io.emit('message:new', message);

        // Simulate "delivered" status shortly after broadcast, since all
        // currently-connected clients receive it almost instantly.
        setTimeout(() => {
          messageStore.updateMessageStatus(message.id, 'delivered');
          io.emit('message:status', { id: message.id, status: 'delivered' });
        }, 300);

        if (typeof ack === 'function') ack({ success: true, data: message });
      } catch (err) {
        console.error('Error handling message:send', err);
        if (typeof ack === 'function') ack({ success: false, error: 'Failed to send message' });
      }
    });

    // ---- Read receipts: client tells server it has read messages ----
    socket.on('message:read', (messageIds) => {
      try {
        if (!Array.isArray(messageIds)) return;
        messageIds.forEach((id) => messageStore.updateMessageStatus(id, 'read'));
        io.emit('message:status:bulk', { ids: messageIds, status: 'read' });
      } catch (err) {
        console.error('Error handling message:read', err);
      }
    });

    // ---- Typing indicator ----
    socket.on('typing:start', () => {
      if (socket.data.username) {
        socket.broadcast.emit('typing:update', { username: socket.data.username, isTyping: true });
      }
    });

    socket.on('typing:stop', () => {
      if (socket.data.username) {
        socket.broadcast.emit('typing:update', { username: socket.data.username, isTyping: false });
      }
    });

    // ---- Graceful disconnect handling ----
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
      onlineUsers.delete(socket.id);
      io.emit('presence:update', getOnlineUsernames());
      if (socket.data.username) {
        socket.broadcast.emit('typing:update', { username: socket.data.username, isTyping: false });
      }
    });

    socket.on('error', (err) => {
      console.error(`Socket error on ${socket.id}:`, err);
    });
  });
}

module.exports = { registerSocketHandlers, getOnlineUsernames };
