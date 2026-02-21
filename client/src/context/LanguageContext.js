import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(() => localStorage.getItem('justexa_lang') || 'en');

    const switchLang = (l) => {
        setLang(l);
        localStorage.setItem('justexa_lang', l);
    };

    return (
        <LanguageContext.Provider value={{ lang, switchLang }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
