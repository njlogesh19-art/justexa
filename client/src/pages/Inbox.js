import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getConversations } from '../utils/api';

const Inbox = () => {
    const { role } = useAuth();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadConversations = useCallback(async () => {
        try {
            const res = await getConversations();
            setConversations(res.data.conversations || []);
        } catch {
            setError('Failed to load messages. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConversations();
        // Poll every 10 seconds for new messages
        const interval = setInterval(loadConversations, 10000);
        return () => clearInterval(interval);
    }, [loadConversations]);

    const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    return (
        <div className="animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h1>📥 Inbox</h1>
                    {totalUnread > 0 && (
                        <span style={{
                            background: 'var(--black)', color: 'var(--white)',
                            borderRadius: '100px', padding: '0.1rem 0.6rem',
                            fontSize: '0.75rem', fontWeight: 700,
                        }}>
                            {totalUnread} new
                        </span>
                    )}
                </div>
                <p>{role === 'advocate' ? 'Messages from your clients' : 'Messages from advocates you connected with'}</p>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <span className="spinner spinner-lg" />
                </div>
            ) : error ? (
                <div className="alert alert-error">⚠️ {error}</div>
            ) : conversations.length === 0 ? (
                <div className="card card-elevated" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                    <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No conversations yet</h3>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.88rem' }}>
                        {role === 'advocate'
                            ? 'When users send you messages, they will appear here.'
                            : 'Start chatting by clicking "Message" on an advocate\'s profile in the Marketplace.'}
                    </p>
                    {role !== 'advocate' && (
                        <button
                            className="btn btn-primary"
                            style={{ marginTop: '1.5rem' }}
                            onClick={() => navigate('/marketplace')}
                        >
                            Browse Advocates →
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {conversations.map((conv) => {
                        const initials = conv.name?.charAt(0)?.toUpperCase() || '?';
                        const hasUnread = conv.unreadCount > 0;
                        return (
                            <div
                                key={conv._id || conv.partnerId}
                                id={`conv-${conv.partnerId}`}
                                onClick={() => navigate(`/messages/${conv.partnerId}`)}
                                className="card card-elevated"
                                style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem 1.25rem',
                                    border: hasUnread ? '2px solid var(--black)' : '1px solid var(--gray-200)',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = ''}
                            >
                                {/* Avatar */}
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    background: 'var(--black)', color: 'var(--white)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.1rem', fontWeight: 700, flexShrink: 0,
                                }}>
                                    {initials}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                                        <span style={{ fontWeight: hasUnread ? 700 : 600, fontSize: '0.95rem' }}>
                                            {conv.name || 'Unknown'}
                                        </span>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>
                                            {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: hasUnread ? 'var(--black)' : 'var(--gray-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: hasUnread ? 600 : 400 }}>
                                        {conv.lastMessage?.text || 'No messages yet'}
                                    </div>
                                </div>

                                {/* Unread badge */}
                                {hasUnread && (
                                    <span style={{
                                        background: 'var(--black)', color: 'var(--white)',
                                        borderRadius: '100px', padding: '0.15rem 0.55rem',
                                        fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                                    }}>
                                        {conv.unreadCount}
                                    </span>
                                )}

                                <span style={{ color: 'var(--gray-300)', fontSize: '1rem' }}>›</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Inbox;
