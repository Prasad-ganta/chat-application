function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StatusTicks({ status }) {
  if (status === 'read') return <span className="ticks ticks-read">✓✓</span>;
  if (status === 'delivered') return <span className="ticks">✓✓</span>;
  return <span className="ticks">✓</span>;
}

export default function MessageBubble({ message, isOwn }) {
  return (
    <div className={`message-row ${isOwn ? 'own' : 'other'}`}>
      <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
        {!isOwn && <div className="message-sender">{message.username}</div>}
        <div className="message-text">{message.text}</div>
        <div className="message-meta">
          <span className="message-time">{formatTime(message.timestamp)}</span>
          {isOwn && <StatusTicks status={message.status} />}
        </div>
      </div>
    </div>
  );
}
