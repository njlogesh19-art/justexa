import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import T from '../context/translations';
import ThemeToggle from './ThemeToggle';

const LAW_QUOTES = {
    en: [
        '"Justice delayed is justice denied." — W.E. Gladstone',
        '"The law is reason, free from passion." — Aristotle',
        '"Injustice anywhere is a threat to justice everywhere." — MLK Jr.',
        '"Equal justice under law." — U.S. Supreme Court',
        '"The good of the people is the greatest law." — Cicero',
    ],
    ta: [
        '"நீதி தாமதமானால் நீதி மறுக்கப்பட்டதுடன் சமம்." — W.E. Gladstone',
        '"சட்டம் என்பது பகுத்தறிவு, உணர்ச்சியிலிருந்து விடுபட்டது." — அரிஸ்டாட்டில்',
        '"எங்கும் அநீதி என்பது எல்லா இடங்களிலும் நீதிக்கு அச்சுறுத்தல்." — MLK Jr.',
        '"சட்டத்தின் கீழ் சம நீதி." — அமெரிக்க உச்ச நீதிமன்றம்',
        '"மக்களின் நலன் மிகப்பெரிய சட்டம்." — சிசரோ',
    ],
};

const ScaleIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="3" x2="12" y2="21" />
        <path d="M3 9l9-6 9 6" />
        <path d="M3 9c0 3.314 2.686 6 6 6s6-2.686 6-6" />
        <path d="M9 9c0 3.314 2.686 6 6 6s6-2.686 6-6" />
        <line x1="3" y1="21" x2="21" y2="21" />
    </svg>
);

const MenuIcon = ({ open }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        {open ? (
            <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
            </>
        ) : (
            <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
            </>
        )}
    </svg>
);

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
    const { isAuthenticated, user } = useAuth();
    const { lang, switchLang } = useLanguage();
    const t = T[lang];

    const quotes = LAW_QUOTES[lang];
    const [quoteIdx, setQuoteIdx] = useState(0);
    const [quoteVisible, setQuoteVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setQuoteVisible(false);
            setTimeout(() => {
                setQuoteIdx(prev => (prev + 1) % quotes.length);
                setQuoteVisible(true);
            }, 400);
        }, 4000);
        return () => clearInterval(interval);
    }, [quotes.length]);

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            height: 'var(--navbar-height)',
            background: 'var(--white)',
            borderBottom: '1px solid var(--gray-200)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem', zIndex: 100,
            boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
        }}>
            {/* Left: Hamburger + Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {isAuthenticated() && (
                    <button
                        id="sidebar-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="btn btn-ghost"
                        style={{ padding: '0.5rem', borderRadius: '8px' }}
                        aria-label="Toggle sidebar"
                    >
                        <MenuIcon open={sidebarOpen} />
                    </button>
                )}
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
                    <div style={{ color: 'var(--black)' }}><ScaleIcon /></div>
                    <div>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: '700', color: 'var(--black)', lineHeight: 1 }}>
                            Justexa
                        </div>
                        <div style={{
                            fontSize: '0.65rem', color: 'var(--gray-500)',
                            maxWidth: '320px', overflow: 'hidden', whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            opacity: quoteVisible ? 1 : 0,
                            transition: 'opacity 0.4s ease', fontStyle: 'italic',
                        }}>
                            {quotes[quoteIdx]}
                        </div>
                    </div>
                </Link>
            </div>

            {/* Right: Language toggle + Theme toggle + Auth buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Language Toggle */}
                <button
                    id="lang-toggle"
                    onClick={() => switchLang(lang === 'en' ? 'ta' : 'en')}
                    title={lang === 'en' ? 'Switch to Tamil' : 'Switch to English'}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.3rem 0.75rem', borderRadius: '100px',
                        border: '1.5px solid var(--gray-200)',
                        background: 'var(--gray-100)',
                        cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
                        color: 'var(--gray-700)', transition: 'all 0.2s',
                        lineHeight: 1.2,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--black)'; e.currentTarget.style.background = 'var(--black)'; e.currentTarget.style.color = 'var(--white)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = 'var(--gray-100)'; e.currentTarget.style.color = 'var(--gray-700)'; }}
                >
                    {lang === 'en' ? '🌐 EN | தமிழ்' : '🌐 தமிழ் | EN'}
                </button>

                {/* Dark / Light Theme Toggle */}
                <ThemeToggle />

                {isAuthenticated() ? (
                    <Link to="/profile" style={{ textDecoration: 'none' }}>
                        <span style={{
                            fontSize: '0.85rem', color: 'var(--gray-600)', fontWeight: 500,
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.35rem 0.75rem', borderRadius: '100px',
                            border: '1px solid var(--gray-200)', cursor: 'pointer',
                        }}>
                            👤 {user?.name}
                        </span>
                    </Link>
                ) : (
                    <>
                        <Link to="/login" id="nav-login-btn">
                            <button className="btn btn-ghost btn-sm">{t.login}</button>
                        </Link>
                        <Link to="/signup" id="nav-signup-btn">
                            <button className="btn btn-primary btn-sm">{t.signup}</button>
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
