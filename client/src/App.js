import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import PetitionGenerator from './pages/PetitionGenerator';
import CaseTracker from './pages/CaseTracker';
import CaseDetail from './pages/CaseDetail';
import HolidayTracker from './pages/HolidayTracker';
import Marketplace from './pages/Marketplace';
import AdvocateProfile from './pages/AdvocateProfile';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import { isAdminLoggedIn } from './pages/AdminLogin';

// Protected route wrapper
const ProtectedRoute = ({ children, requireUser = false }) => {
    const { isAuthenticated, isAdvocate, isLoading } = useAuth();
    if (isLoading) return <div className="flex items-center justify-center" style={{ height: '100vh' }}><div className="spinner spinner-lg"></div></div>;
    if (!isAuthenticated()) return <Navigate to="/login" replace />;
    if (requireUser && isAdvocate()) return <Navigate to="/" replace />;
    return children;
};

const AppLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { isAuthenticated } = useAuth();

    return (
        <div className="app-layout">
            <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="main-content">
                {isAuthenticated() && <Sidebar isOpen={sidebarOpen} />}
                <main className={`page-content ${!sidebarOpen ? 'sidebar-collapsed' : ''} ${!isAuthenticated() ? 'no-sidebar' : ''}`}
                    style={!isAuthenticated() ? { marginLeft: 0 } : {}}>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/petition" element={<ProtectedRoute><PetitionGenerator /></ProtectedRoute>} />
                        <Route path="/case-tracker" element={<ProtectedRoute><CaseTracker /></ProtectedRoute>} />
                        <Route path="/cases/:cnr" element={<ProtectedRoute><CaseDetail /></ProtectedRoute>} />
                        <Route path="/holidays" element={<ProtectedRoute><HolidayTracker /></ProtectedRoute>} />
                        <Route path="/marketplace" element={<ProtectedRoute requireUser><Marketplace /></ProtectedRoute>} />
                        <Route path="/marketplace/:id" element={<ProtectedRoute requireUser><AdvocateProfile /></ProtectedRoute>} />
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route path="/admin" element={isAdminLoggedIn() ? <AdminDashboard /> : <Navigate to="/admin/login" replace />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

function App() {
    return (
        <LanguageProvider>
            <AuthProvider>
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <AppLayout />
                </Router>
            </AuthProvider>
        </LanguageProvider>
    );
}

export default App;
