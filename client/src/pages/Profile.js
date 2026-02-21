import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import T from '../context/translations';
import { getProfile, updateProfile } from '../utils/api';

const Profile = () => {
    const { user, role, logout } = useAuth();
    const navigate = useNavigate();
    const { lang } = useLanguage();
    const t = T[lang];

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState({ name: '', location: '' });
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState('');
    const [saveError, setSaveError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await getProfile();
                setProfile(res.data.profile);
            } catch {
                setError('Failed to load profile. Please try again.');
            } finally { setLoading(false); }
        };
        fetchProfile();
    }, []);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner spinner-lg"></div></div>;
    if (error) return <div className="alert alert-error">{error}</div>;

    const data = profile || user;
    const isAdvocate = role === 'advocate';

    const handleEditStart = () => { setEditData({ name: data?.name || '', location: data?.location || '' }); setEditing(true); setSaveSuccess(''); setSaveError(''); };
    const handleEditCancel = () => { setEditing(false); setSaveSuccess(''); setSaveError(''); };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true); setSaveError('');
        try {
            const res = await updateProfile({ name: editData.name, location: editData.location });
            setProfile(res.data.profile);
            setEditing(false);
            setSaveSuccess(t.profile_updated);
            setTimeout(() => setSaveSuccess(''), 3000);
        } catch (err) {
            setSaveError(err.response?.data?.message || 'Failed to update profile.');
        } finally { setSaving(false); }
    };

    const handleLogout = () => { logout(); navigate('/'); };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>{t.profile_title}</h1>
                <p>{t.profile_subtitle}</p>
            </div>

            <div style={{ maxWidth: '640px' }}>
                <div className="card card-elevated" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--black)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '700', flexShrink: 0 }}>
                            {data?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{data?.name}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                                <span className="badge badge-dark" style={{ textTransform: 'capitalize' }}>
                                    {isAdvocate ? '⚖️ Advocate' : '👤 User'}
                                </span>
                                {isAdvocate && data?.specialization && <span className="badge badge-light">{data.specialization}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {saveSuccess && <div style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.9rem' }}>✅ {saveSuccess}</div>}

                <div className="card card-elevated" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--gray-200)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{t.profile_account_details}</h3>
                        {!isAdvocate && !editing && (
                            <button id="edit-profile-btn" className="btn btn-outline btn-sm" onClick={handleEditStart}>{t.profile_edit}</button>
                        )}
                    </div>

                    {editing ? (
                        <form onSubmit={handleSave} style={{ display: 'grid', gap: '1rem' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">{t.profile_full_name}</label>
                                <input id="edit-name" type="text" className="form-input" value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} required />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">{t.profile_location}</label>
                                <input id="edit-location" type="text" className="form-input" value={editData.location} onChange={e => setEditData(p => ({ ...p, location: e.target.value }))} placeholder="City, State" />
                            </div>
                            {saveError && <div className="alert alert-error">{saveError}</div>}
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="button" className="btn btn-outline" onClick={handleEditCancel}>{t.profile_cancel}</button>
                                <button id="save-profile-btn" type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                                    {saving ? <><span className="spinner"></span> {t.profile_saving}</> : t.profile_save}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {[
                                { label: t.profile_full_name, value: data?.name, icon: '👤' },
                                { label: t.profile_email, value: data?.email, icon: '📧' },
                                ...(!isAdvocate ? [{ label: t.profile_location, value: data?.location, icon: '📍' }] : []),
                                ...(isAdvocate ? [
                                    { label: t.profile_bar, value: data?.bar_council_id, icon: '🪪' },
                                    { label: t.profile_spec, value: data?.specialization, icon: '⚖️' },
                                    { label: t.profile_exp, value: data?.experience ? `${data.experience} years` : '-', icon: '📅' },
                                ] : []),
                                { label: t.profile_type, value: isAdvocate ? 'Advocate' : 'User', icon: '🔑' },
                                { label: t.profile_since, value: data?.createdAt ? new Date(data.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '-', icon: '🗓' },
                            ].map(item => (
                                <div key={item.label} style={{ display: 'flex', gap: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--gray-100)' }}>
                                    <span style={{ fontSize: '1.1rem', minWidth: '24px' }}>{item.icon}</span>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: '500', marginTop: '0.15rem' }}>{item.value || '—'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                    <button id="logout-btn" className="btn btn-outline w-full" style={{ color: '#dc2626', borderColor: '#fca5a5' }} onClick={handleLogout}>
                        {t.profile_logout}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
