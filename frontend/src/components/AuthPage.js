import React, { useState } from 'react';

function AuthPage({ onAuthSuccess, backendUrl }) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState(''); // email or username

  const validateEmail = (emailStr) => {
    // Check if email has '@' and a domain containing a dot
    const parts = emailStr.split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1];
    return domain.includes('.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login Flow
        if (!loginIdentifier || !password) {
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }

        const res = await fetch(`${backendUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: loginIdentifier,
            user_password: password
          })
        });
        
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Login failed');
        }

        onAuthSuccess(data);
      } else {
        // Signup Flow
        if (!name || !username || !email || !password) {
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }

        if (!validateEmail(email)) {
          setError('Email must contain "@" and a domain suffix (e.g. .com)');
          setLoading(false);
          return;
        }

        const res = await fetch(`${backendUrl}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_name: username,
            user_email: email,
            user_password: password
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Signup failed');
        }

        onAuthSuccess(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="gradient-bg"></div>
      
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Enter your credentials to access your dashboard' 
              : 'Sign up to start organizing your tasks'
            }
          </p>
        </div>

        {error && (
          <div className="alert-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unique Username</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="johndoe123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {isLogin && (
            <div className="form-group">
              <label className="form-label">Email or Username</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="john@example.com or johndoe123"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <button className="auth-toggle-btn" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
