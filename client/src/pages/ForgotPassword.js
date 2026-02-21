import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../utils/api';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: email, 2: otp, 3: reset
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [mockOtp, setMockOtp] = useState('');
    const [role, setRole] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await forgotPassword(email);
            setMockOtp(res.data.otp);
            setRole(res.data.role);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpVerify = (e) => {
        e.preventDefault();
        if (otp === mockOtp) {
            setStep(3);
            setError('');
        } else {
            setError('Invalid OTP. Please try again.');
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await resetPassword({ email, role, newPassword });
            setSuccess('Password reset successfully! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Reset failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const stepTitles = ['Find Your Account', 'Verify OTP', 'Reset Password'];
    const stepIcons = ['🔍', '🔐', '🔑'];

    return (
        <div style={{ minHeight: 'calc(100vh - var(--navbar-height))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--gray-100)' }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{stepIcons[step - 1]}</div>
                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: '700' }}>{stepTitles[step - 1]}</h1>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Step {step} of 3</p>
                </div>

                <div className="card card-elevated animate-slide-up">
                    {/* Step progress */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        {[1, 2, 3].map(s => (
                            <div key={s} style={{ flex: 1, height: '3px', borderRadius: '2px', background: s <= step ? 'var(--black)' : 'var(--gray-200)', transition: 'background 0.3s ease' }} />
                        ))}
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    {step === 1 && (
                        <form onSubmit={handleEmailSubmit}>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input id="forgot-email" type="email" className="form-input" placeholder="Enter your registered email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required />
                                <span className="form-hint">We'll search both User and Advocate accounts.</span>
                            </div>
                            <button id="forgot-submit" type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                                {loading ? <><span className="spinner"></span> Searching...</> : 'Find Account'}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleOtpVerify}>
                            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                                <div>
                                    <strong>Mock OTP (Demo):</strong> Your OTP is <strong style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{mockOtp}</strong>
                                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--gray-500)' }}>In production, this would be sent to your email.</div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Enter OTP</label>
                                <input id="forgot-otp" type="text" className="form-input" placeholder="6-digit OTP" maxLength={6} value={otp} onChange={e => { setOtp(e.target.value); setError(''); }} required style={{ letterSpacing: '0.3em', fontSize: '1.2rem', textAlign: 'center' }} />
                            </div>
                            <button id="otp-verify" type="submit" className="btn btn-primary w-full btn-lg">Verify OTP</button>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleReset}>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input id="new-password" type="password" className="form-input" placeholder="Create new password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setError(''); }} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm New Password</label>
                                <input id="confirm-new-password" type="password" className="form-input" placeholder="Repeat new password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError(''); }} required />
                            </div>
                            <button id="reset-submit" type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                                {loading ? <><span className="spinner"></span> Resetting...</> : 'Reset Password'}
                            </button>
                        </form>
                    )}

                    <div className="divider-text">remembered it?</div>
                    <Link to="/login"><button className="btn btn-ghost w-full">Back to Login</button></Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
