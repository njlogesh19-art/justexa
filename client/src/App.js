import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
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
import AdminLogin, { isAdminLoggedIn } from './pages/AdminLogin';
import AdvocateSignup from './pages/AdvocateSignup';
import AdvocateLogin from './pages/AdvocateLogin';
import AdvocateDashboard from './pages/AdvocateDashboard';
import Messages from './pages/Messages';
import Inbox from './pages/Inbox';

// Hook to detect mobile screens
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return isMobile;
};

// Protected route wrapper
const ProtectedRoute = ({ children, requireUser = false }) => {
    const { isAuthenticated, isAdvocate, isLoading } = useAuth();
    if (isLoading) return <div className="flex items-center justify-center" style={{ height: '100vh' }}><div className="spinner spinner-lg"></div></div>;
    if (!isAuthenticated()) return <Navigate to="/login" replace />;
    if (requireUser && isAdvocate()) return <Navigate to="/" replace />;
    return children;
};

// Routes advocates to their home and users/guests to the public home
const DashboardRouter = () => {
    const { isAuthenticated, isAdvocate, isLoading } = useAuth();
    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner spinner-lg" /></div>;
    if (isAuthenticated() && isAdvocate()) return <AdvocateDashboard />;
    return <Dashboard />;
};

// Auto-close sidebar on route change on mobile
const SidebarCloser = ({ isMobile, setSidebarOpen }) => {
    const location = useLocation();
    useEffect(() => {
        if (isMobile) setSidebarOpen(false);
    }, [location.pathname, isMobile, setSidebarOpen]);
    return null;
};

const AppLayout = () => {
    const isMobile = useIsMobile();
    const [sidebarOpen, setSidebarOpen] = useState(() => !isMobile);
    const { isAuthenticated } = useAuth();

    return (
        <div className="app-layout">
            <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={isMobile} />
            <div className="main-content">
                <SidebarCloser isMobile={isMobile} setSidebarOpen={setSidebarOpen} />
                {isAuthenticated() && <Sidebar isOpen={sidebarOpen} isMobile={isMobile} setSidebarOpen={setSidebarOpen} />}
                <main className={`page-content ${!sidebarOpen ? 'sidebar-collapsed' : ''} ${!isAuthenticated() ? 'no-sidebar' : ''} ${isMobile ? 'mobile' : ''}`}
                    style={!isAuthenticated() || isMobile ? { marginLeft: 0 } : {}}>
                    <Routes>
                        <Route path="/" element={<DashboardRouter />} />
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
                        <Route path="/advocate/login" element={<AdvocateLogin />} />
                        <Route path="/advocate/signup" element={<AdvocateSignup />} />
                        <Route path="/messages/:advocateId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                        <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route path="/admin" element={isAdminLoggedIn() ? <AdminDashboard /> : <Navigate to="/admin/login" replace />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
            </div>
            {isAuthenticated() && isMobile && <BottomNav />}
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

