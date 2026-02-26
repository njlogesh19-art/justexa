import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import T from '../context/translations';
import { getProfile, updateProfile } from '../utils/api';

// ── Avatar component ─────────────────────────────────────────────────────────
// showChangeIcon = true only in edit mode
const Avatar = ({ picture, name, editMode, onFileSelect }) => {
    const inputRef = useRef();

    const handleClick = () => {
        if (editMode) inputRef.current?.click();
    };

    return (
        <div
            style={{
                position: 'relative', width: '80px', height: '80px', flexShrink: 0,
                cursor: editMode ? 'pointer' : 'default',
            }}
            onClick={handleClick}
            title={editMode ? 'Click to change profile photo' : ''}
        >
            {/* Avatar image or letter */}
            {picture ? (
                <img
                    src={picture}
                    alt="Profile"
                    style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        objectFit: 'cover', border: '2px solid var(--gray-200)',
                    }}
                />
            ) : (
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'var(--black)', color: 'var(--white)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem', fontWeight: '700',
                }}>
                    {name?.charAt(0)?.toUpperCase() || '?'}
                </div>
            )}

            {/* Camera overlay — only rendered in edit mode */}
            {editMode && (
                <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.55)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: '2px',
                }}>
                    <span style={{ fontSize: '1.25rem' }}>📷</span>
                    <span style={{ fontSize: '0.52rem', color: '#fff', fontWeight: 700, letterSpacing: '0.05em' }}>CHANGE</span>
                </div>
            )}

            {/* Hidden file input — only active in edit mode */}
            {editMode && (
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // Validate size — 1.5MB raw = ~2MB base64
                        if (file.size > 1.5 * 1024 * 1024) {
                            alert('Image is too large. Please choose one under 1.5 MB.');
                            e.target.value = '';
                            return;
                        }

                        const reader = new FileReader();
                        reader.onload = (ev) => onFileSelect(ev.target.result);
                        reader.onerror = () => alert('Could not read file. Please try a different image.');
                        reader.readAsDataURL(file);
                    }}
                />
            )}
        </div>
    );
};

// ── Main Profile Page ─────────────────────────────────────────────────────────
const Profile = () => {
    const { user, role, logout } = useAuth();
    const navigate = useNavigate();
    const { lang } = useLanguage();
    const t = T[lang];

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState({});
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

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="spinner spinner-lg"></div>
        </div>
    );
    if (error) return <div className="alert alert-error">{error}</div>;

    const data = profile || user;
    const isAdvocate = role === 'advocate';

    const handleEditStart = () => {
        const base = { picture: data?.picture || '' };
        if (isAdvocate) {
            setEditData({
                ...base,
                name: data?.name || '',
                mobile_no: data?.mobile_no || '',
                city: data?.city || '',
                bio: data?.bio || '',
                consultation_fee: data?.consultation_fee ?? 0,
            });
        } else {
            setEditData({ ...base, name: data?.name || '', location: data?.location || '' });
        }
        setEditing(true);
        setSaveSuccess('');
        setSaveError('');
    };

    const handleEditCancel = () => {
        setEditing(false);
        setSaveSuccess('');
        setSaveError('');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaveError('');
        try {
            // editData includes picture if changed — backend handles it in one call
            const res = await updateProfile(editData);
            setProfile(res.data.profile);
            setEditing(false);
            setSaveSuccess(t.profile_updated || 'Profile updated successfully!');
            setTimeout(() => setSaveSuccess(''), 3000);
        } catch (err) {
            setSaveError(err.response?.data?.message || 'Failed to update profile. Please try again.');
        } finally { setSaving(false); }
    };

    const handleLogout = () => { logout(); navigate('/'); };

    // Prefer locally-selected preview in editData, then saved picture
    const displayPicture = editing ? (editData.picture || '') : (data?.picture || '');

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>{t.profile_title}</h1>
                <p>{t.profile_subtitle}</p>
            </div>

            <div style={{ maxWidth: '640px' }}>
                {/* Avatar + name card */}
                <div className="card card-elevated" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <Avatar
                            picture={displayPicture}
                            name={data?.name}
                            editMode={editing}
                            onFileSelect={(base64) => setEditData(p => ({ ...p, picture: base64 }))}
                        />
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{data?.name}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                                <span className="badge badge-dark" style={{ textTransform: 'capitalize' }}>
                                    {isAdvocate ? '⚖️ Advocate' : '👤 User'}
                                </span>
                                {isAdvocate && data?.specialization && (
                                    <span className="badge badge-light">{data.specialization}</span>
                                )}
                            </div>
                            {editing && (
                                <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: '0.4rem' }}>
                                    Click avatar to change photo
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {saveSuccess && (
                    <div style={{
                        background: 'var(--gray-100)', color: 'var(--gray-700)',
                        border: '1px solid var(--gray-300)', borderLeft: '4px solid var(--black)',
                        borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem',
                        marginBottom: '1rem', fontSize: '0.9rem'
                    }}>
                        ✅ {saveSuccess}
                    </div>
                )}

                {/* Details card */}
                <div className="card card-elevated" style={{ marginBottom: '1.5rem' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: '1.25rem', paddingBottom: '0.75rem',
                        borderBottom: '1px solid var(--gray-200)'
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{t.profile_account_details}</h3>
                        {!editing && (
                            <button id="edit-profile-btn" className="btn btn-outline btn-sm" onClick={handleEditStart}>
                                ✏️ {t.profile_edit || 'Edit'}
                            </button>
                        )}
                    </div>

                    {editing ? (
                        <form onSubmit={handleSave} style={{ display: 'grid', gap: '1rem' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Full Name</label>
                                <input id="edit-name" type="text" className="form-input"
                                    value={editData.name}
                                    onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                                    required />
                            </div>
                            {!isAdvocate && (
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Location</label>
                                    <input id="edit-location" type="text" className="form-input"
                                        value={editData.location}
                                        onChange={e => setEditData(p => ({ ...p, location: e.target.value }))}
                                        placeholder="City, State" />
                                </div>
                            )}
                            {isAdvocate && (
                                <>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label">Mobile Number</label>
                                        <input id="edit-mobile" type="tel" className="form-input"
                                            value={editData.mobile_no}
                                            onChange={e => setEditData(p => ({ ...p, mobile_no: e.target.value }))}
                                            placeholder="+91 XXXXX XXXXX" />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label">City</label>
                                        <input id="edit-city" type="text" className="form-input"
                                            value={editData.city}
                                            onChange={e => setEditData(p => ({ ...p, city: e.target.value }))}
                                            placeholder="e.g. Chennai" />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label">Consultation Fee (₹)</label>
                                        <input id="edit-fee" type="number" min="0" className="form-input"
                                            value={editData.consultation_fee}
                                            onChange={e => setEditData(p => ({ ...p, consultation_fee: Number(e.target.value) }))} />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label">Bio</label>
                                        <textarea id="edit-bio" className="form-input" rows={3}
                                            value={editData.bio}
                                            onChange={e => setEditData(p => ({ ...p, bio: e.target.value }))}
                                            placeholder="Brief professional summary..."
                                            style={{ resize: 'vertical', minHeight: '80px' }} />
                                    </div>
                                </>
                            )}
                            {saveError && <div className="alert alert-error">{saveError}</div>}
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="button" className="btn btn-outline" onClick={handleEditCancel}>
                                    {t.profile_cancel || 'Cancel'}
                                </button>
                                <button id="save-profile-btn" type="submit" className="btn btn-primary"
                                    style={{ flex: 1 }} disabled={saving}>
                                    {saving
                                        ? <><span className="spinner"></span> Saving...</>
                                        : (t.profile_save || 'Save Changes')}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {[
                                { label: t.profile_full_name || 'Full Name', value: data?.name, icon: '👤' },
                                { label: t.profile_email || 'Email', value: data?.email, icon: '📧' },
                                ...(!isAdvocate ? [{ label: t.profile_location || 'Location', value: data?.location, icon: '📍' }] : []),
                                ...(isAdvocate ? [
                                    { label: t.profile_bar || 'Bar Council ID', value: data?.bar_council_id, icon: '🪪' },
                                    { label: t.profile_spec || 'Specialization', value: data?.specialization, icon: '⚖️' },
                                    { label: t.profile_exp || 'Experience', value: data?.experience ? `${data.experience} years` : '-', icon: '📅' },
                                    { label: 'Mobile', value: data?.mobile_no, icon: '📱' },
                                    { label: 'City', value: data?.city, icon: '📍' },
                                    { label: 'Consultation Fee', value: data?.consultation_fee ? `₹${data.consultation_fee}` : '—', icon: '💰' },
                                    { label: 'Bio', value: data?.bio, icon: '📝' },
                                ] : []),
                                { label: t.profile_type || 'Account Type', value: isAdvocate ? 'Advocate' : 'User', icon: '🔑' },
                                { label: t.profile_since || 'Member Since', value: data?.createdAt ? new Date(data.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '-', icon: '🗓' },
                            ].map(item => (
                                <div key={item.label} style={{
                                    display: 'flex', gap: '1rem', padding: '0.75rem',
                                    borderRadius: 'var(--radius-sm)', background: 'var(--gray-100)'
                                }}>
                                    <span style={{ fontSize: '1.1rem', minWidth: '24px' }}>{item.icon}</span>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {item.label}
                                        </div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: '500', marginTop: '0.15rem' }}>
                                            {item.value || '—'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                    <button id="logout-btn" className="btn btn-outline w-full"
                        style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                        onClick={handleLogout}>
                        {t.profile_logout || 'Logout'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
