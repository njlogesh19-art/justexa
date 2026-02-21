import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdvocateById, sendAdvocateRequest } from '../utils/api';

const CASE_TYPES = [
    'Criminal Law', 'Civil Litigation', 'Family Law', 'Corporate Law',
    'Property Law', 'Cyber Law', 'Labor & Employment Law', 'Constitutional Law',
    'Intellectual Property (IPR)', 'Taxation Law', 'Banking & Finance Law',
    'Environmental Law', 'Arbitration & Mediation', 'Human Rights Law',
    'Motor Accident Claims', 'Consumer Protection', 'Insurance Law', 'Other'
];

const EMPTY_FORM = {
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    caseType: '',
    caseDescription: '',
    preferredDate: ''
};

const AdvocateProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [advocate, setAdvocate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [sending, setSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState('');
    const [sendError, setSendError] = useState('');

    useEffect(() => {
        const fetchAdvocate = async () => {
            try {
                const res = await getAdvocateById(id);
                setAdvocate(res.data.advocate);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load advocate profile.');
            } finally {
                setLoading(false);
            }
        };
        fetchAdvocate();
    }, [id]);

    // Pre-fill logged-in user's name and email
    useEffect(() => {
        if (user) {
            setForm(f => ({
                ...f,
                clientName: user.name || '',
                clientEmail: user.email || ''
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSendRequest = async (e) => {
        e.preventDefault();
        if (!form.clientName || !form.clientEmail || !form.caseType || !form.caseDescription) return;
        setSending(true);
        setSendError('');
        try {
            const res = await sendAdvocateRequest({
                advocateId: id,
                clientName: form.clientName,
                clientEmail: form.clientEmail,
                clientPhone: form.clientPhone,
                caseType: form.caseType,
                caseDescription: form.caseDescription,
                preferredDate: form.preferredDate,
                userName: user?.name || '',
                userEmail: user?.email || ''
            });
            setSendSuccess(res.data.message);
            setForm(EMPTY_FORM);
            setTimeout(() => { setShowModal(false); setSendSuccess(''); }, 3000);
        } catch (err) {
            setSendError(err.response?.data?.message || 'Failed to send request. Please try again.');
        } finally {
            setSending(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="spinner spinner-lg"></div>
        </div>
    );

    if (error) return (
        <div className="animate-fade-in">
            <div className="alert alert-error">{error}</div>
            <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => navigate('/marketplace')}>
                ← Back to Marketplace
            </button>
        </div>
    );

    const details = [
        { label: 'Full Name', value: advocate.name, icon: '👤' },
        { label: 'Specialization', value: advocate.specialization, icon: '⚖️' },
        { label: 'Experience', value: advocate.experience || advocate.experience_years ? `${advocate.experience || advocate.experience_years} years` : '—', icon: '📅' },
        { label: 'Bar Council ID', value: advocate.bar_council_id, icon: '🪪' },
        { label: 'City', value: advocate.city, icon: '📍' },
        { label: 'Mobile', value: advocate.mobile_no, icon: '📞' },
        { label: 'Email', value: advocate.email, icon: '📧' },
    ];

    return (
        <div className="animate-fade-in">
            <button
                className="btn btn-ghost btn-sm"
                style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={() => navigate('/marketplace')}
            >
                ← Back to Marketplace
            </button>

            <div style={{ maxWidth: '640px' }}>
                {/* Avatar + Name card */}
                <div className="card card-elevated" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'var(--black)', color: 'var(--white)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', fontWeight: '700', flexShrink: 0
                        }}>
                            {advocate.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.4rem' }}>{advocate.name}</h2>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                                <span className="badge badge-dark">⚖️ Advocate</span>
                                <span className="badge badge-light">{advocate.specialization}</span>
                                {advocate.city && <span className="badge badge-light">📍 {advocate.city}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details card */}
                <div className="card card-elevated" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--gray-200)' }}>
                        Advocate Details
                    </h3>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {details.map(item => (
                            <div key={item.label} style={{ display: 'flex', gap: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--gray-100)' }}>
                                <span style={{ fontSize: '1.1rem', minWidth: '24px' }}>{item.icon}</span>
                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: '500', marginTop: '0.15rem' }}>{item.value || '—'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Send Request button */}
                <button
                    id="send-request-btn"
                    className="btn btn-primary w-full"
                    style={{ fontSize: '1rem', padding: '0.85rem' }}
                    onClick={() => { setShowModal(true); setSendSuccess(''); setSendError(''); }}
                >
                    📨 Send Case Request to {advocate.name}
                </button>
            </div>

            {/* Automated Case Request Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '1rem'
                }}>
                    <div className="card card-elevated" style={{ width: '100%', maxWidth: '520px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button
                            onClick={() => setShowModal(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--gray-500)' }}
                            aria-label="Close"
                        >✕</button>

                        <div style={{ marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.3rem' }}>📨 Send Case Request</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                                Fill in your details — a professional email will be sent automatically to <strong>{advocate.name}</strong> at <em>{advocate.email}</em>
                            </p>
                        </div>

                        {sendSuccess ? (
                            <div style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', padding: '1rem', textAlign: 'center' }}>
                                ✅ {sendSuccess}
                            </div>
                        ) : (
                            <form onSubmit={handleSendRequest}>
                                <div style={{ display: 'grid', gap: '0.9rem' }}>
                                    {/* Client Name */}
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Your Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                                        <input
                                            id="req-client-name"
                                            name="clientName"
                                            type="text"
                                            className="form-input"
                                            placeholder="Enter your full name"
                                            value={form.clientName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    {/* Client Email */}
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Your Email <span style={{ color: '#ef4444' }}>*</span></label>
                                        <input
                                            id="req-client-email"
                                            name="clientEmail"
                                            type="email"
                                            className="form-input"
                                            placeholder="The advocate will reply to this email"
                                            value={form.clientEmail}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    {/* Client Phone */}
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Your Phone Number</label>
                                        <input
                                            id="req-client-phone"
                                            name="clientPhone"
                                            type="tel"
                                            className="form-input"
                                            placeholder="+91-XXXXX-XXXXX"
                                            value={form.clientPhone}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    {/* Case Type */}
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Type of Case <span style={{ color: '#ef4444' }}>*</span></label>
                                        <select
                                            id="req-case-type"
                                            name="caseType"
                                            className="form-input"
                                            value={form.caseType}
                                            onChange={handleChange}
                                            required
                                            style={{ background: 'var(--white)' }}
                                        >
                                            <option value="">Select case type...</option>
                                            {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>

                                    {/* Case Description */}
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Case Description <span style={{ color: '#ef4444' }}>*</span></label>
                                        <textarea
                                            id="req-case-description"
                                            name="caseDescription"
                                            className="form-input"
                                            rows={4}
                                            placeholder="Briefly describe your legal issue, what happened, and what help you need..."
                                            value={form.caseDescription}
                                            onChange={handleChange}
                                            required
                                            style={{ resize: 'vertical', minHeight: '100px' }}
                                        />
                                    </div>

                                    {/* Preferred Date */}
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Preferred Consultation Date</label>
                                        <input
                                            id="req-preferred-date"
                                            name="preferredDate"
                                            type="date"
                                            className="form-input"
                                            value={form.preferredDate}
                                            onChange={handleChange}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                </div>

                                {sendError && <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>{sendError}</div>}

                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button
                                        id="send-request-submit"
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ flex: 1 }}
                                        disabled={sending || !form.clientName || !form.clientEmail || !form.caseType || !form.caseDescription}
                                    >
                                        {sending ? <><span className="spinner"></span> Sending...</> : '📨 Send Request Automatically'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvocateProfile;
