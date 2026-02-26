import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SPECIALIZATIONS = [
    'Criminal Law', 'Civil Litigation', 'Family Law', 'Corporate Law',
    'Constitutional Law', 'Property Law', 'Labor & Employment Law',
    'Intellectual Property (IPR)', 'Cyber Law', 'Taxation Law',
    'Banking & Finance Law', 'Environmental Law', 'Arbitration & Mediation',
    'Human Rights Law', 'Motor Accident Claims', 'Consumer Protection', 'Other',
];

const validatePassword = (pw) => {
    const errors = [];
    if (pw.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(pw)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(pw)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(pw)) errors.push('One number');
    if (!/[^A-Za-z0-9]/.test(pw)) errors.push('One special character');
    return errors;
};

const AdvocateSignup = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '', email: '', mobile_no: '', city: '',
        bar_council_id: '', specialization: '', experience: '', consultation_fee: '', bio: '',
        password: '', confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handle = (e) => {
        setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
        setErrors(p => ({ ...p, [e.target.name]: '' }));
        setApiError('');
    };

    const validateStep = (s) => {
        const errs = {};
        if (s === 1) {
            if (!formData.name.trim()) errs.name = 'Required';
            if (!formData.email.trim()) errs.email = 'Required';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Invalid email';
            if (!formData.mobile_no.trim()) errs.mobile_no = 'Required';
            if (!formData.city.trim()) errs.city = 'Required';
        }
        if (s === 2) {
            if (!formData.bar_council_id.trim()) errs.bar_council_id = 'Required';
            if (!formData.specialization) errs.specialization = 'Required';
            if (!formData.experience) errs.experience = 'Required';
        }
        if (s === 3) {
            const pwErrs = validatePassword(formData.password);
            if (pwErrs.length > 0) errs.password = `Password needs: ${pwErrs.join(', ')}`;
            if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = () => { if (validateStep(step)) setStep(s => s + 1); };
    const handleBack = () => setStep(s => s - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(3)) return;
        setLoading(true); setApiError('');
        try {
            await axios.post(`${API_URL}/api/auth/register/advocate`, {
                name: formData.name,
                email: formData.email,
                mobile_no: formData.mobile_no,
                city: formData.city,
                bar_council_id: formData.bar_council_id,
                specialization: formData.specialization,
                experience: Number(formData.experience),
                consultation_fee: Number(formData.consultation_fee) || 0,
                bio: formData.bio,
                password: formData.password,
            });
            setSubmitted(true);
        } catch (err) {
            setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const checks = [
        formData.password.length >= 8, /[A-Z]/.test(formData.password),
        /[a-z]/.test(formData.password), /[0-9]/.test(formData.password),
        /[^A-Za-z0-9]/.test(formData.password)
    ];

    if (submitted) {
        return (
            <div style={{ minHeight: 'calc(100vh - var(--navbar-height))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--gray-100)' }}>
                <div style={{ textAlign: 'center', maxWidth: '480px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>Application Submitted!</h1>
                    <div className="card card-elevated">
                        <p style={{ color: 'var(--gray-600)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                            Your advocate registration has been submitted and is <strong>pending admin approval</strong>.
                            You will be able to log in once an administrator reviews and approves your application.
                        </p>
                        <div className="alert" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                            ℹ️ Approval typically takes 1–2 business days. Keep an eye on your email.
                        </div>
                        <Link to="/advocate/login"><button className="btn btn-primary w-full">Go to Advocate Login</button></Link>
                    </div>
                </div>
            </div>
        );
    }

    const stepLabels = ['Personal Info', 'Professional', 'Password'];

    return (
        <div style={{ minHeight: 'calc(100vh - var(--navbar-height))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--gray-100)' }}>
            <div style={{ width: '100%', maxWidth: '520px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚖️</div>
                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 700 }}>Advocate Registration</h1>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Step {step} of 3 — {stepLabels[step - 1]}</p>
                </div>

                <div className="card card-elevated animate-slide-up">
                    {/* Progress bar */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem' }}>
                        {[1, 2, 3].map(s => (
                            <div key={s} style={{ flex: 1, height: '3px', borderRadius: '2px', background: s <= step ? 'var(--black)' : 'var(--gray-200)', transition: 'background 0.3s ease' }} />
                        ))}
                    </div>

                    {apiError && <div className="alert alert-error">{apiError}</div>}

                    {/* Step 1: Personal Info */}
                    {step === 1 && (
                        <div>
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input id="adv-name" name="name" type="text" className={`form-input ${errors.name ? 'error' : ''}`} placeholder="Your legal full name" value={formData.name} onChange={handle} />
                                {errors.name && <span className="form-error">{errors.name}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Address *</label>
                                <input id="adv-email" name="email" type="email" className={`form-input ${errors.email ? 'error' : ''}`} placeholder="advocate@email.com" value={formData.email} onChange={handle} />
                                {errors.email && <span className="form-error">{errors.email}</span>}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Mobile No *</label>
                                    <input id="adv-mobile" name="mobile_no" type="tel" className={`form-input ${errors.mobile_no ? 'error' : ''}`} placeholder="+91-XXXXX-XXXXX" value={formData.mobile_no} onChange={handle} />
                                    {errors.mobile_no && <span className="form-error">{errors.mobile_no}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">City *</label>
                                    <input id="adv-city" name="city" type="text" className={`form-input ${errors.city ? 'error' : ''}`} placeholder="e.g. Chennai" value={formData.city} onChange={handle} />
                                    {errors.city && <span className="form-error">{errors.city}</span>}
                                </div>
                            </div>
                            <button id="adv-next-1" type="button" className="btn btn-primary w-full btn-lg" onClick={handleNext}>Continue →</button>
                        </div>
                    )}

                    {/* Step 2: Professional Info */}
                    {step === 2 && (
                        <div>
                            <div className="form-group">
                                <label className="form-label">Bar Council ID *</label>
                                <input id="adv-bar" name="bar_council_id" type="text" className={`form-input ${errors.bar_council_id ? 'error' : ''}`} placeholder="e.g. TN/1234/2020" value={formData.bar_council_id} onChange={handle} style={{ fontFamily: 'monospace' }} />
                                {errors.bar_council_id && <span className="form-error">{errors.bar_council_id}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Specialization *</label>
                                <select id="adv-spec" name="specialization" className={`form-input ${errors.specialization ? 'error' : ''}`} value={formData.specialization} onChange={handle} style={{ cursor: 'pointer' }}>
                                    <option value="">Select your specialization</option>
                                    {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                {errors.specialization && <span className="form-error">{errors.specialization}</span>}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Years of Experience *</label>
                                    <input id="adv-exp" name="experience" type="number" min="0" className={`form-input ${errors.experience ? 'error' : ''}`} placeholder="e.g. 5" value={formData.experience} onChange={handle} />
                                    {errors.experience && <span className="form-error">{errors.experience}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Consultation Fee (₹)</label>
                                    <input id="adv-fee" name="consultation_fee" type="number" min="0" className="form-input" placeholder="e.g. 2500" value={formData.consultation_fee} onChange={handle} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Brief Bio / Description</label>
                                <textarea id="adv-bio" name="bio" className="form-input" placeholder="A short description of your expertise, notable cases, etc." value={formData.bio} onChange={handle} rows={3} style={{ resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="button" className="btn btn-outline" onClick={handleBack}>← Back</button>
                                <button id="adv-next-2" type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={handleNext}>Continue →</button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Password */}
                    {step === 3 && (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Create Password *</label>
                                <input id="adv-password" name="password" type="password" className={`form-input ${errors.password ? 'error' : ''}`} placeholder="Create a strong password" value={formData.password} onChange={handle} />
                                {errors.password && <span className="form-error">{errors.password}</span>}
                                {formData.password && (
                                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                        {['8+ chars', 'Uppercase', 'Lowercase', 'Number', 'Special'].map((req, i) => (
                                            <span key={req} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '100px', background: checks[i] ? '#f0fdf4' : 'var(--gray-100)', color: checks[i] ? '#16a34a' : 'var(--gray-500)', border: `1px solid ${checks[i] ? '#bbf7d0' : 'var(--gray-200)'}` }}>{checks[i] ? '✓' : '○'} {req}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm Password *</label>
                                <input id="adv-confirm" name="confirmPassword" type="password" className={`form-input ${errors.confirmPassword ? 'error' : ''}`} placeholder="Repeat your password" value={formData.confirmPassword} onChange={handle} />
                                {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
                            </div>
                            <div className="alert" style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a', fontSize: '0.8rem', marginBottom: '1rem' }}>
                                ⏳ Your registration requires <strong>admin approval</strong> before you can log in.
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="button" className="btn btn-outline" onClick={handleBack}>← Back</button>
                                <button id="adv-submit" type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                    {loading ? <><span className="spinner" /> Submitting...</> : '⚖️ Submit Application'}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="divider-text" style={{ marginTop: '1.5rem' }}>Already registered?</div>
                    <Link to="/advocate/login"><button className="btn btn-ghost w-full">Sign in as Advocate</button></Link>
                    <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                        <Link to="/login" style={{ fontSize: '0.8rem', color: 'var(--gray-500)', textDecoration: 'none' }}>Not an advocate? User Login →</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvocateSignup;
