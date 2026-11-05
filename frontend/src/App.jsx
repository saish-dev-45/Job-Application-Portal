import React, { useState, useEffect, useMemo } from 'react';

const GATEWAY_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SESSION_KEY = 'portal_auth_session';

const formatCountdown = (totalSeconds) => {
  const sec = Math.max(0, Number(totalSeconds) || 0);
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  return mins > 0 ? `${mins}:${String(rem).padStart(2, '0')}` : `${rem}s`;
};

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '' };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[score] };
};

/* ---------- Small icon helpers ---------- */
const Icon = ({ children, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const MailIcon = () => (
  <Icon>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </Icon>
);
const LockIcon = () => (
  <Icon>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Icon>
);
const UserIcon = () => (
  <Icon>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
);
const EyeIcon = ({ off }) =>
  off ? (
    <Icon>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <path d="m1 1 22 22" />
    </Icon>
  ) : (
    <Icon>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
const CheckIcon = () => (
  <Icon size={16}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);
const AlertIcon = () => (
  <Icon size={18}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </Icon>
);
const BriefcaseIcon = ({ size = 22 }) => (
  <Icon size={size}>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </Icon>
);
const SearchIcon = () => (
  <Icon size={20}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </Icon>
);
const BuildingIcon = () => (
  <Icon size={20}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
  </Icon>
);

/* ---------- Brand panel (left side) ---------- */
function BrandPanel({ mode }) {
  return (
    <aside className="brand-panel">
      <div className="brand-panel-inner">
        <div className="brand-logo">
          <span className="brand-logo-mark">
            <BriefcaseIcon size={20} />
          </span>
          <span className="brand-logo-text">JobConnect</span>
        </div>

        <div className="brand-hero">
          <h1>
            {mode === 'register'
              ? 'Start your career journey today.'
              : 'Your next opportunity is waiting.'}
          </h1>
          <p>
            Join thousands of professionals and hiring teams on the platform that
            connects great talent with great companies.
          </p>

          <ul className="brand-features">
            <li>
              <span className="feature-icon">
                <SearchIcon />
              </span>
              <div>
                <strong>Discover relevant roles</strong>
                <span>Browse openings matched to your skills and goals.</span>
              </div>
            </li>
            <li>
              <span className="feature-icon">
                <BuildingIcon />
              </span>
              <div>
                <strong>Hire with confidence</strong>
                <span>Reach qualified candidates and manage applications in one place.</span>
              </div>
            </li>
            <li>
              <span className="feature-icon">
                <LockIcon />
              </span>
              <div>
                <strong>Secure by design</strong>
                <span>Encrypted credentials and protected sign-in.</span>
              </div>
            </li>
          </ul>
        </div>

        <div className="brand-stats">
          <div>
            <strong>10K+</strong>
            <span>Active jobs</span>
          </div>
          <div>
            <strong>2K+</strong>
            <span>Companies</span>
          </div>
          <div>
            <strong>50K+</strong>
            <span>Candidates</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CANDIDATE'
  });
  const [remember, setRemember] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [retryAfter, setRetryAfter] = useState(0);
  const [online, setOnline] = useState(true);

  const [session, setSession] = useState(() => {
    try {
      const saved =
        localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const strength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password]
  );

  /* ---- Backend availability (shown only when something is wrong) ---- */
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${GATEWAY_URL}/health`, {
          signal: AbortSignal.timeout(3000)
        });
        const data = await res.json();
        if (!cancelled) setOnline(res.ok && data.status === 'success');
      } catch {
        if (!cancelled) setOnline(false);
      }
    };
    check();
    const id = setInterval(check, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  /* ---- Rate-limit countdown ---- */
  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = setInterval(() => {
      setRetryAfter((prev) => {
        if (prev <= 1) {
          setAlert((curr) => (curr?.isRateLimit ? null : curr));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);

  /* ---- Validate stored session against the server ---- */
  useEffect(() => {
    if (!session?.token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${GATEWAY_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${session.token}` }
        });
        if (cancelled) return;
        if (res.status === 401) {
          clearSession();
        } else if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.user) {
            setSession((prev) => (prev ? { ...prev, user: data.user } : prev));
          }
        }
      } catch {
        /* keep the session if the backend is temporarily unreachable */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  const clearSession = () => {
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const switchMode = (mode) => {
    setAuthMode(mode);
    setFieldErrors({});
    setShowPassword(false);
    if (!alert?.isRateLimit) setAlert(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (authMode === 'register' && !formData.name.trim()) {
      errors.name = 'Enter your full name';
    }
    if (!formData.email.trim()) {
      errors.email = 'Enter your email address';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    if (!formData.password) {
      errors.password = 'Enter your password';
    } else if (authMode === 'register' && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (authMode === 'login' && retryAfter > 0) return;

    setAlert(null);
    if (!validate()) return;
    setLoading(true);

    try {
      const isLogin = authMode === 'login';
      const payload = isLogin
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

      const response = await fetch(
        `${GATEWAY_URL}/api/auth/${isLogin ? 'login' : 'register'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );
      const data = await response.json().catch(() => ({}));

      if (response.status === 200 && isLogin) {
        setRetryAfter(0);
        const newSession = { token: data.token, user: data.user };
        const store = remember ? localStorage : sessionStorage;
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        store.setItem(SESSION_KEY, JSON.stringify(newSession));
        setSession(newSession);
        setFormData((p) => ({ ...p, password: '' }));
      } else if (response.status === 201 && !isLogin) {
        setAuthMode('login');
        setFormData((p) => ({ ...p, password: '', name: '' }));
        setAlert({
          type: 'success',
          title: 'Account created',
          message: 'Your account is ready. Sign in to continue.'
        });
      } else if (response.status === 429) {
        const headerRetry = response.headers.get('Retry-After');
        setRetryAfter(Number(data.retryAfter || headerRetry) || 900);
        setAlert({
          type: 'warning',
          isRateLimit: true,
          title: 'Too many sign-in attempts',
          message: 'For your security, sign-in is temporarily locked. Please try again shortly.'
        });
      } else if (response.status === 502 || response.status === 503) {
        setAlert({
          type: 'error',
          title: 'Service temporarily unavailable',
          message: 'We are having trouble reaching our servers. Please try again in a moment.'
        });
      } else {
        setAlert({
          type: 'error',
          title: isLogin ? "We couldn't sign you in" : "We couldn't create your account",
          message:
            data.message ||
            'Something went wrong. Please check your details and try again.'
        });
      }
    } catch {
      setAlert({
        type: 'error',
        title: 'Connection problem',
        message: 'Unable to connect to the server. Check your connection and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  /* =====================  SIGNED-IN VIEW  ===================== */
  if (session) {
    const user = session.user || {};
    const isRecruiter = user.role === 'RECRUITER';
    const firstName = (user.name || 'there').split(' ')[0];

    return (
      <div className="app-shell">
        <header className="topbar">
          <div className="topbar-inner">
            <div className="brand-logo dark">
              <span className="brand-logo-mark">
                <BriefcaseIcon size={18} />
              </span>
              <span className="brand-logo-text">JobConnect</span>
            </div>
            <div className="topbar-user">
              <div className="avatar">{(user.name || 'U').charAt(0).toUpperCase()}</div>
              <div className="topbar-user-meta">
                <strong>{user.name}</strong>
                <span>{isRecruiter ? 'Recruiter' : 'Job Seeker'}</span>
              </div>
              <button type="button" className="btn-outline" onClick={clearSession}>
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="dashboard">
          <section className="welcome-card">
            <div>
              <h2>Welcome back, {firstName} 👋</h2>
              <p>
                {isRecruiter
                  ? 'Post openings and find the right people for your team.'
                  : 'Discover roles that match your skills and track your applications.'}
              </p>
            </div>
            <span className={`role-chip ${isRecruiter ? 'recruiter' : 'candidate'}`}>
              {isRecruiter ? 'Recruiter account' : 'Candidate account'}
            </span>
          </section>

          <section className="dash-grid">
            <article className="dash-card">
              <span className="feature-icon">{isRecruiter ? <BuildingIcon /> : <SearchIcon />}</span>
              <h3>{isRecruiter ? 'Post a job' : 'Find jobs'}</h3>
              <p>{isRecruiter ? 'Create your first job listing.' : 'Search and apply to open positions.'}</p>
              <span className="badge-soon">Coming soon</span>
            </article>
            <article className="dash-card">
              <span className="feature-icon">
                <UserIcon />
              </span>
              <h3>{isRecruiter ? 'Company profile' : 'Your profile'}</h3>
              <p>{user.email}</p>
              <span className="badge-soon">Coming soon</span>
            </article>
            <article className="dash-card">
              <span className="feature-icon">
                <BriefcaseIcon size={20} />
              </span>
              <h3>{isRecruiter ? 'Applications' : 'My applications'}</h3>
              <p>{isRecruiter ? 'Review candidates who applied.' : 'Track the status of your applications.'}</p>
              <span className="badge-soon">Coming soon</span>
            </article>
          </section>
        </main>
      </div>
    );
  }

  /* =====================  AUTH VIEW  ===================== */
  const isLogin = authMode === 'login';
  const locked = isLogin && retryAfter > 0;

  return (
    <div className="auth-layout">
      <BrandPanel mode={authMode} />

      <main className="auth-panel">
        <div className="auth-mobile-logo">
          <span className="brand-logo-mark">
            <BriefcaseIcon size={18} />
          </span>
          <span className="brand-logo-text">JobConnect</span>
        </div>

        <div className="auth-card">
          <div className="auth-heading">
            <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
            <p>
              {isLogin
                ? 'Sign in to continue to JobConnect.'
                : 'Join JobConnect to find work or hire talent.'}
            </p>
          </div>

          {!online && (
            <div className="banner banner-error" role="alert">
              <AlertIcon />
              <span>We can't reach the server right now. Please try again shortly.</span>
            </div>
          )}

          {alert && (
            <div className={`banner banner-${alert.type}`} role="alert">
              {alert.type === 'success' ? <CheckIcon /> : <AlertIcon />}
              <div className="banner-body">
                <strong>{alert.title}</strong>
                <span>{alert.message}</span>
                {alert.isRateLimit && retryAfter > 0 && (
                  <span className="banner-timer">Try again in {formatCountdown(retryAfter)}</span>
                )}
              </div>
              <button
                type="button"
                className="banner-close"
                onClick={() => setAlert(null)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {!isLogin && (
              <fieldset className="role-toggle">
                <legend>I want to</legend>
                <label className={formData.role === 'CANDIDATE' ? 'active' : ''}>
                  <input
                    type="radio"
                    name="role"
                    value="CANDIDATE"
                    checked={formData.role === 'CANDIDATE'}
                    onChange={handleInputChange}
                  />
                  <SearchIcon />
                  <span>
                    <strong>Find a job</strong>
                    <small>I'm a job seeker</small>
                  </span>
                </label>
                <label className={formData.role === 'RECRUITER' ? 'active' : ''}>
                  <input
                    type="radio"
                    name="role"
                    value="RECRUITER"
                    checked={formData.role === 'RECRUITER'}
                    onChange={handleInputChange}
                  />
                  <BuildingIcon />
                  <span>
                    <strong>Hire talent</strong>
                    <small>I'm a recruiter</small>
                  </span>
                </label>
              </fieldset>
            )}

            {!isLogin && (
              <div className="field">
                <label htmlFor="name">Full name</label>
                <div className={`input ${fieldErrors.name ? 'has-error' : ''}`}>
                  <UserIcon />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Jane Smith"
                    value={formData.name}
                    onChange={handleInputChange}
                    autoComplete="name"
                  />
                </div>
                {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
              </div>
            )}

            <div className="field">
              <label htmlFor="email">Email address</label>
              <div className={`input ${fieldErrors.email ? 'has-error' : ''}`}>
                <MailIcon />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className={`input ${fieldErrors.password ? 'has-error' : ''}`}>
                <LockIcon />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isLogin ? 'Enter your password' : 'At least 6 characters'}
                  value={formData.password}
                  onChange={handleInputChange}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
              {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}

              {!isLogin && formData.password && (
                <div className="strength" aria-live="polite">
                  <div className="strength-bars">
                    {[1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className={i <= strength.score ? `on s${strength.score}` : ''}
                      />
                    ))}
                  </div>
                  <span className={`strength-label s${strength.score}`}>{strength.label}</span>
                </div>
              )}
            </div>

            {isLogin && (
              <div className="form-row">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span>Keep me signed in</span>
                </label>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading || locked}>
              {loading && <span className="spinner" />}
              {loading
                ? isLogin
                  ? 'Signing in…'
                  : 'Creating account…'
                : locked
                  ? `Try again in ${formatCountdown(retryAfter)}`
                  : isLogin
                    ? 'Sign in'
                    : 'Create account'}
            </button>

            {!isLogin && (
              <p className="legal">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>
            )}
          </form>

          <p className="switch">
            {isLogin ? 'New to JobConnect?' : 'Already have an account?'}
            <button type="button" onClick={() => switchMode(isLogin ? 'register' : 'login')}>
              {isLogin ? 'Join now' : 'Sign in'}
            </button>
          </p>
        </div>

        <footer className="auth-footer">© {new Date().getFullYear()} JobConnect</footer>
      </main>
    </div>
  );
}
