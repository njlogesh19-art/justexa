import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import T from '../context/translations';
import GridBox from '../components/GridBox';
import api from '../utils/api';



// ── Acceptance Notification Toast ───────────────────────────────────────────
const AcceptanceNotification = ({ notification, onClose, onGoToInbox }) => (
    <div
        style={{
            position: 'fixed',
            top: '5.5rem',
            right: '1.5rem',
            zIndex: 10000,
            width: '320px',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            border: '1px solid #d1fae5',
            borderLeft: '4px solid #10b981',
            overflow: 'hidden',
            animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
    >
        {/* Green header bar */}
        <div style={{
            background: 'linear-gradient(90deg, #10b981, #059669)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>✅</span>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                    Chat Request Accepted!
                </span>
            </div>
            <button
                onClick={onClose}
                style={{
                    background: 'none', border: 'none', color: '#fff',
                    cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1,
                    opacity: 0.8, padding: 0,
                }}
            >×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                <strong>{notification.advocateName}</strong>
                {notification.advocateSpec ? ` (${notification.advocateSpec})` : ''}
                {' '}has accepted your chat request. You can now message them directly.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                    onClick={onGoToInbox}
                    style={{
                        flex: 1,
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '7px',
                        padding: '0.55rem 1rem',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                    }}
                >
                    📥 Go to Inbox
                </button>
                <button
                    onClick={onClose}
                    style={{
                        background: '#f3f4f6',
                        color: '#6b7280',
                        border: '1px solid #e5e7eb',
                        borderRadius: '7px',
                        padding: '0.55rem 0.85rem',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                    }}
                >
                    Dismiss
                </button>
            </div>
        </div>
    </div>
);

// ── Auth Gate Modal ──────────────────────────────────────────────────────────
const AuthGateModal = ({ targetPath, onClose }) => {
    const navigate = useNavigate();
    const { lang } = useLanguage();
    const t = T[lang];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal animate-slide-up" onClick={e => e.stopPropagation()}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚖️</div>
                    <h2 className="modal-title">{t.modal_login_required}</h2>
                    <p className="modal-subtitle">{t.modal_login_msg}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button id="modal-user-login" className="btn btn-primary btn-lg"
                        onClick={() => { onClose(); navigate(`/login?type=user&redirect=${targetPath}`); }}>
                        {t.modal_sign_in}
                    </button>
                </div>
                <button className="btn btn-ghost w-full" style={{ marginTop: '0.75rem' }} onClick={onClose}>{t.cancel}</button>
            </div>
        </div>
    );
};

// ── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
    const { isAuthenticated, role } = useAuth();
    const { lang } = useLanguage();
    const t = T[lang];
    const navigate = useNavigate();
    const [modal, setModal] = useState(null);
    const [notification, setNotification] = useState(null);

    const SEEN_KEY = 'justexa_seen_accepted_requests';

    const checkAcceptedRequests = useCallback(async () => {
        // Only check for regular users (not advocates, not unauthenticated)
        if (!isAuthenticated() || role === 'advocate') return;
        try {
            const res = await api.get('/api/message-requests/accepted');
            const accepted = res.data.accepted || [];
            if (accepted.length === 0) return;

            // Track which IDs we've already notified about
            const seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
            const newOnes = accepted.filter(r => !seen.includes(r._id.toString()));

            if (newOnes.length > 0) {
                // Show the most recent one
                setNotification(newOnes[0]);
                // Mark all new ones as seen
                const updatedSeen = [...seen, ...newOnes.map(r => r._id.toString())];
                localStorage.setItem(SEEN_KEY, JSON.stringify(updatedSeen));
            }
        } catch {
            // Silently fail — user may not be logged in or endpoint unavailable
        }
    }, [isAuthenticated, role]);

    useEffect(() => {
        checkAcceptedRequests();
        const interval = setInterval(checkAcceptedRequests, 15000);
        return () => clearInterval(interval);
    }, [checkAcceptedRequests]);

    const handleBoxClick = (path, isMarketplace = false) => {
        if (!isAuthenticated()) {
            if (isMarketplace) navigate(`/login?type=user&redirect=${path}`);
            else setModal(path);
        } else {
            navigate(path);
        }
    };

    return (
        <div className="animate-fade-in">
            {modal && <AuthGateModal targetPath={modal} onClose={() => setModal(null)} />}

            {/* Acceptance notification toast */}
            {notification && (
                <AcceptanceNotification
                    notification={notification}
                    onClose={() => setNotification(null)}
                    onGoToInbox={() => { setNotification(null); navigate('/inbox'); }}
                />
            )}

            <div style={{ textAlign: 'center', padding: '3rem 1rem 2.5rem', borderBottom: '1px solid var(--gray-200)', marginBottom: '2.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.15em', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                    {t.dash_tag}
                </div>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '700', letterSpacing: '-0.03em', marginBottom: '1rem' }}>
                    {t.dash_hero}
                </h1>
                <p style={{ color: 'var(--gray-500)', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
                    {t.dash_desc}
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '1.5rem', maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}>
                <GridBox id="box-petition" icon="✍️" title={t.dash_box_petition_title} description={t.dash_box_petition_desc} onClick={() => handleBoxClick('/petition')} />
                <GridBox id="box-case-tracker" icon="⚖️" title={t.dash_box_cases_title} description={t.dash_box_cases_desc} onClick={() => handleBoxClick('/case-tracker')} />
                <GridBox id="box-holidays" icon="📅" title={t.dash_box_holidays_title} description={t.dash_box_holidays_desc} onClick={() => handleBoxClick('/holidays')} />
                <GridBox id="box-marketplace" icon="👥" title={t.dash_box_market_title} description={t.dash_box_market_desc} onClick={() => handleBoxClick('/marketplace', true)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '3rem', padding: '2rem', borderTop: '1px solid var(--gray-200)', flexWrap: 'wrap' }}>
                {[
                    { value: '10,000+', label: t.dash_stat_cases },
                    { value: '500+', label: t.dash_stat_advocates },
                    { value: '50,000+', label: t.dash_stat_petitions },
                    { value: '98%', label: t.dash_stat_satisfaction },
                ].map(stat => (
                    <div key={stat.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>{stat.value}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
