import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import T from '../context/translations';
import { registerUser } from '../utils/api';

const validatePassword = (pw) => {
    const errors = [];
    if (pw.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(pw)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(pw)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(pw)) errors.push('One number');
    if (!/[^A-Za-z0-9]/.test(pw)) errors.push('One special character');
    return errors;
};

const Signup = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { lang } = useLanguage();
    const t = T[lang];

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ name: '', location: '', email: '', password: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setErrors(prev => ({ ...prev, [e.target.name]: '' }));
        setApiError('');
    };

    const validateStep1 = () => {
        const errs = {};
        if (!formData.name.trim()) errs.name = 'Name is required';
        if (!formData.location.trim()) errs.location = 'Location is required';
        if (!formData.email.trim()) errs.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Invalid email format';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep2 = () => {
        const errs = {};
        const pwErrors = validatePassword(formData.password);
        if (pwErrors.length > 0) errs.password = `Password needs: ${pwErrors.join(', ')}`;
        if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = () => { if (validateStep1()) setStep(2); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep2()) return;
        setLoading(true); setApiError('');
        try {
            const res = await registerUser({ name: formData.name, location: formData.location, email: formData.email, password: formData.password });
            login(res.data.token, res.data.user, res.data.role);
            navigate('/', { replace: true });
        } catch (err) {
            setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally { setLoading(false); }
    };

    const pwErrors = formData.password ? validatePassword(formData.password) : [];

    return (
        <div style={{ minHeight: 'calc(100vh - var(--navbar-height))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--gray-100)' }}>
            <div style={{ width: '100%', maxWidth: '480px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📋</div>
                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: '700' }}>{t.signup_title}</h1>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{t.signup_step.replace('{step}', step)}</p>
                </div>

                <div className="card card-elevated animate-slide-up">
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        {[1, 2].map(s => (
                            <div key={s} style={{ flex: 1, height: '3px', borderRadius: '2px', background: s <= step ? 'var(--black)' : 'var(--gray-200)', transition: 'background 0.3s ease' }} />
                        ))}
                    </div>

                    {apiError && <div className="alert alert-error">{apiError}</div>}

                    {step === 1 ? (
                        <div>
                            <div className="form-group">
                                <label className="form-label">{t.signup_name}</label>
                                <input id="signup-name" type="text" name="name" className={`form-input ${errors.name ? 'error' : ''}`} placeholder="John Doe" value={formData.name} onChange={handleChange} />
                                {errors.name && <span className="form-error">{errors.name}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t.signup_location}</label>
                                <input id="signup-location" type="text" name="location" className={`form-input ${errors.location ? 'error' : ''}`} placeholder="Mumbai, Maharashtra" value={formData.location} onChange={handleChange} />
                                {errors.location && <span className="form-error">{errors.location}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t.signup_email}</label>
                                <input id="signup-email" type="email" name="email" className={`form-input ${errors.email ? 'error' : ''}`} placeholder="you@example.com" value={formData.email} onChange={handleChange} />
                                {errors.email && <span className="form-error">{errors.email}</span>}
                            </div>
                            <button id="signup-next" type="button" className="btn btn-primary w-full btn-lg" onClick={handleNext}>{t.signup_continue}</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">{t.signup_password}</label>
                                <input id="signup-password" type="password" name="password" className={`form-input ${errors.password ? 'error' : ''}`} placeholder="Create a strong password" value={formData.password} onChange={handleChange} />
                                {errors.password && <span className="form-error">{errors.password}</span>}
                                {formData.password && pwErrors.length > 0 && (
                                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                        {['8+ chars', 'Uppercase', 'Lowercase', 'Number', 'Special'].map((req, i) => {
                                            const checks = [formData.password.length >= 8, /[A-Z]/.test(formData.password), /[a-z]/.test(formData.password), /[0-9]/.test(formData.password), /[^A-Za-z0-9]/.test(formData.password)];
                                            return <span key={req} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '100px', background: checks[i] ? '#f0fdf4' : 'var(--gray-100)', color: checks[i] ? '#16a34a' : 'var(--gray-500)', border: `1px solid ${checks[i] ? '#bbf7d0' : 'var(--gray-200)'}` }}>{checks[i] ? '✓' : '○'} {req}</span>;
                                        })}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t.signup_confirm}</label>
                                <input id="signup-confirm-password" type="password" name="confirmPassword" className={`form-input ${errors.confirmPassword ? 'error' : ''}`} placeholder="Repeat your password" value={formData.confirmPassword} onChange={handleChange} />
                                {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>{t.signup_back}</button>
                                <button id="signup-submit" type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                    {loading ? <><span className="spinner"></span> {t.signup_creating}</> : t.signup_create}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="divider-text">{t.signup_have_account}</div>
                    <Link to="/login"><button id="goto-login" className="btn btn-ghost w-full">{t.signup_signin}</button></Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
