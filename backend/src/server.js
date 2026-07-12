require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const createMessageRoutes = require('./routes/messages');
const { registerSocketHandlers } = require('./socket');

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const allowedOrigins = CLIENT_ORIGIN.split(',').map((o) => o.trim());

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

// REST routes (socket instance injected so REST-created messages also broadcast)
app.use('/api/messages', createMessageRoutes(io));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Socket.io handlers
registerSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
  console.log(`Allowed client origins: ${allowedOrigins.join(', ')}`);
});
