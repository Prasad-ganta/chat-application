import { useState } from 'react';
import Login from './components/Login.jsx';
import ChatWindow from './components/ChatWindow.jsx';

export default function App() {
  const [username, setUsername] = useState(null);

  return (
    <div className="app-container">
      {username ? <ChatWindow username={username} /> : <Login onLogin={setUsername} />}
    </div>
  );
}
