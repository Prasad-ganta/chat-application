const express = require('express');
const { v4: uuidv4 } = require('uuid');
const messageStore = require('../db/messageStore');

/**
 * Routes are created via a factory function so we can inject the
 * Socket.io instance, letting REST-created messages also broadcast
 * in real time to connected clients.
 */
module.exports = function createMessageRoutes(io) {
  const router = express.Router();

  // GET /api/messages - fetch chat history
  router.get('/', (req, res) => {
    try {
      const messages = messageStore.getAllMessages();
      res.status(200).json({ success: true, data: messages });
    } catch (err) {
      console.error('Error fetching messages:', err);
      res.status(500).json({ success: false, error: 'Failed to fetch chat history' });
    }
  });

  // POST /api/messages - send a message
  router.post('/', (req, res) => {
    try {
      const { username, text } = req.body;

      if (!username || typeof username !== 'string' || !username.trim()) {
        return res.status(400).json({ success: false, error: 'username is required' });
      }
      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ success: false, error: 'text is required' });
      }

      const message = messageStore.createMessage({
        id: uuidv4(),
        username: username.trim(),
        text: text.trim(),
        timestamp: Date.now(),
        status: 'sent',
      });

      // Broadcast to all connected clients in real time
      io.emit('message:new', message);

      res.status(201).json({ success: true, data: message });
    } catch (err) {
      console.error('Error creating message:', err);
      res.status(500).json({ success: false, error: 'Failed to send message' });
    }
  });

  return router;
};
