import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCaseByCNR } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const CaseDetail = () => {
    const { cnr } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [notifyEmail, setNotifyEmail] = useState('');
    const [notifyPhone, setNotifyPhone] = useState('');
    const [notifyLoading, setNotifyLoading] = useState(false);
    const [notifyMsg, setNotifyMsg] = useState('');
    const [notifyError, setNotifyError] = useState('');

    useEffect(() => {
        if (!cnr) return;
        setLoading(true);
        getCaseByCNR(cnr)
            .then(res => {
                setCaseData(res.data.case);
                setNotifyEmail(user?.email || '');
            })
            .catch(err => setError(err.response?.data?.message || 'Case not found.'))
            .finally(() => setLoading(false));
    }, [cnr, user]);

    const openModal = () => { setShowModal(true); setNotifyMsg(''); setNotifyError(''); };
    const closeModal = () => setShowModal(false);

    const handleNotify = async (e) => {
        e.preventDefault();
        setNotifyLoading(true); setNotifyMsg(''); setNotifyError('');
        try {
            const res = await api.post(`/api/cases/${caseData.cnr_no}/notify`, {
                notify_email: notifyEmail,
                notify_phone: notifyPhone,
            });
            setNotifyMsg(res.data.message);
        } catch (err) {
            setNotifyError(err.response?.data?.message || 'Failed to save notification.');
        } finally { setNotifyLoading(false); }
    };

    const fmtDate = (d) => d
        ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
        : '—';

    const statusColor = (status) => {
        const s = status?.toLowerCase();
        if (s === 'active') return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
        if (s === 'disposed') return { bg: '#f5f5f5', color: '#525252', border: '#d4d4d4' };
        return { bg: '#fefce8', color: '#ca8a04', border: '#fde68a' };
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
            <div className="spinner spinner-lg" />
        </div>
    );

    if (error) return (
        <div className="animate-fade-in">
            <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>← Back</button>
            <div className="alert alert-error">{error}</div>
        </div>
    );

    if (!caseData) return null;

    const sc = statusColor(caseData.status);
    const hasHearing = !!caseData.next_hearing;

    return (
        <div className="animate-fade-in" style={{ maxWidth: '820px' }}>

            {/* Back button */}
            <button className="btn btn-ghost" onClick={() => navigate(-1)}
                style={{ marginBottom: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                ← Back to Cases
            </button>

            {/* Header */}
            <div style={{
                background: 'var(--black)', color: 'var(--white)',
                borderRadius: 'var(--radius)', padding: '1.75rem 2rem',
                marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
            }}>
                <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, marginBottom: '0.4rem' }}>
                        Case Number
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                        {caseData.cnr_no}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', opacity: 0.9 }}>
                        {caseData.petitioner} <span style={{ opacity: 0.5, fontWeight: 400 }}>vs</span> {caseData.respondent}
                    </div>
                </div>
                <span style={{
                    padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.82rem', fontWeight: '700',
                    background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, flexShrink: 0
                }}>
                    {caseData.status}
                </span>
            </div>

            {/* Info grid */}
            <div className="card card-elevated" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-500)', marginBottom: '1.25rem' }}>
                    Case Details
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {[
                        { label: 'Petitioner', value: caseData.petitioner, icon: '👤' },
                        { label: 'Respondent', value: caseData.respondent, icon: '👥' },
                        { label: 'Court', value: caseData.court_name, icon: '🏛️' },
                        { label: 'Case Type', value: caseData.case_type || '—', icon: '📁' },
                        { label: 'Judge', value: caseData.judge_name || '—', icon: '⚖️' },
                        { label: 'Filing Date', value: fmtDate(caseData.filing_date), icon: '📋' },
                        { label: 'Next Hearing', value: fmtDate(caseData.next_hearing), icon: '📅', highlight: true },
                        { label: 'Status', value: caseData.status, icon: '🔔', highlight: true },
                    ].map(item => (
                        <div key={item.label} style={{
                            padding: '0.875rem', borderRadius: 'var(--radius-sm)',
                            background: item.highlight ? 'var(--black)' : 'var(--gray-100)',
                            color: item.highlight ? 'var(--white)' : 'var(--black)',
                        }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.55, marginBottom: '0.3rem' }}>
                                {item.icon} {item.label}
                            </div>
                            <div style={{ fontSize: '0.95rem', fontWeight: '600' }}>{item.value}</div>
                        </div>
                    ))}
                </div>

                {/* Single Notify Me button below the grid */}
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        id="notify-me-btn"
                        className="btn btn-primary"
                        onClick={openModal}
                        disabled={!hasHearing}
                        title={hasHearing ? 'Get notified before your hearing' : 'No next hearing date set'}
                    >
                        🔔 Notify Me
                    </button>
                    {!hasHearing && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>
                            No hearing date set
                        </span>
                    )}
                </div>
            </div>

            {/* ── Notify Me Modal ─────────────────────────────── */}
            {showModal && (
                <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="modal animate-slide-up" style={{ maxWidth: '420px' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🔔</div>
                            <h2 className="modal-title">Hearing Reminder</h2>
                            <p className="modal-subtitle">
                                We'll email you <strong>1 day before</strong> the hearing on{' '}
                                <strong>{fmtDate(caseData.next_hearing)}</strong>.
                            </p>
                            <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--gray-500)', marginTop: '-0.5rem' }}>
                                {caseData.cnr_no}
                            </div>
                        </div>

                        {notifyMsg ? (
                            <>
                                <div className="alert alert-success">{notifyMsg}</div>
                                <button className="btn btn-primary w-full" onClick={closeModal}>Done</button>
                            </>
                        ) : (
                            <form onSubmit={handleNotify}>
                                {notifyError && <div className="alert alert-error">{notifyError}</div>}
                                <div className="form-group">
                                    <label className="form-label">Email Address *</label>
                                    <input
                                        id="notify-email"
                                        type="email"
                                        className="form-input"
                                        placeholder="you@example.com"
                                        value={notifyEmail}
                                        onChange={e => setNotifyEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number (optional)</label>
                                    <input
                                        id="notify-phone"
                                        type="tel"
                                        className="form-input"
                                        placeholder="+91-XXXXX-XXXXX"
                                        value={notifyPhone}
                                        onChange={e => setNotifyPhone(e.target.value)}
                                    />
                                    <div className="form-hint">SMS coming soon — email sends immediately.</div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                                    <button id="notify-submit" type="submit" className="btn btn-primary" disabled={notifyLoading}>
                                        {notifyLoading ? <><span className="spinner" /> Saving...</> : '🔔 Notify Me'}
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

export default CaseDetail;
