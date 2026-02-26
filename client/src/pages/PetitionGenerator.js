import React, { useState, useEffect } from 'react';
import { generatePetition, getPetitionHistory } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import T from '../context/translations';

// ── Tamil keyword detection ────────────────────────────────────────────────────
// Returns true if the description text contains Tamil script OR explicit keywords
const isTamilRequest = (text) => {
    if (!text) return false;
    // Tamil Unicode range: U+0B80–U+0BFF
    if (/[\u0B80-\u0BFF]/.test(text)) return true;
    // English keywords asking for Tamil output
    const lower = text.toLowerCase();
    return /\btamil\b/.test(lower) || /\bதமிழ்\b/.test(text);
};

// ── Main Component ─────────────────────────────────────────────────────────────
const PetitionGenerator = () => {
    const { lang } = useLanguage();
    const t = T[lang];

    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('generate');

    // ── Determine petition language ───────────────────────────────────────────
    // Priority: keyword in description > UI language
    const wantsTamil = lang === 'ta' || isTamilRequest(input);
    const petitionLang = wantsTamil ? 'ta-IN' : 'en-IN';

    // ── History ───────────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await getPetitionHistory();
                setHistory(res.data.petitions || []);
            } catch { /* optional */ } finally { setHistoryLoading(false); }
        };
        fetchHistory();
    }, [output]);

    // ── Generate ──────────────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!input.trim()) { setError(t.petition_please_desc); return; }
        setLoading(true); setError(''); setOutput('');
        try {
            const res = await generatePetition(input.trim(), petitionLang);
            setOutput(res.data.petition);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate petition. Please try again.');
        } finally { setLoading(false); }
    };

    const handleCopy = () => navigator.clipboard.writeText(output);
    const handlePrint = () => {
        const w = window.open('', '_blank');
        w.document.write(`<html><head><title>Petition - Justexa</title><style>body{font-family:monospace;padding:2rem;white-space:pre-wrap;font-size:13px;line-height:1.8;max-width:800px;margin:0 auto}</style></head><body>${output.replace(/\n/g, '<br/>')}</body></html>`);
        w.print();
    };

    const clearInput = () => { setInput(''); setError(''); };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>{t.petition_title}</h1>
                <p>{t.petition_subtitle}</p>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: '1.5rem' }}>
                <button id="tab-generate" className={`tab ${activeTab === 'generate' ? 'tab-active' : ''}`} onClick={() => setActiveTab('generate')}>
                    {t.petition_tab_generate}
                </button>
                <button id="tab-history" className={`tab ${activeTab === 'history' ? 'tab-active' : ''}`} onClick={() => setActiveTab('history')}>
                    {t.petition_tab_history} {history.length > 0 && <span className="badge badge-dark" style={{ marginLeft: '0.4rem', fontSize: '0.65rem' }}>{history.length}</span>}
                </button>
            </div>

            {activeTab === 'generate' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))', gap: '1.5rem' }}>

                    {/* ── Input Panel ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>

                            {/* Header row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--gray-700)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {t.petition_label_input}
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{t.petition_chars.replace('{n}', input.length)}</span>
                                    {input && (
                                        <button type="button" onClick={clearInput} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: '0.8rem', padding: '0 0.2rem' }}>
                                            {t.petition_clear}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Tamil auto-detect notice */}
                            {wantsTamil && (
                                <div style={{ fontSize: '0.78rem', color: '#92400e', padding: '0.45rem 0.75rem', borderRadius: 6, background: '#fef9c3', border: '1px solid #fde68a', display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    🇮🇳 <strong>தமிழ்</strong> — மனு தமிழிலும் உருவாக்கப்படும்
                                    <span style={{ color: 'var(--gray-500)', fontWeight: 400 }}>(Petition will be generated in Tamil)</span>
                                </div>
                            )}

                            {/* Textarea */}
                            <textarea
                                id="petition-input"
                                value={input}
                                onChange={e => { setInput(e.target.value); setError(''); }}
                                placeholder={t.petition_placeholder}
                                style={{
                                    flex: 1, resize: 'vertical',
                                    minHeight: '200px',
                                    border: '2px solid var(--gray-200)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '1rem', fontSize: '0.9rem', lineHeight: 1.7,
                                    outline: 'none', fontFamily: 'var(--font-sans)',
                                    transition: 'border-color 0.2s ease',
                                    color: 'var(--black)', background: 'var(--white)'
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--black)'}
                                onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
                            />
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}
                        <button id="generate-petition" className="btn btn-primary btn-lg" onClick={handleGenerate} disabled={loading}>
                            {loading ? <><span className="spinner"></span> {t.petition_generating}</> : t.petition_generate_btn}
                        </button>
                        <div className="alert alert-info" style={{ fontSize: '0.78rem' }}>
                            {t.petition_powered}
                        </div>
                    </div>

                    {/* ── Output Panel ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--gray-700)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {t.petition_output_label}
                                    </label>
                                    {output && wantsTamil && (
                                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#92400e', background: '#fef3c7', border: '1px solid #fde68a', padding: '0.1rem 0.5rem', borderRadius: '100px' }}>
                                            🇮🇳 தமிழ்
                                        </span>
                                    )}
                                </div>
                                {output && (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button id="copy-petition" className="btn btn-ghost btn-sm" onClick={handleCopy}>{t.petition_copy}</button>
                                        <button id="print-petition" className="btn btn-outline btn-sm" onClick={handlePrint}>{t.petition_print}</button>
                                    </div>
                                )}
                            </div>
                            <div style={{
                                flex: 1, overflowY: 'auto',
                                fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.8,
                                whiteSpace: 'pre-wrap',
                                color: output ? 'var(--black)' : 'var(--gray-400)',
                                background: output ? 'var(--gray-100)' : 'transparent',
                                borderRadius: 'var(--radius-sm)',
                                padding: output ? '1rem' : '0',
                                border: output ? '1px solid var(--gray-200)' : 'none'
                            }}>
                                {loading ? t.petition_ai_generating : output || t.petition_output_placeholder}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* History tab */}
            {activeTab === 'history' && (
                <div>
                    {historyLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner spinner-lg" /></div>
                    ) : history.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                            <p>{t.petition_no_history}</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '700px' }}>
                            {history.map((p, i) => (
                                <div key={p._id || i} className="card" style={{ padding: '1rem 1.25rem', cursor: 'pointer' }} onClick={() => { setInput(p.description); setActiveTab('generate'); }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginBottom: '0.4rem' }}>
                                        {new Date(p.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--black)', lineHeight: 1.5 }}>
                                        {p.description.length > 120 ? p.description.slice(0, 120) + '...' : p.description}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: '0.4rem' }}>{t.petition_re_generate}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PetitionGenerator;
