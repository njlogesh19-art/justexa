import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import T from '../context/translations';

const BottomNav = () => {
    const { isAdvocate } = useAuth();
    const { lang } = useLanguage();
    const t = T[lang];

    const items = [
        { path: '/', label: t.nav_dashboard || 'Home', icon: '⊞', exact: true },
        { path: '/case-tracker', label: t.nav_cases || 'Cases', icon: '⚖' },
        { path: '/petition', label: t.nav_petition || 'Petition', icon: '✍' },
        { path: '/inbox', label: 'Inbox', icon: '📥' },
        { path: '/profile', label: 'Profile', icon: '👤' },
    ].filter(item => {
        if (item.path === '/marketplace' && isAdvocate()) return false;
        return true;
    });

    return (
        <nav style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            height: 'var(--bottom-nav-height, 60px)',
            background: 'var(--white)',
            borderTop: '1px solid var(--gray-200)',
            display: 'flex',
            alignItems: 'stretch',
            zIndex: 200,
            boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
        }}>
            {items.map(item => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    style={({ isActive }) => ({
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        textDecoration: 'none',
                        color: isActive ? 'var(--black)' : 'var(--gray-400)',
                        borderTop: isActive ? '2px solid var(--black)' : '2px solid transparent',
                        transition: 'all 0.2s ease',
                        background: 'none',
                        padding: '0.25rem 0',
                    })}
                >
                    <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{item.icon}</span>
                    <span style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.03em' }}>
                        {item.label}
                    </span>
                </NavLink>
            ))}
        </nav>
    );
};

export default BottomNav;
