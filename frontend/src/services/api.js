import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 8000,
});

/**
 * Fetch full chat history.
 * Throws a normalized Error with a readable message on failure.
 */
export async function fetchMessages() {
  try {
    const res = await api.get('/messages');
    return res.data.data;
  } catch (err) {
    const msg = err.response?.data?.error || 'Could not load chat history. Is the server running?';
    throw new Error(msg);
  }
}

/**
 * Send a message via REST (fallback path; primary path is the socket).
 */
export async function sendMessageRest(username, text) {
  try {
    const res = await api.post('/messages', { username, text });
    return res.data.data;
  } catch (err) {
    const msg = err.response?.data?.error || 'Could not send message.';
    throw new Error(msg);
  }
}

export default api;
