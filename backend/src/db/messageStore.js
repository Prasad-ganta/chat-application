const { readData, writeData } = require('./index');

/**
 * Data access layer for chat messages, backed by db/index.js (JSON file).
 * Function signatures are unchanged from the previous SQLite version, so
 * routes and socket handlers did not need any changes.
 */

function createMessage({ id, username, text, timestamp, status = 'sent' }) {
  const data = readData();
  const message = { id, username, text, timestamp, status };
  data.messages.push(message);
  writeData(data);
  return message;
}

function getAllMessages() {
  const data = readData();
  return [...data.messages].sort((a, b) => a.timestamp - b.timestamp);
}

function getRecentMessages(limit = 50) {
  const all = getAllMessages();
  return all.slice(-limit);
}

function updateMessageStatus(id, status) {
  const data = readData();
  const msg = data.messages.find((m) => m.id === id);
  if (msg) {
    msg.status = status;
    writeData(data);
  }
}

function markAllAsRead() {
  const data = readData();
  data.messages.forEach((m) => {
    if (m.status !== 'read') m.status = 'read';
  });
  writeData(data);
}

module.exports = {
  createMessage,
  getAllMessages,
  getRecentMessages,
  updateMessageStatus,
  markAllAsRead,
};
