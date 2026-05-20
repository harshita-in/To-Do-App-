import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'auth' | 'dashboard'
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Check for saved auth state on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setView('dashboard');
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setCheckingAuth(false);
  }, []);

  // Update body class and localStorage when theme changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleAuthSuccess = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({
      user_id: data.user_id,
      user_name: data.user_name,
      user_email: data.user_email
    }));
    
    setToken(data.token);
    setUser({
      user_id: data.user_id,
      user_name: data.user_name,
      user_email: data.user_email
    });
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setView('landing');
  };

  const renderThemeToggle = () => (
    <div className="theme-switch-floating">
      <button className="btn-theme-toggle" onClick={toggleTheme} title="Toggle Light/Dark Mode">
        {theme === 'dark' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        )}
      </button>
    </div>
  );

  if (checkingAuth) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#0a0e17',
        color: '#f3f4f6',
        fontFamily: 'sans-serif'
      }}>
        Initializing Space...
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Floating background blur blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      {view !== 'dashboard' && renderThemeToggle()}

      {view === 'landing' && (
        <LandingPage onGetStarted={() => setView('auth')} />
      )}
      
      {view === 'auth' && (
        <AuthPage onAuthSuccess={handleAuthSuccess} backendUrl={BACKEND_URL} />
      )}
      
      {view === 'dashboard' && user && (
        <Dashboard 
          user={user} 
          token={token} 
          onLogout={handleLogout} 
          backendUrl={BACKEND_URL}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}
    </div>
  );
}

export default App;
