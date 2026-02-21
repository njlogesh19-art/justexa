import React, { useState, useEffect } from 'react';
import { getCaseByCNR, getCases, seedCases } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import T from '../context/translations';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const CaseTracker = () => {
    const { user } = useAuth();
    const { lang } = useLanguage();
    const t = T[lang];
    const navigate = useNavigate();
    const [cnr, setCnr] = useState('');
    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    // Tracked cases list (persisted in localStorage for the session)
    const [trackedCases, setTrackedCases] = useState(() => {
        try { return JSON.parse(localStorage.getItem('justexa_tracked_cases') || '[]'); }
        catch { return []; }
    });

    // All cases from DB — auto-loaded on mount
    const [allCases, setAllCases] = useState([]);
    const [allLoading, setAllLoading] = useState(true);
    const [caseFilter, setCaseFilter] = useState('All');

    useEffect(() => {
        const loadAll = async () => {
            setAllLoading(true);
            try {
                // Seed first (safe upsert — won't duplicate), then fetch
                await seedCases().catch(() => { });
                const res = await getCases();
                setAllCases(res.data.cases || []);
            } catch { /* ignore */ }
            finally { setAllLoading(false); }
        };
        loadAll();
    }, []);


    // Notify Me modal state
    const [notifyModal, setNotifyModal] = useState(null); // { cnr, case_title, next_hearing }
    const [notifyEmail, setNotifyEmail] = useState(user?.email || '');
    const [notifyPhone, setNotifyPhone] = useState('');
    const [notifyLoading, setNotifyLoading] = useState(false);
    const [notifyMsg, setNotifyMsg] = useState('');
    const [notifyError, setNotifyError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!cnr.trim()) return;
        setLoading(true); setError(''); setCaseData(null); setSearched(true);
        try {
            const res = await getCaseByCNR(cnr.trim());
            const found = res.data.case;
            setCaseData(found);

            // Auto-add to tracked list if not already there
            if (!trackedCases.find(c => c.cnr_no === found.cnr_no)) {
                const updated = [found, ...trackedCases].slice(0, 10); // keep last 10
                setTrackedCases(updated);
                localStorage.setItem('justexa_tracked_cases', JSON.stringify(updated));
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch case. Please try again.');
        } finally { setLoading(false); }
    };

    const removeTracked = (cnr_no) => {
        const updated = trackedCases.filter(c => c.cnr_no !== cnr_no);
        setTrackedCases(updated);
        localStorage.setItem('justexa_tracked_cases', JSON.stringify(updated));
        if (caseData?.cnr_no === cnr_no) setCaseData(null);
    };

    const openNotifyModal = (tc) => {
        setNotifyModal(tc);
        setNotifyEmail(user?.email || '');
        setNotifyPhone('');
        setNotifyMsg('');
        setNotifyError('');
    };

    const handleNotifySubmit = async (e) => {
        e.preventDefault();
        setNotifyLoading(true); setNotifyMsg(''); setNotifyError('');
        try {
            const res = await api.post(`/api/cases/${notifyModal.cnr_no}/notify`, {
                notify_email: notifyEmail,
                notify_phone: notifyPhone,
            });
            setNotifyMsg(res.data.message);
        } catch (err) {
            setNotifyError(err.response?.data?.message || 'Failed to save notification.');
        } finally { setNotifyLoading(false); }
    };

    const statusColor = (status) => {
        const s = status?.toLowerCase();
        if (s === 'active') return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
        if (s === 'disposed') return { bg: '#f5f5f5', color: '#525252', border: '#d4d4d4' };
        return { bg: '#fefce8', color: '#ca8a04', border: '#fde68a' };
    };

    const fmtDate = (d) => d
        ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
        : '—';

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>{t.case_title}</h1>
                <p>{t.case_subtitle}</p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', maxWidth: '600px' }}>
                <input
                    id="cnr-input"
                    type="text"
                    className="form-input"
                    placeholder={t.case_cnr_placeholder}
                    value={cnr}
                    onChange={e => { setCnr(e.target.value.toUpperCase()); setError(''); }}
                    style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '0.05em' }}
                />
                <button id="cnr-search" type="submit" className="btn btn-primary" disabled={loading || !cnr.trim()}>
                    {loading ? <><span className="spinner"></span> {t.case_searching}</> : t.case_search}
                </button>
                {searched && (
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => { setSearched(false); setCaseData(null); setCnr(''); setError(''); }}
                        title="Clear search and show all cases"
                    >✕ Clear</button>
                )}
            </form>

            {/* ── All Cases Browser — hidden once user performs a CNR search ── */}
            {!searched && (
                allLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem 0', color: 'var(--gray-500)' }}>
                        <div className="spinner" /> Loading case database...
                    </div>
                ) : (
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h2 style={{ fontSize: '1.05rem', fontWeight: '700' }}>⚖️ All Cases ({allCases.length})</h2>
                            <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>Click any case to view details</span>
                        </div>

                        {/* Status filter pills */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            {['All', 'Active', 'Pending', 'Disposed'].map(f => (
                                <button
                                    key={f}
                                    className={`btn btn-sm ${caseFilter === f ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ borderRadius: '100px' }}
                                    onClick={() => setCaseFilter(f)}
                                >{f}</button>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.875rem' }}>
                            {allCases
                                .filter(c => caseFilter === 'All' || c.status === caseFilter)
                                .map(c => {
                                    const sc = statusColor(c.status);
                                    return (
                                        <div key={c.cnr_no} className="card" style={{ padding: '1rem', cursor: 'pointer', transition: 'box-shadow 0.15s ease' }}
                                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
                                            onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
                                            onClick={() => navigate(`/cases/${c.cnr_no}`)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: '700', color: 'var(--gray-600)' }}>{c.cnr_no}</div>
                                                <span style={{ padding: '0.15rem 0.6rem', borderRadius: '100px', fontSize: '0.7rem', fontWeight: '700', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, flexShrink: 0 }}>{c.status}</span>
                                            </div>
                                            <div style={{ fontWeight: '600', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                                                {c.petitioner} <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>vs</span> {c.respondent}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--gray-500)', flexWrap: 'wrap' }}>
                                                <span>🏛 {c.court_name}</span>
                                                <span>📁 {c.case_type}</span>
                                                <span>📅 {fmtDate(c.next_hearing)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                        {allCases.filter(c => caseFilter === 'All' || c.status === caseFilter).length === 0 && (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>No cases with status "{caseFilter}"</div>
                        )}
                    </div>
                )
            )}


            {error && <div className="alert alert-error" style={{ maxWidth: '600px' }}>{error}</div>}

            {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '2rem', color: 'var(--gray-500)' }}>
                    <div className="spinner"></div> Fetching case details...
                </div>
            )}

            {/* Case details card */}
            {caseData && (
                <div className="card card-elevated animate-slide-up" style={{ maxWidth: '800px', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
                        <div>
                            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Case Number</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '1.3rem', fontWeight: '700' }}>{caseData.cnr_no}</div>
                        </div>
                        <div>
                            {(() => {
                                const c = statusColor(caseData.status); return (
                                    <span style={{ padding: '0.3rem 0.9rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: '700', background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                                        {caseData.status}
                                    </span>
                                );
                            })()}
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {[
                            { label: 'Petitioner', value: caseData.petitioner, icon: '👤' },
                            { label: 'Respondent', value: caseData.respondent, icon: '👥' },
                            { label: 'Court Name', value: caseData.court_name, icon: '🏛' },
                            { label: 'Case Type', value: caseData.case_type || '—', icon: '📁' },
                            { label: 'Judge', value: caseData.judge_name || '—', icon: '⚖️' },
                            { label: 'Filing Date', value: fmtDate(caseData.filing_date), icon: '📋' },
                            { label: 'Next Hearing', value: fmtDate(caseData.next_hearing), icon: '📅', highlight: true },
                            { label: 'Status', value: caseData.status, icon: '🔔', highlight: true },
                        ].map(item => (
                            <div key={item.label} style={{
                                padding: '0.875rem', borderRadius: 'var(--radius-sm)',
                                background: item.highlight ? 'var(--black)' : 'var(--gray-100)',
                                color: item.highlight ? 'var(--white)' : 'var(--black)'
                            }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6, marginBottom: '0.25rem' }}>
                                    {item.icon} {item.label}
                                </div>
                                <div style={{ fontSize: '0.95rem', fontWeight: '600' }}>{item.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No results */}
            {searched && !loading && !caseData && !error && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                    <p>No case found with that CNR number.</p>
                </div>
            )}

            {/* ── Tracked Cases Grid ─────────────────────────────── */}
            {trackedCases.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--gray-200)' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>📋 Tracked Cases</h2>
                        <span style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>{trackedCases.length} case{trackedCases.length !== 1 ? 's' : ''} tracked</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {trackedCases.map(tc => {
                            const sc = statusColor(tc.status);
                            const hasHearing = !!tc.next_hearing;
                            return (
                                <div key={tc.cnr_no} className="card card-elevated" style={{ position: 'relative', padding: '1.25rem' }}>
                                    {/* Remove button */}
                                    <button onClick={() => removeTracked(tc.cnr_no)}
                                        title="Remove from tracked"
                                        style={{
                                            position: 'absolute', top: '0.75rem', right: '0.75rem',
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: 'var(--gray-400)', fontSize: '0.9rem', lineHeight: 1,
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--gray-400)'}
                                    >✕</button>

                                    <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--gray-700)' }}>{tc.cnr_no}</div>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.6rem', paddingRight: '1.5rem' }}>
                                        {tc.petitioner} <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>vs</span> {tc.respondent}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                                        <span style={{ padding: '0.18rem 0.65rem', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                            {tc.status}
                                        </span>
                                        {hasHearing && (
                                            <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                                                📅 {fmtDate(tc.next_hearing)}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="btn btn-outline btn-sm"
                                            style={{ flex: 1, fontSize: '0.78rem' }}
                                            onClick={() => navigate(`/cases/${tc.cnr_no}`)}
                                        >
                                            👁 View
                                        </button>
                                        <button
                                            id={`notify-btn-${tc.cnr_no}`}
                                            className="btn btn-primary btn-sm"
                                            style={{ flex: 1, fontSize: '0.78rem' }}
                                            disabled={!hasHearing}
                                            title={hasHearing ? 'Get notified 1 day before hearing' : 'No hearing date set'}
                                            onClick={() => openNotifyModal(tc)}
                                        >
                                            🔔 Notify Me
                                        </button>
                                    </div>
                                    {!hasHearing && (
                                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: '0.4rem', textAlign: 'center' }}>
                                            No next hearing date
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Notify Me Modal ────────────────────────────────── */}
            {notifyModal && (
                <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setNotifyModal(null); }}>
                    <div className="modal animate-slide-up" style={{ maxWidth: '420px' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🔔</div>
                            <h2 className="modal-title">Hearing Reminder</h2>
                            <p className="modal-subtitle">
                                We'll email you <strong>1 day before</strong> the hearing on{' '}
                                <strong>{fmtDate(notifyModal.next_hearing)}</strong>.
                            </p>
                            <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--gray-500)', marginTop: '-0.5rem' }}>
                                {notifyModal.cnr_no}
                            </div>
                        </div>

                        {notifyMsg ? (
                            <>
                                <div className="alert alert-success">{notifyMsg}</div>
                                <button className="btn btn-primary w-full" onClick={() => setNotifyModal(null)}>Done</button>
                            </>
                        ) : (
                            <form onSubmit={handleNotifySubmit}>
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
                                    <div className="form-hint">SMS notifications coming soon — email sends immediately.</div>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-ghost" onClick={() => setNotifyModal(null)}>Cancel</button>
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

export default CaseTracker;
