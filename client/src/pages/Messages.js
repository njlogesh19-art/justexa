import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Messages = () => {
    const { advocateId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [otherParty, setOtherParty] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);

    const currentPartyId = advocateId;

    // Fetch messages for current conversation
    const fetchMessages = useCallback(async () => {
        if (!currentPartyId) return;
        try {
            const res = await api.get(`/api/messages/${currentPartyId}`);
            setMessages(res.data.messages || []);
            setOtherParty(res.data.otherParty);
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        } finally {
            setLoading(false);
        }
    }, [currentPartyId]);

    // Fetch conversations list
    const fetchConversations = useCallback(async () => {
        try {
            const res = await api.get('/api/messages/conversations');
            setConversations(res.data.conversations || []);
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchMessages();
        fetchConversations();
    }, [fetchMessages, fetchConversations]);

    // Poll for new messages every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchMessages();
            fetchConversations();
        }, 5000);
        return () => clearInterval(interval);
    }, [fetchMessages, fetchConversations]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() || !currentPartyId) return;
        setSending(true);
        try {
            const res = await api.post(`/api/messages/${currentPartyId}`, { text });
            setMessages(prev => [...prev, res.data.message]);
            setText('');
            inputRef.current?.focus();
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (ts) => {
        const d = new Date(ts);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - var(--navbar-height))', overflow: 'hidden', background: 'var(--gray-100)' }}>

            {/* ─── Left Panel: Conversations ─── */}
            <div style={{
                width: '300px', minWidth: '300px', background: 'var(--white)',
                borderRight: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--gray-200)' }}>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>💬 Messages</h2>
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {conversations.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.85rem' }}>
                            No conversations yet.<br />Start by messaging an advocate from the marketplace.
                        </div>
                    )}
                    {conversations.map(({ other, otherModel, lastMessage, unreadCount }) => {
                        if (!other) return null;
                        const isActive = other._id === currentPartyId;
                        return (
                            <div
                                key={other._id}
                                onClick={() => navigate(`/messages/${other._id}`)}
                                style={{
                                    padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    background: isActive ? 'var(--gray-100)' : 'transparent',
                                    borderLeft: isActive ? '3px solid var(--black)' : '3px solid transparent',
                                    transition: 'all 0.15s', borderBottom: '1px solid var(--gray-100)'
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--gray-50)'; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: 'var(--gray-200)', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0
                                }}>
                                    {otherModel === 'Advocate' ? '⚖️' : '👤'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.875rem', truncate: 'ellipsis' }}>{other.name}</span>
                                        {unreadCount > 0 && (
                                            <span style={{ background: 'var(--black)', color: 'var(--white)', borderRadius: '100px', padding: '0.1rem 0.45rem', fontSize: '0.65rem', fontWeight: 700 }}>{unreadCount}</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.15rem' }}>
                                        {lastMessage?.text || 'No messages yet'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── Right Panel: Chat Window ─── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Chat header */}
                <div style={{
                    padding: '1rem 1.5rem', background: 'var(--white)',
                    borderBottom: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', gap: '1rem'
                }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ padding: '0.4rem 0.75rem' }}>← Back</button>
                    {otherParty ? (
                        <>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>⚖️</div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{otherParty.name}</div>
                                {otherParty.specialization && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{otherParty.specialization} {otherParty.city ? `· ${otherParty.city}` : ''}</div>}
                            </div>
                        </>
                    ) : (
                        <div style={{ fontWeight: 700 }}>Loading...</div>
                    )}
                </div>

                {/* Messages area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {loading && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                            <span className="spinner spinner-lg" />
                        </div>
                    )}
                    {!loading && messages.length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--gray-400)', marginTop: '4rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                            <p style={{ fontSize: '0.9rem' }}>No messages yet. Send a message to start the conversation!</p>
                        </div>
                    )}
                    {messages.map((msg) => {
                        const isMine = msg.senderId === user?.id;
                        return (
                            <div key={msg._id} style={{
                                display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '0.5rem'
                            }}>
                                {!isMine && (
                                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>⚖️</div>
                                )}
                                <div style={{
                                    maxWidth: '65%', padding: '0.65rem 1rem', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                    background: isMine ? 'var(--black)' : 'var(--white)',
                                    color: isMine ? 'var(--white)' : 'var(--black)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                    border: isMine ? 'none' : '1px solid var(--gray-200)'
                                }}>
                                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.text}</p>
                                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.65rem', opacity: 0.6, textAlign: 'right' }}>{formatTime(msg.createdAt)}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {/* Message input */}
                <div style={{ padding: '1rem 1.5rem', background: 'var(--white)', borderTop: '1px solid var(--gray-200)' }}>
                    <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <input
                            ref={inputRef}
                            id="msg-input"
                            type="text"
                            className="form-input"
                            placeholder="Type a message..."
                            value={text}
                            onChange={e => setText(e.target.value)}
                            style={{ flex: 1, borderRadius: '100px', padding: '0.65rem 1.25rem' }}
                            disabled={!otherParty}
                        />
                        <button
                            id="msg-send"
                            type="submit"
                            className="btn btn-primary"
                            disabled={sending || !text.trim()}
                            style={{ borderRadius: '100px', padding: '0.65rem 1.25rem', minWidth: '80px' }}
                        >
                            {sending ? <span className="spinner" /> : '➤ Send'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Messages;
