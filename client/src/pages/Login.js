import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import T from '../context/translations';
import { loginUser, googleLogin } from '../utils/api';

const Login = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();
    const { lang } = useLanguage();
    const t = T[lang];

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated()) navigate('/', { replace: true });
    }, [isAuthenticated, navigate]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const res = await loginUser({ ...formData, loginType: 'user' });
            login(res.data.token, res.data.user, res.data.role);
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally { setLoading(false); }
    };

    const handleGoogleSuccess = async (tokenResponse) => {
        setGoogleLoading(true); setError('');
        try {
            const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            }).then(r => r.json());
            const res = await googleLogin(userInfo);
            login(res.data.token, res.data.user, res.data.role);
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
        } finally { setGoogleLoading(false); }
    };

    const googleSignIn = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => setError('Google sign-in was cancelled or failed.')
    });

    return (
        <div style={{ minHeight: 'calc(100vh - var(--navbar-height))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--gray-100)' }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚖️</div>
                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: '700' }}>{t.login_welcome}</h1>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{t.login_subtitle}</p>
                </div>

                <div className="card card-elevated animate-slide-up">
                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">{t.login_email}</label>
                            <input id="login-email" type="email" name="email" className="form-input"
                                placeholder="you@example.com" value={formData.email} onChange={handleChange} required autoComplete="email" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t.login_password}</label>
                            <input id="login-password" type="password" name="password" className="form-input"
                                placeholder="Enter your password" value={formData.password} onChange={handleChange} required autoComplete="current-password" />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
                            <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--gray-500)', textDecoration: 'underline' }}>
                                {t.login_forgot}
                            </Link>
                        </div>
                        <button id="login-submit" type="submit" className="btn btn-primary w-full btn-lg" disabled={loading || googleLoading}>
                            {loading ? <><span className="spinner"></span> {t.login_signing}</> : t.login_btn}
                        </button>
                    </form>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--gray-200)' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 500 }}>OR</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--gray-200)' }} />
                    </div>

                    <button id="google-login-btn" type="button" onClick={() => googleSignIn()} disabled={loading || googleLoading}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', padding: '0.7rem 1rem', background: 'var(--white)', border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius)', cursor: loading || googleLoading ? 'not-allowed' : 'pointer', fontSize: '0.95rem', fontWeight: '600', color: 'var(--gray-700)', transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#4285f4'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(66,133,244,0.18)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; }}>
                        {googleLoading ? <span className="spinner"></span> : (
                            <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                            </svg>
                        )}
                        {t.login_google}
                    </button>

                    <div className="divider-text">{t.login_no_account}</div>
                    <Link to="/signup"><button id="goto-signup" className="btn btn-outline w-full">{t.login_create}</button></Link>

                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)', textAlign: 'center' }}>
                        <Link to="/admin/login" style={{ textDecoration: 'none' }}>
                            <button id="admin-panel-btn" type="button"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--gray-100)', border: '1px solid var(--gray-200)', color: 'var(--gray-600)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--black)'; e.currentTarget.style.color = 'var(--white)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--gray-100)'; e.currentTarget.style.color = 'var(--gray-600)'; }}>
                                {t.login_admin}
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
