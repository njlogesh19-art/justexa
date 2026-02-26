import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminLogin } from '../utils/api';

const ADMIN_TOKEN_KEY = 'justexa_admin_token';

export const isAdminLoggedIn = () => !!localStorage.getItem(ADMIN_TOKEN_KEY);
export const logoutAdmin = () => localStorage.removeItem(ADMIN_TOKEN_KEY);
export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);

const AdminLogin = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await adminLogin(formData);
            localStorage.setItem(ADMIN_TOKEN_KEY, res.data.token);
            // Use full page redirect (same as logout) so isAdminLoggedIn() guard re-evaluates cleanly
            window.location.href = '/admin';
        } catch (err) {
            if (!err.response) {
                setError('Cannot reach server. Make sure the backend is running on port 5000.');
            } else {
                setError(err.response?.data?.message || 'Invalid admin credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: 'calc(100vh - var(--navbar-height))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'var(--gray-100)'
        }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🛡️</div>
                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: '700' }}>Admin Portal</h1>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Sign in to the Justexa Admin Panel
                    </p>
                </div>

                <div className="card card-elevated animate-slide-up">
                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label">Admin Email</label>
                            <input
                                id="admin-email"
                                type="email"
                                name="email"
                                className="form-input"
                                placeholder="admin@justexa.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoComplete="email"
                            />
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label className="form-label">Admin Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="admin-password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    className="form-input"
                                    placeholder="Enter admin password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    autoComplete="current-password"
                                    style={{ paddingRight: '2.75rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    style={{
                                        position: 'absolute', right: '0.85rem', top: '50%',
                                        transform: 'translateY(-50%)', background: 'none',
                                        border: 'none', color: 'var(--gray-400)',
                                        cursor: 'pointer', fontSize: '1rem', lineHeight: 1,
                                        padding: 0,
                                    }}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button
                            id="admin-login-submit"
                            type="submit"
                            className="btn btn-primary w-full btn-lg"
                            disabled={loading}
                            style={{ marginTop: '0.5rem' }}
                        >
                            {loading ? <><span className="spinner"></span> Signing in...</> : '🔐 Access Admin Panel'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--gray-200)', textAlign: 'center' }}>
                        <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--gray-500)', textDecoration: 'none' }}>
                            ← Back to User Login
                        </Link>
                    </div>

                    {/* Restricted notice */}
                    <p style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.75rem', marginTop: '1rem' }}>
                        🔒 Restricted access — authorised personnel only
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
