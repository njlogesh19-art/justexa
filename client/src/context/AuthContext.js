import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        user: null,
        role: null,
        token: null,
        isLoading: true
    });

    // Load from localStorage on mount
    useEffect(() => {
        const token = localStorage.getItem('justexa_token');
        const user = localStorage.getItem('justexa_user');
        const role = localStorage.getItem('justexa_role');
        if (token && user) {
            setAuth({ token, user: JSON.parse(user), role, isLoading: false });
        } else {
            setAuth(prev => ({ ...prev, isLoading: false }));
        }
    }, []);

    const login = (token, user, role) => {
        localStorage.setItem('justexa_token', token);
        localStorage.setItem('justexa_user', JSON.stringify(user));
        localStorage.setItem('justexa_role', role);
        setAuth({ token, user, role, isLoading: false });
    };

    const logout = () => {
        localStorage.removeItem('justexa_token');
        localStorage.removeItem('justexa_user');
        localStorage.removeItem('justexa_role');
        setAuth({ user: null, role: null, token: null, isLoading: false });
    };

    const isAuthenticated = () => !!auth.token;
    const isUser = () => auth.role === 'user';
    const isAdvocate = () => auth.role === 'advocate';

    return (
        <AuthContext.Provider value={{ ...auth, login, logout, isAuthenticated, isUser, isAdvocate }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

export default AuthContext;
