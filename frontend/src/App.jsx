import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Components
import Navbar from './components/Navbar';
// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgetPasswordPage from './pages/ForgetPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AboutUsPage from './pages/AboutUsPage';
import ContactUsPage from './pages/ContactUsPage';
import ServicesInfoPage from './pages/ServicesInfoPage';
import NotFoundPage from './pages/NotFoundPage';

// Client Pages
import ClientDashboard from './pages/ClientDashboard';
import ClientGaragePage from './pages/ClientGaragePage';
import ClientProfilePage from './pages/ClientProfilePage';
import ClientServiceOrders from './pages/ClientServiceOrders';
import BookServicePage from './pages/BookServicePage';
import BookingDetailPage from './pages/BookingDetailPage';
import RequestTowingPage from './pages/RequestTowingPage';
import ClientTowingOrders from './pages/ClientTowingOrders';
import TowingDetailPage from './pages/TowingDetailPage';


// Shop Admin Pages
import ShopDashboard from './pages/ShopDashboard';
import ShopProfilePage from './pages/ShopProfilePage';
import ShopServiceOrders from './pages/ShopServiceOrders';
import ShopTowingOrders from './pages/ShopTowingOrders';
import ShopMessagesPage from './pages/ShopMessagesPage';
import ShopDayEnd from './pages/ShopDayEnd';

// Super Admin Pages
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminServicesPage from './pages/SuperAdminServicesPage';
import SuperAdminTowingPage from './pages/SuperAdminTowingPage';
import SuperAdminProvidersPage from './pages/SuperAdminProvidersPage';
import SuperAdminAddProviderPage from './pages/SuperAdminAddProviderPage';

// Route Guards
function ProtectedRoute({ children, allowStaff = false, allowSuperAdmin = false }) {
    const { user, loading, isStaff, isSuperAdmin } = useAuth();

    if (loading) {
        return (
            <div className="text-center py-20 text-slate-500">
                <i className="fas fa-spinner fa-spin text-4xl"></i>
                <p className="mt-4 font-semibold">Authenticating session...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowSuperAdmin && !isSuperAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    if (allowStaff && !isStaff && !isSuperAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

function MainApp() {
    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-800">
            <Navbar />
            <div className="flex-1 flex flex-col min-w-0">
                <main className="w-full flex-1 px-4 sm:px-6 lg:px-8 py-8">
                    <Routes>
                        {/* Public General Routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/forget-password" element={<ForgetPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route path="/about" element={<AboutUsPage />} />
                        <Route path="/contact" element={<ContactUsPage />} />
                        <Route path="/services-info" element={<ServicesInfoPage />} />

                        {/* Client Protected Routes */}
                        <Route path="/dashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
                        <Route path="/garage" element={<ProtectedRoute><ClientGaragePage /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><ClientProfilePage /></ProtectedRoute>} />
                        <Route path="/service-orders" element={<ProtectedRoute><ClientServiceOrders /></ProtectedRoute>} />

                        <Route path="/book-service" element={<ProtectedRoute><BookServicePage /></ProtectedRoute>} />
                        <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetailPage /></ProtectedRoute>} />
                        <Route path="/towing-request" element={<ProtectedRoute><RequestTowingPage /></ProtectedRoute>} />
                        <Route path="/towing-orders" element={<ProtectedRoute><ClientTowingOrders /></ProtectedRoute>} />
                        <Route path="/towing/:id" element={<ProtectedRoute><TowingDetailPage /></ProtectedRoute>} />

                        {/* Shop Admin (Staff) Routes */}
                        <Route path="/shop/dashboard" element={<ProtectedRoute allowStaff={true}><ShopDashboard /></ProtectedRoute>} />
                        <Route path="/shop/profile" element={<ProtectedRoute allowStaff={true}><ShopProfilePage /></ProtectedRoute>} />
                        <Route path="/shop/service-orders" element={<ProtectedRoute allowStaff={true}><ShopServiceOrders /></ProtectedRoute>} />
                        <Route path="/shop/towing-orders" element={<ProtectedRoute allowStaff={true}><ShopTowingOrders /></ProtectedRoute>} />
                        <Route path="/shop/messages" element={<ProtectedRoute allowStaff={true}><ShopMessagesPage /></ProtectedRoute>} />
                        <Route path="/shop/day-end" element={<ProtectedRoute allowStaff={true}><ShopDayEnd /></ProtectedRoute>} />

                        {/* Super Admin Routes */}
                        <Route path="/admin/dashboard" element={<ProtectedRoute allowSuperAdmin={true}><SuperAdminDashboard /></ProtectedRoute>} />
                        <Route path="/admin/services" element={<ProtectedRoute allowSuperAdmin={true}><SuperAdminServicesPage /></ProtectedRoute>} />
                        <Route path="/admin/towing" element={<ProtectedRoute allowSuperAdmin={true}><SuperAdminTowingPage /></ProtectedRoute>} />
                        <Route path="/admin/providers" element={<ProtectedRoute allowSuperAdmin={true}><SuperAdminProvidersPage /></ProtectedRoute>} />
                        <Route path="/admin/add-provider" element={<ProtectedRoute allowSuperAdmin={true}><SuperAdminAddProviderPage /></ProtectedRoute>} />

                        {/* Fallback 404 Route */}
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3000,
                    className: 'animate-fade',
                    style: {
                        background: 'rgba(30, 41, 59, 0.85)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        color: '#f8fafc',
                        padding: '14px 20px',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        fontWeight: '600',
                        fontSize: '14px',
                        letterSpacing: '0.025em',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
            <BrowserRouter>
                <MainApp />
            </BrowserRouter>
        </AuthProvider>
    );
}
