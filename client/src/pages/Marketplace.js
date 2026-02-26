import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdvocates, seedAdvocates } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import T from '../context/translations';

const SPECIALIZATIONS = [
    'All', 'Criminal Law', 'Civil Litigation', 'Corporate Law', 'Family Law', 'Property Law',
    'Constitutional Law', 'Intellectual Property (IPR)', 'Taxation Law', 'Labor & Employment Law',
    'Environmental Law', 'Cyber Law', 'Banking & Finance Law', 'Human Rights Law',
    'Real Estate & Property Law', 'Insurance Law', 'Arbitration & Mediation', 'Motor Accident Claims',
    'Maritime Law', 'Consumer Protection'
];

// Price range filter options (min, max, label)
const PRICE_RANGES = [
    { label: 'Any Price', min: null, max: null },
    { label: 'Under ₹3,000', min: null, max: 2999 },
    { label: '₹3,000 – ₹3,500', min: 3000, max: 3500 },
    { label: '₹3,500 – ₹4,000', min: 3501, max: 4000 },
    { label: 'Above ₹4,000', min: 4001, max: null },
];

// Deterministic rating 3.5–5.0 based on bar_council_id string
function advocateRating(str = '') {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
    // 7 steps: 3.5, 3.8, 4.0, 4.2, 4.5, 4.7, 5.0
    const steps = [3.5, 3.8, 4.0, 4.2, 4.5, 4.7, 5.0];
    return steps[Math.abs(hash) % steps.length];
}

const AdvocateCard = ({ advocate }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const fee = advocate.consultation_fee;
    const rating = advocateRating(advocate.bar_council_id || advocate.email);

    return (
        <div
            className="card card-elevated"
            onClick={() => navigate(`/marketplace/${advocate._id}`)}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
        >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                    width: '52px', height: '52px', borderRadius: '50%',
                    background: 'var(--black)', color: 'var(--white)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', fontWeight: '700', flexShrink: 0
                }}>
                    {advocate.name?.charAt(0)?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem' }}>{advocate.name}</div>
                    <span className="badge badge-light" style={{ fontSize: '0.72rem' }}>{advocate.specialization}</span>
                </div>
            </div>

            {/* 4-column stat grid: Experience · City · Rating · Fee */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem' }}>
                <div style={{ padding: '0.5rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Exp</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '600', marginTop: '0.1rem' }}>{advocate.experience || advocate.experience_years} yrs</div>
                </div>
                <div style={{ padding: '0.5rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>City</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '600', marginTop: '0.1rem' }}>{advocate.city || '—'}</div>
                </div>
                <div style={{ padding: '0.5rem', background: '#fffbeb', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '700', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rating</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '700', marginTop: '0.1rem', color: '#b45309' }}>⭐ {rating}</div>
                </div>
                <div style={{ padding: '0.5rem', background: '#f0fdf4', borderRadius: 'var(--radius-sm)', border: '1px solid #86efac' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '700', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fee</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '800', marginTop: '0.1rem', color: '#15803d' }}>
                        {fee ? `₹${fee.toLocaleString('en-IN')}` : '—'}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                    id={`view-profile-${advocate._id}`}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={e => { e.stopPropagation(); navigate(`/marketplace/${advocate._id}`); }}
                >
                    View Profile →
                </button>
                {user && user.role !== 'advocate' && (
                    <button
                        id={`message-btn-${advocate._id}`}
                        className="btn btn-outline"
                        title={`Message ${advocate.name}`}
                        onClick={e => { e.stopPropagation(); navigate(`/messages/${advocate._id}`); }}
                        style={{ flexShrink: 0, padding: '0.5rem 0.85rem', fontSize: '1.1rem' }}
                    >
                        💬
                    </button>
                )}
            </div>
        </div>
    );
};

const Marketplace = () => {
    const { lang } = useLanguage();
    const t = T[lang];
    const [advocates, setAdvocates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [priceRange, setPriceRange] = useState(PRICE_RANGES[0]); // "Any Price"

    const fetchAdvocates = useCallback(async (spec = '', priceOpt = PRICE_RANGES[0]) => {
        setLoading(true);
        setError('');
        try {
            const res = await getAdvocates(
                spec === 'All' ? '' : spec,
                priceOpt.min,
                priceOpt.max
            );
            setAdvocates(res.data.advocates);
        } catch (err) {
            if (err.response?.status === 403) {
                setError('Advocates are not permitted to access the Marketplace.');
            } else {
                setError(err.response?.data?.message || 'Failed to load advocates.');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // On mount: seed advocate data (upserts fees) then fetch
    useEffect(() => {
        const seedThenFetch = async () => {
            try { await seedAdvocates(); } catch (_) { /* seed may fail if already up to date */ }
            fetchAdvocates();
        };
        seedThenFetch();
    }, [fetchAdvocates]);


    const handleFilterClick = (spec) => {
        setActiveFilter(spec);
        setSearch('');
        fetchAdvocates(spec, priceRange);
    };

    const handlePriceChange = (e) => {
        const selected = PRICE_RANGES[parseInt(e.target.value)];
        setPriceRange(selected);
        fetchAdvocates(activeFilter, selected);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchAdvocates(search, priceRange);
        setActiveFilter('');
    };

    const filteredAdvocates = advocates.filter(a =>
        !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.specialization.toLowerCase().includes(search.toLowerCase()) ||
        (a.city || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>{t.market_title}</h1>
                <p>{t.market_subtitle}</p>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <input
                    id="marketplace-search"
                    type="text"
                    className="form-input"
                    placeholder={t.market_search}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ flex: 1 }}
                />
                <button id="marketplace-search-btn" type="submit" className="btn btn-primary">🔍 Search</button>
            </form>

            {/* Specialization + Fee Range filter pills — same style */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {SPECIALIZATIONS.map(spec => (
                    <button
                        key={spec}
                        id={`filter-${spec.toLowerCase().replace(/[\s&()/]+/g, '-')}`}
                        className={`btn btn-sm ${activeFilter === spec ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handleFilterClick(spec)}
                        style={{ borderRadius: '100px' }}
                    >
                        {spec}
                    </button>
                ))}
            </div>

            {/* Fee Range filter pills */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--gray-500)', marginRight: '0.25rem' }}>💰 Fee:</span>
                {PRICE_RANGES.map((range, idx) => (
                    <button
                        key={range.label}
                        id={`fee-filter-${idx}`}
                        className={`btn btn-sm ${priceRange.label === range.label ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handlePriceChange({ target: { value: String(idx) } })}
                        style={{ borderRadius: '100px' }}
                    >
                        {range.label}
                    </button>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                    {error}
                    {advocates.length === 0 && !error.includes('Advocates are not') && (
                        <button
                            className="btn btn-sm btn-outline"
                            style={{ marginLeft: '1rem' }}
                            onClick={async () => {
                                try {
                                    const { seedAdvocates } = await import('../utils/api');
                                    await seedAdvocates();
                                    fetchAdvocates();
                                } catch (e) { }
                            }}
                        >Seed Data</button>
                    )}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <div className="spinner spinner-lg"></div>
                </div>
            )}

            {/* Results count + active price filter tag */}
            {!loading && !error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <span>Showing {filteredAdvocates.length} advocate{filteredAdvocates.length !== 1 ? 's' : ''}
                        {activeFilter && activeFilter !== 'All' ? ` in ${activeFilter}` : ''}
                    </span>
                    {priceRange.label !== 'Any Price' && (
                        <span style={{
                            background: '#ecfdf5', color: '#065f46', border: '1px solid #6ee7b7',
                            borderRadius: '100px', padding: '0.15rem 0.6rem', fontSize: '0.75rem', fontWeight: '600'
                        }}>
                            💰 {priceRange.label}
                            <button
                                onClick={() => { setPriceRange(PRICE_RANGES[0]); fetchAdvocates(activeFilter, PRICE_RANGES[0]); }}
                                style={{ marginLeft: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: '#065f46', fontWeight: '700', fontSize: '0.8rem', padding: 0 }}
                            >✕</button>
                        </span>
                    )}
                </div>
            )}

            {/* Advocate cards grid */}
            {!loading && !error && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.25rem' }}>
                    {filteredAdvocates.map(advocate => (
                        <AdvocateCard key={advocate._id} advocate={advocate} />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && !error && filteredAdvocates.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                    <p>No advocates found. Try a different specialization, price range, or search term.</p>
                    <button
                        className="btn btn-outline"
                        style={{ marginTop: '1rem' }}
                        onClick={async () => {
                            try {
                                const { seedAdvocates } = await import('../utils/api');
                                await seedAdvocates();
                                fetchAdvocates();
                            } catch (e) { }
                        }}
                    >
                        Load Advocate Data
                    </button>
                </div>
            )}
        </div>
    );
};

export default Marketplace;
