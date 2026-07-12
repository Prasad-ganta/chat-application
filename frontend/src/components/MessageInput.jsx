import { useState } from 'react';

export default function MessageInput({ onSend, onTyping, disabled }) {
  const [text, setText] = useState('');

  function handleChange(e) {
    setText(e.target.value);
    onTyping();
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
  }

  return (
    <form className="message-input-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder={disabled ? 'Connecting...' : 'Type a message'}
        value={text}
        onChange={handleChange}
        disabled={disabled}
        maxLength={2000}
      />
      <button type="submit" disabled={disabled || !text.trim()}>
        Send
      </button>
    </form>
  );
}
