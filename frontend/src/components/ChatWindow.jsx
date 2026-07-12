import { useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import MessageInput from './MessageInput';
import OnlineUsersBar from './OnlineUsersBar';

export default function ChatWindow({ username }) {
  const {
    messages,
    isConnected,
    onlineUsers,
    typingUsers,
    error,
    historyLoading,
    sendMessage,
    notifyTyping,
    markMessagesRead,
    clearError,
  } = useChat(username);

  const bottomRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers.length]);

  // Mark incoming messages from others as read once they're visible
  useEffect(() => {
    const unread = messages.filter((m) => m.username !== username && m.status !== 'read');
    if (unread.length > 0) {
      markMessagesRead(unread.map((m) => m.id));
    }
  }, [messages, username, markMessagesRead]);

  return (
    <div className="chat-window">
      <OnlineUsersBar isConnected={isConnected} onlineUsers={onlineUsers} username={username} />

      {error && (
        <div className="error-banner" onClick={clearError}>
          {error} <span className="dismiss">✕</span>
        </div>
      )}

      <div className="messages-container">
        {historyLoading ? (
          <div className="empty-state">Loading chat history...</div>
        ) : messages.length === 0 ? (
          <div className="empty-state">No messages yet. Say hello 👋</div>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m.id} message={m} isOwn={m.username === username} />
          ))
        )}
        <TypingIndicator typingUsers={typingUsers} />
        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={sendMessage} onTyping={notifyTyping} disabled={!isConnected} />
    </div>
  );
}
