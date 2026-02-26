import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdvocateLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handle = (e) => {
        setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            return setError('Email and password are required.');
        }
        setLoading(true); setError('');
        try {
            const res = await axios.post(`${API_URL}/api/auth/login`, {
                email: formData.email,
                password: formData.password,
                loginType: 'advocate'
            });
            login(res.data.token, res.data.user, res.data.role);
            navigate('/', { replace: true });
        } catch (err) {
            if (!err.response) {
                setError('Cannot reach server. Make sure the backend is running.');
            } else if (err.response.status === 403) {
                setError(err.response.data.message);
            } else {
                setError(err.response?.data?.message || 'Invalid credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: 'calc(100vh - var(--navbar-height))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--gray-100)' }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚖️</div>
                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 700 }}>Advocate Login</h1>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Sign in to the Justexa Advocate Portal</p>
                </div>

                <div className="card card-elevated animate-slide-up">
                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                            {error.includes('pending') ? '⏳' : error.includes('rejected') ? '❌' : '⚠️'} {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Registered Email</label>
                            <input
                                id="adv-login-email"
                                name="email"
                                type="email"
                                className="form-input"
                                placeholder="advocate@email.com"
                                value={formData.email}
                                onChange={handle}
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="adv-login-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handle}
                                    autoComplete="current-password"
                                    required
                                    style={{ paddingRight: '2.75rem' }}
                                />
                                <button type="button" onClick={() => setShowPassword(p => !p)}
                                    style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}>
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                            <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--gray-500)', textDecoration: 'none' }}>Forgot password?</Link>
                        </div>

                        <button id="adv-login-submit" type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                            {loading ? <><span className="spinner" /> Signing in...</> : '⚖️ Sign in as Advocate'}
                        </button>
                    </form>

                    <div className="divider-text" style={{ marginTop: '1.25rem' }}>New advocate?</div>
                    <Link to="/advocate/signup"><button id="goto-adv-signup" className="btn btn-outline w-full">Register as Advocate</button></Link>

                    <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
                        <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--gray-500)', textDecoration: 'none' }}>
                            Regular user? Login here →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvocateLogin;
