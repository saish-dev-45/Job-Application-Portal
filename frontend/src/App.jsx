import React, { useState, useEffect } from 'react';

const DEFAULT_GATEWAY = 'http://localhost:5000';

export default function App() {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  
  // Registration & Login Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CANDIDATE'
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Authenticated User Session
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem('portal_auth_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Protected route verification state
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  // Gateway Connection URL
  const [gatewayUrl, setGatewayUrl] = useState(() => {
    return localStorage.getItem('api_gateway_url') || DEFAULT_GATEWAY;
  });
  const [gatewayInput, setGatewayInput] = useState(gatewayUrl);
  const [showGatewaySettings, setShowGatewaySettings] = useState(false);

  // Gateway Health Status
  const [gatewayHealth, setGatewayHealth] = useState({
    status: 'checking',
    label: 'Checking API Gateway...',
    title: ''
  });

  // Check API Gateway Health
  const checkGatewayHealth = async (targetUrl = gatewayUrl) => {
    try {
      const healthUrl = `${targetUrl}/health`;
      const res = await fetch(healthUrl, { signal: AbortSignal.timeout(3000) });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setGatewayHealth({
          status: 'connected',
          label: 'API Gateway Online (Port 5000)',
          title: `Connected to API Gateway: ${data.message || 'OK'}`
        });
      } else {
        setGatewayHealth({
          status: 'error',
          label: 'Gateway Error',
          title: data.message || 'Health check error'
        });
      }
    } catch {
      setGatewayHealth({
        status: 'error',
        label: 'Gateway Offline (Port 5000)',
        title: `Could not reach ${targetUrl}. Ensure API Gateway is running.`
      });
    }
  };

  useEffect(() => {
    checkGatewayHealth(gatewayUrl);
    const interval = setInterval(() => checkGatewayHealth(gatewayUrl), 15000);
    return () => clearInterval(interval);
  }, [gatewayUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setFormData((prev) => ({ ...prev, role: selectedRole }));
  };

  // Validation
  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (authMode === 'register' && !formData.name.trim()) {
      errors.name = 'Please enter your full name';
    }

    if (!formData.email.trim()) {
      errors.email = 'Please enter your email address';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Please enter your password';
    } else if (authMode === 'register' && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submit (Login or Register via API Gateway)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!validate()) return;

    setLoading(true);

    try {
      const endpoint = authMode === 'login'
        ? `${gatewayUrl}/api/auth/login`
        : `${gatewayUrl}/api/auth/register`;

      const payload = authMode === 'login'
        ? {
            email: formData.email.trim().toLowerCase(),
            password: formData.password
          }
        : {
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            role: formData.role
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 200 && authMode === 'login') {
        // Successful Login
        const newSession = {
          token: data.token,
          user: data.user
        };
        setSession(newSession);
        localStorage.setItem('portal_auth_session', JSON.stringify(newSession));

        setAlert({
          type: 'success',
          title: 'Login Successful!',
          message: `Welcome back, ${data.user?.name || 'User'}! Authenticated via API Gateway.`,
          details: null
        });
      } else if (response.status === 201 && authMode === 'register') {
        // Successful Registration
        setAlert({
          type: 'success',
          title: 'Registration Successful!',
          message: 'Your account has been saved to PostgreSQL. You can now log in.',
          details: data.user || {}
        });

        // Switch to login tab and prefill email
        setAuthMode('login');
        setFormData((prev) => ({
          ...prev,
          password: ''
        }));
      } else {
        // Error from Gateway or Auth Service
        setAlert({
          type: 'error',
          title: authMode === 'login' ? 'Login Failed' : 'Registration Failed',
          message: data.message || 'Operation failed. Please verify your credentials and try again.'
        });
      }
    } catch (err) {
      setAlert({
        type: 'error',
        title: 'Gateway Connection Error',
        message: `Could not connect to API Gateway at ${gatewayUrl}. Ensure the API Gateway (port 5000) and Auth Service (port 5001) are running.`
      });
    } finally {
      setLoading(false);
    }
  };

  // Test Protected /me endpoint with JWT
  const handleVerifyToken = async () => {
    if (!session?.token) return;
    setVerifyLoading(true);
    setVerifyResult(null);

    try {
      const res = await fetch(`${gatewayUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.token}`,
          Accept: 'application/json'
        }
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setVerifyResult({
          status: 'success',
          message: 'Token verified successfully through API Gateway!',
          data
        });
      } else {
        setVerifyResult({
          status: 'error',
          message: data.message || 'Token verification failed',
          data
        });
      }
    } catch (err) {
      setVerifyResult({
        status: 'error',
        message: `Connection error calling ${gatewayUrl}/api/auth/me`
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('portal_auth_session');
    setVerifyResult(null);
    setAlert({
      type: 'success',
      title: 'Logged Out',
      message: 'You have been successfully signed out.'
    });
  };

  const handleSaveGatewayUrl = () => {
    const trimmed = gatewayInput.trim();
    if (trimmed) {
      setGatewayUrl(trimmed);
      localStorage.setItem('api_gateway_url', trimmed);
      setShowGatewaySettings(false);
      checkGatewayHealth(trimmed);
    }
  };

  return (
    <div>
      <div className="background-decorations">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <main className="page-container">
        {/* Header */}
        <header className="portal-header">
          <div className="brand">
            <div className="brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <div className="brand-text">
              <h1>JobConnect</h1>
              <span className="badge">API Gateway Edition</span>
            </div>
          </div>

          <div
            className={`service-status ${gatewayHealth.status}`}
            onClick={() => checkGatewayHealth(gatewayUrl)}
            title={gatewayHealth.title}
          >
            <span className="status-dot"></span>
            <span className="status-label">{gatewayHealth.label}</span>
          </div>
        </header>

        {/* Main Content Card */}
        <div className="card-container">
          <div className="card">
            {/* If user is logged in, show authenticated dashboard */}
            {session ? (
              <div className="user-profile-card">
                <div className="profile-header">
                  <div className="user-identity">
                    <div className="user-avatar">
                      {session.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="user-names">
                      <h3>{session.user?.name || 'Authenticated User'}</h3>
                      <p>{session.user?.email}</p>
                    </div>
                  </div>
                  <span className={`role-badge ${session.user?.role?.toLowerCase()}`}>
                    {session.user?.role || 'CANDIDATE'}
                  </span>
                </div>

                <div className="token-section">
                  <div className="token-header">
                    <span>Active JWT Token (Issuer: job-portal-auth)</span>
                  </div>
                  <div className="token-box">
                    {session.token}
                  </div>
                </div>

                <div className="btn-actions-row">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleVerifyToken}
                    disabled={verifyLoading}
                  >
                    {verifyLoading ? 'Verifying...' : '🔑 Test Protected Route (/api/auth/me)'}
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </button>
                </div>

                {verifyResult && (
                  <div className="verify-result">
                    <strong>{verifyResult.status === 'success' ? '✅ Status 200 OK' : '❌ Error'}:</strong> {verifyResult.message}
                    {verifyResult.data && (
                      <pre>{JSON.stringify(verifyResult.data, null, 2)}</pre>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* If user is NOT logged in, show Auth Tabs (Login / Register) */
              <>
                <div className="auth-tabs">
                  <button
                    type="button"
                    className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                    onClick={() => {
                      setAuthMode('login');
                      setAlert(null);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                      <polyline points="10 17 15 12 10 7"></polyline>
                      <line x1="15" y1="12" x2="3" y2="12"></line>
                    </svg>
                    Sign In
                  </button>
                  <button
                    type="button"
                    className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
                    onClick={() => {
                      setAuthMode('register');
                      setAlert(null);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <line x1="20" y1="8" x2="20" y2="14"></line>
                      <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                    Register
                  </button>
                </div>

                <div className="card-header">
                  <h2>{authMode === 'login' ? 'Welcome Back' : 'Create an Account'}</h2>
                  <p className="subtitle">
                    {authMode === 'login'
                      ? 'Sign in to access your job portal account'
                      : 'Join our talent network to apply or recruit top candidates'}
                  </p>
                </div>

                {/* Alert Banner */}
                {alert && (
                  <div className={`alert-box ${alert.type}`}>
                    <div className="alert-icon">
                      {alert.type === 'success' ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                      )}
                    </div>
                    <div className="alert-content">
                      <h4>{alert.title}</h4>
                      <p>{alert.message}</p>
                      {alert.details && (
                        <div className="alert-details">
                          <table>
                            <tbody>
                              <tr><td>Database ID:</td><td><strong>#{alert.details.id}</strong></td></tr>
                              <tr><td>Name:</td><td>{alert.details.name}</td></tr>
                              <tr><td>Email:</td><td>{alert.details.email}</td></tr>
                              <tr><td>Role:</td><td><span style={{ color: '#4f46e5', fontWeight: 700 }}>{alert.details.role}</span></td></tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="alert-close"
                      onClick={() => setAlert(null)}
                    >
                      &times;
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  {/* Role Selector (Register Only) */}
                  {authMode === 'register' && (
                    <div className="form-group">
                      <label className="group-label">
                        I am joining as <span className="required">*</span>
                      </label>
                      <div className="role-grid">
                        <div
                          className={`role-card ${formData.role === 'CANDIDATE' ? 'selected' : ''}`}
                          onClick={() => handleRoleSelect('CANDIDATE')}
                        >
                          <input
                            type="radio"
                            name="role"
                            value="CANDIDATE"
                            checked={formData.role === 'CANDIDATE'}
                            onChange={() => handleRoleSelect('CANDIDATE')}
                          />
                          <div className="role-content">
                            <div className="role-icon">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                              </svg>
                            </div>
                            <div className="role-info">
                              <div className="role-title">Job Seeker</div>
                              <div className="role-desc">Candidate applying for jobs</div>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`role-card ${formData.role === 'RECRUITER' ? 'selected' : ''}`}
                          onClick={() => handleRoleSelect('RECRUITER')}
                        >
                          <input
                            type="radio"
                            name="role"
                            value="RECRUITER"
                            checked={formData.role === 'RECRUITER'}
                            onChange={() => handleRoleSelect('RECRUITER')}
                          />
                          <div className="role-content">
                            <div className="role-icon">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="8.5" cy="7" r="4"></circle>
                                <line x1="20" y1="8" x2="20" y2="14"></line>
                                <line x1="23" y1="11" x2="17" y2="11"></line>
                              </svg>
                            </div>
                            <div className="role-info">
                              <div className="role-title">Recruiter</div>
                              <div className="role-desc">Hiring & posting jobs</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Name Input (Register Only) */}
                  {authMode === 'register' && (
                    <div className="form-group">
                      <label htmlFor="name">
                        Full Name <span className="required">*</span>
                      </label>
                      <div className="input-wrapper">
                        <div className="input-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={fieldErrors.name ? 'error' : ''}
                          autoComplete="name"
                        />
                      </div>
                      <span className="field-error">{fieldErrors.name}</span>
                    </div>
                  )}

                  {/* Email Input */}
                  <div className="form-group">
                    <label htmlFor="email">
                      Email Address <span className="required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="john.doe@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={fieldErrors.email ? 'error' : ''}
                        autoComplete="email"
                      />
                    </div>
                    <span className="field-error">{fieldErrors.email}</span>
                  </div>

                  {/* Password Input */}
                  <div className="form-group">
                    <label htmlFor="password">
                      Password <span className="required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        placeholder={authMode === 'login' ? 'Enter your password' : 'Create a strong password'}
                        value={formData.password}
                        onChange={handleInputChange}
                        className={fieldErrors.password ? 'error' : ''}
                        autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        )}
                      </button>
                    </div>
                    <span className="field-error">{fieldErrors.password}</span>
                  </div>

                  {/* Submit Button */}
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading && <span className="btn-spinner"></span>}
                    <span>
                      {loading
                        ? (authMode === 'login' ? 'Authenticating...' : 'Saving to Database...')
                        : (authMode === 'login' ? 'Sign In to Portal' : 'Register Account')}
                    </span>
                  </button>

                  <div className="form-switch-prompt">
                    {authMode === 'login' ? (
                      <>
                        Don't have an account yet?
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('register');
                            setAlert(null);
                          }}
                        >
                          Register here
                        </button>
                      </>
                    ) : (
                      <>
                        Already registered?
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('login');
                            setAlert(null);
                          }}
                        >
                          Sign In here
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </>
            )}

            {/* API Gateway Configuration */}
            <div className="card-footer">
              <div className="endpoint-toggle">
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setShowGatewaySettings(!showGatewaySettings)}
                >
                  <span>🌐 Routing Target: <code>{gatewayUrl}</code></span>
                </button>
              </div>

              {showGatewaySettings && (
                <div className="endpoint-panel">
                  <label htmlFor="gatewayUrlInput">API Gateway URL:</label>
                  <div className="endpoint-input-row">
                    <input
                      type="text"
                      id="gatewayUrlInput"
                      value={gatewayInput}
                      onChange={(e) => setGatewayInput(e.target.value)}
                    />
                    <button type="button" className="btn-secondary" onClick={handleSaveGatewayUrl}>
                      Save
                    </button>
                  </div>
                  <small className="helper-text">
                    API Gateway: <code>http://localhost:5000</code> | Direct Auth Service: <code>http://localhost:5001</code>
                  </small>
                </div>
              )}
            </div>
          </div>

          {/* Microservices Routing Flow Card */}
          <div className="db-guide-card">
            <h3>Microservices Communication Architecture</h3>
            <div className="gateway-flow-diagram">
              <div className="flow-step">
                <span className="step-title">React Client</span>
                <span className="step-port">Port 3000</span>
              </div>
              <span className="flow-arrow">➔</span>
              <div className="flow-step">
                <span className="step-title">API Gateway</span>
                <span className="step-port">Port 5000</span>
              </div>
              <span className="flow-arrow">➔</span>
              <div className="flow-step">
                <span className="step-title">Auth Service</span>
                <span className="step-port">Port 5001</span>
              </div>
              <span className="flow-arrow">➔</span>
              <div className="flow-step">
                <span className="step-title">PostgreSQL DB</span>
                <span className="step-port">auth_db:5432</span>
              </div>
            </div>
            <ol>
              <li><strong>Login:</strong> Sends <code>POST /api/auth/login</code> via Gateway ➔ returns JWT signed token & user profile.</li>
              <li><strong>Register:</strong> Sends <code>POST /api/auth/register</code> via Gateway ➔ creates hashed user record in PostgreSQL.</li>
              <li><strong>Protected Route:</strong> Sends <code>GET /api/auth/me</code> with <code>Bearer &lt;token&gt;</code> to verify active session.</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}
