import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import T from '../context/translations';

const Sidebar = ({ isOpen, isMobile, setSidebarOpen }) => {
    const { isAdvocate, user, role } = useAuth();
    const { lang } = useLanguage();
    const t = T[lang];
    const navigate = useNavigate();

    const NAV_ITEMS = [
        { path: '/', label: t.nav_dashboard, icon: '⊞', exact: true },
        { path: '/petition', label: t.nav_petition, icon: '✍' },
        { path: '/case-tracker', label: t.nav_cases, icon: '⚖' },
        { path: '/holidays', label: t.nav_calendar, icon: '📅' },
        { path: '/marketplace', label: t.nav_marketplace, icon: '👥', userOnly: true },
        { path: '/inbox', label: 'Inbox', icon: '📥' },
    ];

    const filteredItems = NAV_ITEMS.filter(item => {
        if (item.userOnly && isAdvocate()) return false;
        return true;
    });

    const handleNavClick = () => {
        if (isMobile) setSidebarOpen(false);
    };

    // On mobile: render as overlay drawer
    if (isMobile) {
        if (!isOpen) return null;
        return (
            <>
                {/* Dark backdrop */}
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 150,
                        animation: 'fadeIn 0.2s ease',
                    }}
                />
                {/* Drawer */}
                <aside style={{
                    position: 'fixed',
                    top: 'var(--navbar-height)', left: 0, bottom: 0,
                    width: '260px',
                    background: 'var(--white)',
                    borderRight: '1px solid var(--gray-200)',
                    display: 'flex', flexDirection: 'column',
                    zIndex: 200,
                    boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
                    animation: 'slideInLeft 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                    <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
                        {filteredItems.map(item => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.exact}
                                onClick={handleNavClick}
                                style={({ isActive }) => ({
                                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                                    padding: '0.875rem 1.25rem',
                                    color: isActive ? 'var(--black)' : 'var(--gray-500)',
                                    background: isActive ? 'var(--gray-100)' : 'transparent',
                                    borderRight: isActive ? '3px solid var(--black)' : '3px solid transparent',
                                    textDecoration: 'none', transition: 'all 0.2s ease',
                                    fontSize: '0.9rem', fontWeight: isActive ? '600' : '500',
                                })}
                            >
                                <span style={{ fontSize: '1.3rem', minWidth: '24px', textAlign: 'center' }}>{item.icon}</span>
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                    {/* Profile section */}
                    <div style={{
                        borderTop: '1px solid var(--gray-200)', padding: '1rem',
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        cursor: 'pointer',
                    }}
                        onClick={() => { navigate('/profile'); setSidebarOpen(false); }}
                    >
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'var(--black)', color: 'var(--white)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.9rem', fontWeight: '700', flexShrink: 0,
                        }}>
                            {user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--black)' }}>{user?.name || 'User'}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', textTransform: 'capitalize' }}>{role || 'Guest'}</div>
                        </div>
                    </div>
                </aside>
            </>
        );
    }

    // Desktop: original collapsible sidebar
    return (
        <aside style={{
            position: 'fixed', top: 'var(--navbar-height)', left: 0, bottom: 0,
            width: isOpen ? 'var(--sidebar-width)' : '60px',
            background: 'var(--white)', borderRight: '1px solid var(--gray-200)',
            display: 'flex', flexDirection: 'column',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden', zIndex: 50,
        }}>
            <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto', overflowX: 'hidden' }}>
                {filteredItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.exact}
                        id={`sidebar-${item.path.replace('/', '') || 'home'}`}
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: '0.875rem',
                            padding: '0.75rem 1.25rem',
                            color: isActive ? 'var(--black)' : 'var(--gray-500)',
                            background: isActive ? 'var(--gray-100)' : 'transparent',
                            borderRight: isActive ? '3px solid var(--black)' : '3px solid transparent',
                            textDecoration: 'none', transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap', fontSize: '0.875rem',
                            fontWeight: isActive ? '600' : '500',
                        })}
                    >
                        {() => (
                            <>
                                <span style={{ fontSize: '1.2rem', minWidth: '24px', textAlign: 'center', flexShrink: 0 }}>
                                    {item.icon}
                                </span>
                                <span style={{ opacity: isOpen ? 1 : 0, transition: 'opacity 0.2s ease', overflow: 'hidden' }}>
                                    {item.label}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Profile section at bottom */}
            <div style={{
                borderTop: '1px solid var(--gray-200)', padding: '1rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                cursor: 'pointer', transition: 'background 0.2s ease',
            }}
                onClick={() => navigate('/profile')}
                id="sidebar-profile"
                title="View Profile"
            >
                <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'var(--black)', color: 'var(--white)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.9rem', fontWeight: '700', flexShrink: 0,
                }}>
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                {isOpen && (
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--black)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.name || 'User'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', textTransform: 'capitalize' }}>
                            {role || 'Guest'}
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
