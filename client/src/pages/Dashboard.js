import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import T from '../context/translations';
import GridBox from '../components/GridBox';

const AuthGateModal = ({ targetPath, onClose }) => {
    const navigate = useNavigate();
    const { lang } = useLanguage();
    const t = T[lang];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal animate-slide-up" onClick={e => e.stopPropagation()}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚖️</div>
                    <h2 className="modal-title">{t.modal_login_required}</h2>
                    <p className="modal-subtitle">{t.modal_login_msg}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button id="modal-user-login" className="btn btn-primary btn-lg"
                        onClick={() => { onClose(); navigate(`/login?type=user&redirect=${targetPath}`); }}>
                        {t.modal_sign_in}
                    </button>
                </div>
                <button className="btn btn-ghost w-full" style={{ marginTop: '0.75rem' }} onClick={onClose}>{t.cancel}</button>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { isAuthenticated } = useAuth();
    const { lang } = useLanguage();
    const t = T[lang];
    const navigate = useNavigate();
    const [modal, setModal] = useState(null);

    const handleBoxClick = (path, isMarketplace = false) => {
        if (!isAuthenticated()) {
            if (isMarketplace) navigate(`/login?type=user&redirect=${path}`);
            else setModal(path);
        } else {
            navigate(path);
        }
    };

    return (
        <div className="animate-fade-in">
            {modal && <AuthGateModal targetPath={modal} onClose={() => setModal(null)} />}

            <div style={{ textAlign: 'center', padding: '3rem 1rem 2.5rem', borderBottom: '1px solid var(--gray-200)', marginBottom: '2.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.15em', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                    {t.dash_tag}
                </div>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '700', letterSpacing: '-0.03em', marginBottom: '1rem' }}>
                    {t.dash_hero}
                </h1>
                <p style={{ color: 'var(--gray-500)', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
                    {t.dash_desc}
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}>
                <GridBox id="box-petition" icon="✍️" title={t.dash_box_petition_title} description={t.dash_box_petition_desc} onClick={() => handleBoxClick('/petition')} />
                <GridBox id="box-case-tracker" icon="⚖️" title={t.dash_box_cases_title} description={t.dash_box_cases_desc} onClick={() => handleBoxClick('/case-tracker')} />
                <GridBox id="box-holidays" icon="📅" title={t.dash_box_holidays_title} description={t.dash_box_holidays_desc} onClick={() => handleBoxClick('/holidays')} />
                <GridBox id="box-marketplace" icon="👥" title={t.dash_box_market_title} description={t.dash_box_market_desc} onClick={() => handleBoxClick('/marketplace', true)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '3rem', padding: '2rem', borderTop: '1px solid var(--gray-200)', flexWrap: 'wrap' }}>
                {[
                    { value: '10,000+', label: t.dash_stat_cases },
                    { value: '500+', label: t.dash_stat_advocates },
                    { value: '50,000+', label: t.dash_stat_petitions },
                    { value: '98%', label: t.dash_stat_satisfaction },
                ].map(stat => (
                    <div key={stat.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>{stat.value}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
