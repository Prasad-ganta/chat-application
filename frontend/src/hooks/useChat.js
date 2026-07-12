import { useState, useEffect, useCallback, useRef } from 'react';
import { socket } from '../services/socket';
import { fetchMessages } from '../services/api';

/**
 * Encapsulates all chat state: messages, connection status, presence,
 * typing indicators, and errors. Keeping this in one hook keeps the
 * UI components simple and focused on rendering.
 */
export function useChat(username) {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [error, setError] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const typingTimeoutRef = useRef(null);

  // Load chat history once on mount (survives refresh)
  useEffect(() => {
    let cancelled = false;
    setHistoryLoading(true);
    fetchMessages()
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Connect socket once we have a username
  useEffect(() => {
    if (!username) return;

    socket.connect();

    function handleConnect() {
      setIsConnected(true);
      setError(null);
      socket.emit('user:join', username);
    }

    function handleDisconnect() {
      setIsConnected(false);
    }

    function handleConnectError() {
      setError('Unable to connect to chat server. Retrying...');
      setIsConnected(false);
    }

    function handleNewMessage(message) {
      setMessages((prev) => {
        // Avoid duplicates if REST + socket both deliver the same message
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    }

    function handleStatusUpdate({ id, status }) {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    }

    function handleBulkStatusUpdate({ ids, status }) {
      setMessages((prev) => prev.map((m) => (ids.includes(m.id) ? { ...m, status } : m)));
    }

    function handlePresenceUpdate(users) {
      setOnlineUsers(users);
    }

    function handleTypingUpdate({ username: typer, isTyping }) {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) next.add(typer);
        else next.delete(typer);
        return next;
      });
    }

    function handleServerError(msg) {
      setError(msg);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('message:new', handleNewMessage);
    socket.on('message:status', handleStatusUpdate);
    socket.on('message:status:bulk', handleBulkStatusUpdate);
    socket.on('presence:update', handlePresenceUpdate);
    socket.on('typing:update', handleTypingUpdate);
    socket.on('error:message', handleServerError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('message:new', handleNewMessage);
      socket.off('message:status', handleStatusUpdate);
      socket.off('message:status:bulk', handleBulkStatusUpdate);
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('typing:update', handleTypingUpdate);
      socket.off('error:message', handleServerError);
      socket.disconnect();
    };
  }, [username]);

  const sendMessage = useCallback(
    (text) => {
      if (!text.trim()) return;
      socket.emit('message:send', { text }, (response) => {
        if (!response?.success) {
          setError(response?.error || 'Failed to send message');
        }
      });
      socket.emit('typing:stop');
    },
    []
  );

  const notifyTyping = useCallback(() => {
    socket.emit('typing:start');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop');
    }, 1500);
  }, []);

  const markMessagesRead = useCallback((ids) => {
    if (ids.length === 0) return;
    socket.emit('message:read', ids);
  }, []);

  return {
    messages,
    isConnected,
    onlineUsers,
    typingUsers: Array.from(typingUsers).filter((u) => u !== username),
    error,
    historyLoading,
    sendMessage,
    notifyTyping,
    markMessagesRead,
    clearError: () => setError(null),
  };
}
