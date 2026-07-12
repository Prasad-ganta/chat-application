export default function OnlineUsersBar({ isConnected, onlineUsers, username }) {
  return (
    <div className="chat-header">
      <div className="chat-header-left">
        <span className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
        <div>
          <div className="chat-title">Team Chat</div>
          <div className="chat-subtitle">
            {isConnected ? `${onlineUsers.length} online` : 'Reconnecting...'}
          </div>
        </div>
      </div>
      <div className="chat-header-right">
        <span className="me-label">You: {username}</span>
      </div>
    </div>
  );
}
