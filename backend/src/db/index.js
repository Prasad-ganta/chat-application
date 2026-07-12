const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Lightweight JSON-file-based persistence layer.
 *
 * Swapped in to replace better-sqlite3, which requires native compilation
 * (node-gyp + a C++ toolchain) and fails on machines without build tools
 * installed (e.g. Windows without Visual Studio's "Desktop development
 * with C++" workload). This keeps zero native dependencies while still
 * persisting chat history to disk across restarts/refreshes.
 *
 * All reads/writes go through this module so the storage mechanism can be
 * swapped again later (e.g. to MongoDB) without touching routes or sockets.
 */

const dbPath = process.env.DB_PATH || './data/chat.json';
const resolvedPath = path.resolve(__dirname, '../../', dbPath);

const dataDir = path.dirname(resolvedPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(resolvedPath)) {
  fs.writeFileSync(resolvedPath, JSON.stringify({ messages: [] }, null, 2));
}

function readData() {
  try {
    const raw = fs.readFileSync(resolvedPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read DB file, reinitializing:', err.message);
    const fresh = { messages: [] };
    fs.writeFileSync(resolvedPath, JSON.stringify(fresh, null, 2));
    return fresh;
  }
}

function writeData(data) {
  fs.writeFileSync(resolvedPath, JSON.stringify(data, null, 2));
}

module.exports = { readData, writeData, resolvedPath };
