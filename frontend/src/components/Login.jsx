import { useState } from 'react';

export default function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);

  const isValid = name.trim().length >= 2;

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onLogin(name.trim());
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Welcome 👋</h1>
        <p className="login-subtitle">Enter a username to join the chat</p>
        <input
          autoFocus
          type="text"
          placeholder="e.g. prasad"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
        />
        {touched && !isValid && (
          <span className="login-error">Username must be at least 2 characters</span>
        )}
        <button type="submit">Join Chat</button>
      </form>
    </div>
  );
}
