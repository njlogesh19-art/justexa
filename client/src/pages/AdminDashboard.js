import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

// ─── API helpers ──────────────────────────────────────────────────────────────
const adminApi = {
    getAdvocates: () => api.get('/api/admin/advocates'),
    addAdvocate: (d) => api.post('/api/admin/add-advocate', d),
    updateAdvocate: (id, d) => api.put(`/api/admin/advocates/${id}`, d),
    deleteAdvocate: (id) => api.delete(`/api/admin/advocates/${id}`),
    getCases: () => api.get('/api/admin/cases'),
    addCase: (d) => api.post('/api/admin/add-case', d),
    updateCase: (id, d) => api.put(`/api/admin/cases/${id}`, d),
    deleteCase: (id) => api.delete(`/api/admin/cases/${id}`),
};

const SPECIALIZATIONS = [
    'Criminal Law', 'Civil Litigation', 'Family Law', 'Corporate Law', 'Constitutional Law',
    'Property Law', 'Labor & Employment Law', 'Intellectual Property (IPR)', 'Cyber Law',
    'Taxation Law', 'Banking & Finance Law', 'Environmental Law', 'Arbitration & Mediation',
    'Human Rights Law', 'Maritime Law', 'Insurance Law', 'Consumer Protection',
    'Motor Accident Claims', 'Real Estate & Property Law', 'Other',
];
const CASE_TYPES = ['Criminal', 'Civil', 'Family', 'Corporate', 'Labor', 'Property', 'Constitutional', 'Consumer', 'Cyber', 'Taxation', 'Other'];
const STATUSES = ['Pending', 'Ongoing', 'Closed'];

const EMPTY_ADV = { name: '', bar_council_id: '', email: '', mobile_no: '', specialization: '', experience: '', city: '' };
const EMPTY_CASE = { cnr_no: '', case_title: '', client_name: '', petitioner: '', respondent: '', case_type: '', court_name: '', judge_name: '', next_hearing: '', filing_date: '', status: 'Pending' };

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        Pending: { bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
        Ongoing: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
        Closed: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    };
    const s = map[status] || { bg: 'var(--gray-100)', color: 'var(--gray-700)', border: 'var(--gray-200)' };
    return (
        <span style={{
            display: 'inline-block', padding: '0.18rem 0.65rem',
            borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700,
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
        }}>{status}</span>
    );
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value }) => (
    <div className="card card-elevated" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ fontSize: '2rem', lineHeight: 1 }}>{icon}</div>
        <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontWeight: 600, marginTop: '0.2rem' }}>{label}</div>
        </div>
    </div>
);

// ─── Form fields ──────────────────────────────────────────────────────────────
const Field = ({ label, id, type = 'text', value, onChange, placeholder, required }) => (
    <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" htmlFor={id}>{label}{required && ' *'}</label>
        <input id={id} type={type} value={value} onChange={onChange}
            placeholder={placeholder} className="form-input" required={required} />
    </div>
);

const Select = ({ label, id, value, onChange, options, required }) => (
    <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" htmlFor={id}>{label}{required && ' *'}</label>
        <select id={id} value={value} onChange={onChange} className="form-input" required={required}
            style={{ cursor: 'pointer' }}>
            <option value="">Select {label}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
    const [tab, setTab] = useState('overview');
    const [advocates, setAdvocates] = useState([]);
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);

    const [advForm, setAdvForm] = useState(EMPTY_ADV);
    const [caseForm, setCaseForm] = useState(EMPTY_CASE);
    const [editAdv, setEditAdv] = useState(null);
    const [editCase, setEditCase] = useState(null);
    const [busy, setBusy] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [a, c] = await Promise.all([adminApi.getAdvocates(), adminApi.getCases()]);
            setAdvocates(a.data.advocates || []);
            setCases(c.data.cases || []);
        } catch { showToast('Failed to load data.', 'error'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Advocate CRUD ──
    const submitAdv = async (e) => {
        e.preventDefault(); setBusy(true);
        try {
            if (editAdv) {
                await adminApi.updateAdvocate(editAdv._id, advForm);
                showToast('Advocate updated!'); setEditAdv(null);
            } else {
                await adminApi.addAdvocate(advForm); showToast('Advocate added!');
            }
            setAdvForm(EMPTY_ADV); loadData();
        } catch (err) { showToast(err.response?.data?.message || 'Save failed.', 'error'); }
        finally { setBusy(false); }
    };
    const deleteAdv = async (id) => {
        if (!window.confirm('Delete advocate?')) return;
        try { await adminApi.deleteAdvocate(id); showToast('Deleted.'); loadData(); }
        catch { showToast('Delete failed.', 'error'); }
    };
    const startEditAdv = (a) => {
        setEditAdv(a);
        setAdvForm({
            name: a.name, bar_council_id: a.bar_council_id, email: a.email,
            mobile_no: a.mobile_no || '', specialization: a.specialization,
            experience: a.experience || '', city: a.city || ''
        });
        setTab('advocates');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ── Case CRUD ──
    const submitCase = async (e) => {
        e.preventDefault(); setBusy(true);
        try {
            if (editCase) {
                await adminApi.updateCase(editCase._id, caseForm);
                showToast('Case updated!'); setEditCase(null);
            } else {
                await adminApi.addCase(caseForm); showToast('Case added!');
            }
            setCaseForm(EMPTY_CASE); loadData();
        } catch (err) { showToast(err.response?.data?.message || 'Save failed.', 'error'); }
        finally { setBusy(false); }
    };
    const deleteCase = async (id) => {
        if (!window.confirm('Delete case?')) return;
        try { await adminApi.deleteCase(id); showToast('Deleted.'); loadData(); }
        catch { showToast('Delete failed.', 'error'); }
    };
    const startEditCase = (c) => {
        setEditCase(c);
        setCaseForm({
            cnr_no: c.cnr_no || '',
            case_title: c.case_title,
            client_name: c.client_name,
            petitioner: c.petitioner || '',
            respondent: c.respondent || '',
            case_type: c.case_type,
            court_name: c.court_name,
            judge_name: c.judge_name || '',
            next_hearing: c.next_hearing ? c.next_hearing.slice(0, 10) : '',
            filing_date: c.filing_date ? c.filing_date.slice(0, 10) : '',
            status: c.status,
        });
        setTab('cases');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ── Table helpers ──
    const thStyle = {
        padding: '0.65rem 1rem', textAlign: 'left', fontWeight: 700,
        fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'var(--gray-600)', background: 'var(--gray-100)',
        borderBottom: '2px solid var(--gray-200)', whiteSpace: 'nowrap',
    };
    const tdStyle = {
        padding: '0.7rem 1rem', fontSize: '0.875rem',
        borderBottom: '1px solid var(--gray-200)', color: 'var(--black)',
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Toast */}
            {toast && (
                <div className={`alert ${toast.type === 'error' ? 'alert-error' : 'alert-success'}`}
                    style={{
                        position: 'fixed', top: '5.5rem', right: '1.5rem', zIndex: 9999,
                        minWidth: '260px', boxShadow: 'var(--shadow-lg)', animation: 'slideUp 0.3s ease'
                    }}>
                    {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
                </div>
            )}

            {/* Page header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        🛡️ Admin Dashboard
                    </h1>
                    <p>Manage advocates, cases and platform operations</p>
                </div>
                <button
                    className="btn btn-outline btn-sm"
                    onClick={() => { localStorage.removeItem('justexa_admin_token'); window.location.href = '/admin/login'; }}
                >
                    🚪 Logout
                </button>
            </div>

            {/* Tabs */}
            <div className="tabs">
                {[{ id: 'overview', icon: '📊', label: 'Overview' },
                { id: 'advocates', icon: '⚖️', label: 'Advocates' },
                { id: 'cases', icon: '📁', label: 'Cases' }].map(t => (
                    <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`}
                        onClick={() => setTab(t.id)}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <span className="spinner spinner-lg" />
                </div>
            ) : (
                <>
                    {/* ── OVERVIEW ── */}
                    {tab === 'overview' && (
                        <div className="animate-fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '1rem' }}>
                                <StatCard icon="⚖️" label="Total Advocates" value={advocates.length} />
                                <StatCard icon="📁" label="Total Cases" value={cases.length} />
                                <StatCard icon="🕐" label="Pending" value={cases.filter(c => c.status === 'Pending').length} />
                                <StatCard icon="🔵" label="Ongoing" value={cases.filter(c => c.status === 'Ongoing').length} />
                                <StatCard icon="✅" label="Closed" value={cases.filter(c => c.status === 'Closed').length} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                {/* Recent advocates */}
                                <div className="card card-elevated">
                                    <h3 style={{ fontWeight: 700, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--gray-200)' }}>⚖️ Recent Advocates</h3>
                                    {advocates.slice(0, 6).map(a => (
                                        <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--gray-100)', fontSize: '0.875rem' }}>
                                            <span style={{ fontWeight: 600 }}>{a.name}</span>
                                            <span style={{ color: 'var(--gray-500)' }}>{a.city || '—'}</span>
                                        </div>
                                    ))}
                                    {advocates.length === 0 && <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>No advocates yet.</p>}
                                </div>

                                {/* Recent cases */}
                                <div className="card card-elevated">
                                    <h3 style={{ fontWeight: 700, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--gray-200)' }}>📁 Recent Cases</h3>
                                    {cases.slice(0, 6).map(c => (
                                        <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--gray-100)', fontSize: '0.875rem' }}>
                                            <span style={{ fontWeight: 600 }}>{c.case_title}</span>
                                            <StatusBadge status={c.status} />
                                        </div>
                                    ))}
                                    {cases.length === 0 && <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>No cases yet.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── ADVOCATES ── */}
                    {tab === 'advocates' && (
                        <div className="animate-fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
                            {/* Add / Edit form */}
                            <div className="card card-elevated">
                                <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--gray-200)' }}>
                                    {editAdv ? '✏️ Edit Advocate' : '➕ Add Advocate'}
                                </h2>
                                <form id="advocate-form" onSubmit={submitAdv}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                                        <Field label="Full Name" id="adv-name" value={advForm.name} onChange={e => setAdvForm(p => ({ ...p, name: e.target.value }))} required placeholder="Advocate name" />
                                        <Field label="Bar Council ID" id="adv-bar" value={advForm.bar_council_id} onChange={e => setAdvForm(p => ({ ...p, bar_council_id: e.target.value }))} required placeholder="e.g. KAR/1234/2015" />
                                        <Field label="Email" id="adv-email" value={advForm.email} onChange={e => setAdvForm(p => ({ ...p, email: e.target.value }))} required type="email" placeholder="advocate@email.com" />
                                        <Field label="Mobile No" id="adv-mobile" value={advForm.mobile_no} onChange={e => setAdvForm(p => ({ ...p, mobile_no: e.target.value }))} placeholder="+91-XXXXX-XXXXX" />
                                        <Select label="Specialization" id="adv-spec" value={advForm.specialization} onChange={e => setAdvForm(p => ({ ...p, specialization: e.target.value }))} options={SPECIALIZATIONS} required />
                                        <Field label="Experience (yrs)" id="adv-exp" value={advForm.experience} onChange={e => setAdvForm(p => ({ ...p, experience: e.target.value }))} type="number" placeholder="e.g. 10" />
                                        <Field label="City" id="adv-city" value={advForm.city} onChange={e => setAdvForm(p => ({ ...p, city: e.target.value }))} placeholder="e.g. Chennai" />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        {editAdv && (
                                            <button type="button" className="btn btn-ghost"
                                                onClick={() => { setEditAdv(null); setAdvForm(EMPTY_ADV); }}>
                                                Cancel
                                            </button>
                                        )}
                                        <button id="adv-submit-btn" type="submit" className="btn btn-primary" disabled={busy}>
                                            {busy ? <><span className="spinner" /> Saving...</> : editAdv ? '💾 Update Advocate' : '➕ Add Advocate'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Table */}
                            <div className="card card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-200)' }}>
                                    <h3 style={{ fontWeight: 700 }}>⚖️ All Advocates ({advocates.length})</h3>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                {['Name', 'Bar Council ID', 'Specialization', 'City', 'Exp', 'Email', 'Actions'].map(h => (
                                                    <th key={h} style={thStyle}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {advocates.map(a => (
                                                <tr key={a._id}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-100)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = ''}
                                                    style={{ transition: 'background 0.15s' }}>
                                                    <td style={{ ...tdStyle, fontWeight: 600 }}>{a.name}</td>
                                                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--gray-600)' }}>{a.bar_council_id}</td>
                                                    <td style={tdStyle}>{a.specialization}</td>
                                                    <td style={tdStyle}>{a.city || '—'}</td>
                                                    <td style={tdStyle}>{a.experience || 0} yrs</td>
                                                    <td style={{ ...tdStyle, color: 'var(--gray-500)' }}>{a.email}</td>
                                                    <td style={tdStyle}>
                                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                            <button className="btn btn-outline btn-sm" onClick={() => startEditAdv(a)}>✏️ Edit</button>
                                                            <button className="btn btn-sm" onClick={() => deleteAdv(a._id)}
                                                                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                                                                🗑️ Del
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {advocates.length === 0 && (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>
                                            No advocates found. Add one above.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── CASES ── */}
                    {tab === 'cases' && (
                        <div className="animate-fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
                            {/* Add / Edit form */}
                            <div className="card card-elevated">
                                <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--gray-200)' }}>
                                    {editCase ? '✏️ Edit Case' : '➕ Add Case'}
                                </h2>
                                <form id="case-form" onSubmit={submitCase}>
                                    {/* CNR notice */}
                                    <div className="alert alert-info" style={{ fontSize: '0.78rem', marginBottom: '1rem' }}>
                                        🔗 Cases with a <strong>CNR Number</strong> become instantly searchable in the user-facing <strong>Case Tracker</strong>.
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                                        {/* CNR — full width highlighted */}
                                        <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                                            <label className="form-label" htmlFor="case-cnr">CNR Number (links to Case Tracker)</label>
                                            <input
                                                id="case-cnr"
                                                type="text"
                                                className="form-input"
                                                placeholder="e.g. MHCC010012345  (leave blank if not applicable)"
                                                value={caseForm.cnr_no}
                                                onChange={e => setCaseForm(p => ({ ...p, cnr_no: e.target.value.toUpperCase() }))}
                                                style={{ fontFamily: 'monospace', letterSpacing: '0.06em', textTransform: 'uppercase' }}
                                            />
                                        </div>
                                        <Field label="Case Title" id="case-title" value={caseForm.case_title} onChange={e => setCaseForm(p => ({ ...p, case_title: e.target.value }))} required placeholder="e.g. State vs John" />
                                        <Field label="Client Name" id="case-client" value={caseForm.client_name} onChange={e => setCaseForm(p => ({ ...p, client_name: e.target.value }))} required placeholder="Client full name" />
                                        <Field label="Petitioner" id="case-pet" value={caseForm.petitioner} onChange={e => setCaseForm(p => ({ ...p, petitioner: e.target.value }))} placeholder="Petitioner name" />
                                        <Field label="Respondent" id="case-res" value={caseForm.respondent} onChange={e => setCaseForm(p => ({ ...p, respondent: e.target.value }))} placeholder="Respondent name" />
                                        <Select label="Case Type" id="case-type" value={caseForm.case_type} onChange={e => setCaseForm(p => ({ ...p, case_type: e.target.value }))} options={CASE_TYPES} required />
                                        <Field label="Court Name" id="case-court" value={caseForm.court_name} onChange={e => setCaseForm(p => ({ ...p, court_name: e.target.value }))} required placeholder="e.g. High Court of Madras" />
                                        <Field label="Judge Name" id="case-judge" value={caseForm.judge_name} onChange={e => setCaseForm(p => ({ ...p, judge_name: e.target.value }))} placeholder="Hon. Justice ..." />
                                        <Field label="Next Hearing" id="case-hearing" value={caseForm.next_hearing} onChange={e => setCaseForm(p => ({ ...p, next_hearing: e.target.value }))} type="date" />
                                        <Field label="Filing Date" id="case-filing" value={caseForm.filing_date} onChange={e => setCaseForm(p => ({ ...p, filing_date: e.target.value }))} type="date" />
                                        <Select label="Status" id="case-status" value={caseForm.status} onChange={e => setCaseForm(p => ({ ...p, status: e.target.value }))} options={STATUSES} required />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        {editCase && (
                                            <button type="button" className="btn btn-ghost"
                                                onClick={() => { setEditCase(null); setCaseForm(EMPTY_CASE); }}>
                                                Cancel
                                            </button>
                                        )}
                                        <button id="case-submit-btn" type="submit" className="btn btn-primary" disabled={busy}>
                                            {busy ? <><span className="spinner" /> Saving...</> : editCase ? '💾 Update Case' : '➕ Add Case'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Table */}
                            <div className="card card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-200)' }}>
                                    <h3 style={{ fontWeight: 700 }}>📁 All Cases ({cases.length})</h3>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                {['CNR', 'Case Title', 'Client', 'Type', 'Court', 'Next Hearing', 'Status', 'Actions'].map(h => (
                                                    <th key={h} style={thStyle}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cases.map(c => (
                                                <tr key={c._id}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-100)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = ''}
                                                    style={{ transition: 'background 0.15s' }}>
                                                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.78rem', color: c.cnr_no ? 'var(--black)' : 'var(--gray-400)', fontWeight: c.cnr_no ? 700 : 400 }}>
                                                        {c.cnr_no || '—'}
                                                    </td>
                                                    <td style={{ ...tdStyle, fontWeight: 600 }}>{c.case_title}</td>
                                                    <td style={tdStyle}>{c.client_name}</td>
                                                    <td style={tdStyle}>{c.case_type}</td>
                                                    <td style={{ ...tdStyle, color: 'var(--gray-500)' }}>{c.court_name}</td>
                                                    <td style={{ ...tdStyle, fontSize: '0.8rem' }}>{c.next_hearing ? new Date(c.next_hearing).toLocaleDateString('en-IN') : '—'}</td>
                                                    <td style={tdStyle}><StatusBadge status={c.status} /></td>
                                                    <td style={tdStyle}>
                                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                            <button className="btn btn-outline btn-sm" onClick={() => startEditCase(c)}>✏️ Edit</button>
                                                            <button className="btn btn-sm" onClick={() => deleteCase(c._id)}
                                                                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                                                                🗑️ Del
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {cases.length === 0 && (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>
                                            No cases found. Add one above.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
