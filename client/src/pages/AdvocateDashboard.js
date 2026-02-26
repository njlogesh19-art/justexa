import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GridBox from '../components/GridBox';
import { getIncomingMessageRequests, acceptMessageRequest, rejectMessageRequest } from '../utils/api';

const AdvocateDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [chatRequests, setChatRequests] = useState([]);
    const [reqLoading, setReqLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState({});

    const features = [
        {
            id: 'adv-box-petition',
            icon: '✍️',
            title: 'AI Petition Generator',
            description: 'Draft professional legal petitions instantly using AI. Save time and deliver polished documents to your clients.',
            path: '/petition',
        },
        {
            id: 'adv-box-cases',
            icon: '⚖️',
            title: 'Case Tracker',
            description: 'Search and monitor cases by CNR number. Get real-time status updates, hearing dates and court details.',
            path: '/case-tracker',
        },
        {
            id: 'adv-box-holidays',
            icon: '📅',
            title: 'Court Calendar',
            description: 'View court holidays, closures, and important legal dates to plan your schedule effectively.',
            path: '/holidays',
        },
    ];

    const loadChatRequests = useCallback(async () => {
        setReqLoading(true);
        try {
            const res = await getIncomingMessageRequests();
            setChatRequests(res.data.requests || []);
        } catch {
            // silently ignore
        } finally {
            setReqLoading(false);
        }
    }, []);

    useEffect(() => {
        loadChatRequests();
        const interval = setInterval(loadChatRequests, 15000);
        return () => clearInterval(interval);
    }, [loadChatRequests]);

    const handleAccept = async (reqId) => {
        setActionLoading(prev => ({ ...prev, [reqId]: 'accepting' }));
        try {
            await acceptMessageRequest(reqId);
            setChatRequests(prev => prev.filter(r => r._id !== reqId));
        } finally {
            setActionLoading(prev => { const n = { ...prev }; delete n[reqId]; return n; });
        }
    };

    const handleReject = async (reqId) => {
        setActionLoading(prev => ({ ...prev, [reqId]: 'rejecting' }));
        try {
            await rejectMessageRequest(reqId);
            setChatRequests(prev => prev.filter(r => r._id !== reqId));
        } finally {
            setActionLoading(prev => { const n = { ...prev }; delete n[reqId]; return n; });
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Welcome Banner */}
            <div style={{
                background: 'var(--black)',
                color: 'var(--white)',
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem 2rem',
                marginBottom: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
            }}>
                <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Advocate Portal
                    </div>
                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                        Welcome, {user?.name?.split(' ')[0] || 'Advocate'} ⚖️
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', maxWidth: '480px', lineHeight: 1.6 }}>
                        Your legal workspace — manage cases, draft petitions, and stay up to date with court schedules.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    {[
                        { value: '3', label: 'Tools Available' },
                        { value: '24/7', label: 'AI Assistant' },
                        { value: '100%', label: 'Verified' },
                    ].map(stat => (
                        <div key={stat.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-serif)' }}>{stat.value}</div>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Chat Request Notifications ── */}
            {(reqLoading || chatRequests.length > 0) && (
                <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 700 }}>
                            🔔 Chat Requests
                        </h2>
                        {chatRequests.length > 0 && (
                            <span style={{
                                background: '#ef4444', color: '#fff',
                                borderRadius: '100px', padding: '0.1rem 0.55rem',
                                fontSize: '0.72rem', fontWeight: 700,
                            }}>
                                {chatRequests.length} new
                            </span>
                        )}
                    </div>
                    {reqLoading && chatRequests.length === 0 ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
                            <span className="spinner spinner-lg" />
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {chatRequests.map(req => (
                                <div
                                    key={req._id}
                                    className="card card-elevated"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        padding: '1rem 1.25rem',
                                        border: '2px solid #fbbf24',
                                        background: '#fffbeb',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    {/* avatar */}
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '50%',
                                        background: 'var(--black)', color: 'var(--white)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.1rem', fontWeight: 700, flexShrink: 0,
                                    }}>
                                        {req.fromUserName?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    {/* info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{req.fromUserName}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{req.fromUserEmail}</div>
                                        <div style={{ fontSize: '0.82rem', marginTop: '0.25rem', fontStyle: 'italic', color: '#92400e' }}>
                                            "{req.message}"
                                        </div>
                                    </div>
                                    {/* actions */}
                                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                        <button
                                            id={`accept-req-${req._id}`}
                                            className="btn btn-primary btn-sm"
                                            style={{ background: '#16a34a', border: 'none', minWidth: '80px' }}
                                            disabled={!!actionLoading[req._id]}
                                            onClick={() => handleAccept(req._id)}
                                        >
                                            {actionLoading[req._id] === 'accepting' ? <span className="spinner" /> : '✅ Accept'}
                                        </button>
                                        <button
                                            id={`reject-req-${req._id}`}
                                            className="btn btn-outline btn-sm"
                                            style={{ borderColor: '#ef4444', color: '#ef4444', minWidth: '80px' }}
                                            disabled={!!actionLoading[req._id]}
                                            onClick={() => handleReject(req._id)}
                                        >
                                            {actionLoading[req._id] === 'rejecting' ? <span className="spinner" /> : '✕ Decline'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Feature Grid */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    Your Toolkit
                </h2>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                    Everything you need to practice law efficiently — all in one place.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                    {features.map(f => (
                        <GridBox
                            key={f.id}
                            id={f.id}
                            icon={f.icon}
                            title={f.title}
                            description={f.description}
                            onClick={() => navigate(f.path)}
                        />
                    ))}
                </div>
            </div>

            {/* Inbox CTA */}
            <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>💬 Need to connect with clients?</h3>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.82rem', marginTop: '0.2rem' }}>Head to your Inbox to view and reply to client messages.</p>
                </div>
                <button
                    id="goto-inbox-btn"
                    className="btn btn-primary"
                    onClick={() => navigate('/inbox')}
                >
                    📥 Open Inbox
                </button>
            </div>
        </div>
    );
};

export default AdvocateDashboard;
