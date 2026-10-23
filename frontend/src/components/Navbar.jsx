import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, isGuest, isClient, isStaff, isSuperAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setIsLogoutModalOpen(false);
        navigate('/login');
        toast.success('Logged out successfully!');
    };

    const linkClasses = ({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full ${isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`;

    return (
        <>
            <aside className="sticky top-0 left-0 z-50 h-screen w-64 bg-white/95 backdrop-blur-md border-r border-slate-200 flex flex-col p-4 shadow-sm">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 text-xl font-extrabold text-slate-900 flex-shrink-0 mb-8 px-2 mt-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white text-base shadow-sm">
                        <i className="fas fa-car-side"></i>
                    </div>
                    <span>AutoFusion<span className="text-blue-600">Pro</span></span>
                </Link>

                {/* Nav Links based on Role */}
                <div className="flex flex-col gap-2 flex-1 overflow-y-auto w-full pr-1 custom-scrollbar">
                    {/* Guest Links */}
                    {isGuest && (
                        <>
                            <NavLink to="/services-info" className={linkClasses}>
                                <i className="fas fa-wrench w-5 text-center"></i> Solutions
                            </NavLink>
                            <NavLink
                                to="/towing-request"
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:text-red-700 transition-colors w-full"
                            >
                                <div className="relative flex items-center justify-center">
                                    <span className="absolute w-2 h-2 rounded-full bg-red-500 animate-ping -left-1 -top-1"></span>
                                    <i className="fas fa-truck-pickup w-5 text-center"></i>
                                </div>
                                Emergency Towing
                            </NavLink>
                            <NavLink to="/about" className={linkClasses}>
                                <i className="fas fa-building w-5 text-center"></i> Company
                            </NavLink>
                            <NavLink to="/contact" className={linkClasses}>
                                <i className="fas fa-envelope w-5 text-center"></i> Contact
                            </NavLink>
                        </>
                    )}

                    {/* Client Links */}
                    {isClient && (
                        <>
                            <NavLink to="/dashboard" className={linkClasses}>
                                <i className="fas fa-th-large w-5 text-center"></i> Dashboard
                            </NavLink>
                            <NavLink to="/garage" className={linkClasses}>
                                <i className="fas fa-warehouse w-5 text-center text-blue-600"></i> My Garage
                            </NavLink>
                            <NavLink to="/service-orders" className={linkClasses}>
                                <i className="fas fa-tools w-5 text-center"></i> Service Orders
                            </NavLink>
                            <NavLink to="/towing-orders" className={linkClasses}>
                                <i className="fas fa-truck-pickup w-5 text-center"></i> Towing Orders
                            </NavLink>
                            <NavLink to="/services-info" className={linkClasses}>
                                <i className="fas fa-wrench w-5 text-center"></i> Solutions
                            </NavLink>
                            <NavLink
                                to="/towing-request"
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:text-red-700 transition-colors w-full"
                            >
                                <div className="relative flex items-center justify-center">
                                    <span className="absolute w-2 h-2 rounded-full bg-red-500 animate-ping -left-1 -top-1"></span>
                                    <i className="fas fa-truck-pickup w-5 text-center"></i>
                                </div>
                                Emergency Towing
                            </NavLink>
                        </>
                    )}


                    {/* Shop Admin (Staff) Links */}
                    {isStaff && (
                        <>
                            <NavLink to="/shop/dashboard" className={linkClasses}>
                                <i className="fas fa-chart-line w-5 text-center"></i> Shop Dashboard
                            </NavLink>
                            <NavLink to="/shop/service-orders" className={linkClasses}>
                                <i className="fas fa-clipboard-list w-5 text-center"></i> Service Orders
                            </NavLink>
                            <NavLink to="/shop/towing-orders" className={linkClasses}>
                                <i className="fas fa-truck-monster w-5 text-center"></i> Towing Requests
                            </NavLink>
                            <NavLink to="/shop/messages" className={linkClasses}>
                                <i className="fas fa-inbox w-5 text-center"></i> Messages Inbox
                            </NavLink>
                            <NavLink to="/shop/day-end" className={linkClasses}>
                                <i className="fas fa-calendar-check w-5 text-center"></i> Day-End Closing
                            </NavLink>
                            <NavLink to="/shop/profile" className={linkClasses}>
                                <i className="fas fa-store w-5 text-center"></i> Shop Profile
                            </NavLink>
                        </>
                    )}

                    {/* Super Admin Links */}
                    {isSuperAdmin && (
                        <>
                            <NavLink to="/admin/dashboard" className={linkClasses}>
                                <i className="fas fa-user-shield w-5 text-center"></i> Admin Panel
                            </NavLink>
                            <NavLink to="/admin/services" className={linkClasses}>
                                <i className="fas fa-tasks w-5 text-center"></i> All Services
                            </NavLink>
                            <NavLink to="/admin/towing" className={linkClasses}>
                                <i className="fas fa-truck-pickup w-5 text-center"></i> All Towing
                            </NavLink>
                            <NavLink to="/admin/providers" className={linkClasses}>
                                <i className="fas fa-store-alt w-5 text-center"></i> Providers
                            </NavLink>
                            <NavLink to="/admin/add-provider" className={linkClasses}>
                                <i className="fas fa-plus-circle w-5 text-center"></i> Add Provider
                            </NavLink>
                        </>
                    )}
                </div>

                {/* Bottom Auth Actions */}
                <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-slate-100 flex-shrink-0">
                    {user ? (
                        <>
                            {isClient && (
                                <Link
                                    to="/dashboard"
                                    className="flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors w-full"
                                >
                                    <i className="fas fa-chart-bar"></i> Dashboard
                                </Link>
                            )}

                            {/* Modern User Profile Chip */}
                            <Link
                                to={isSuperAdmin ? '/admin/dashboard' : isStaff ? '/shop/profile' : '/profile'}
                                className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm w-full"
                                title="Go to Profile"
                            >
                                <div className={`w-10 h-10 rounded-xl flex flex-shrink-0 items-center justify-center text-white font-bold text-sm shadow-inner ${isSuperAdmin ? 'bg-gradient-to-br from-purple-500 to-purple-700' :
                                    isStaff ? 'bg-gradient-to-br from-amber-500 to-amber-700' :
                                        'bg-gradient-to-br from-blue-500 to-blue-700'
                                    }`}>
                                    {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="flex flex-col justify-center overflow-hidden">
                                    <span className="text-sm font-bold text-slate-800 leading-tight truncate">
                                        {user.username || 'User'}
                                    </span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider leading-tight ${isSuperAdmin ? 'text-purple-600' :
                                        isStaff ? 'text-amber-600' :
                                            'text-blue-600'
                                        }`}>
                                        {isSuperAdmin ? 'Super Admin' : isStaff ? 'Shop Admin' : 'Customer'}
                                    </span>
                                </div>
                            </Link>

                            <button
                                onClick={() => setIsLogoutModalOpen(true)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors border border-transparent hover:border-red-100"
                                title="Sign out"
                            >
                                <i className="fas fa-sign-out-alt"></i> Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors w-full"
                            >
                                <i className="fas fa-sign-in-alt"></i> Sign in
                            </Link>
                            <Link
                                to="/signup"
                                className="flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm w-full"
                            >
                                Get started &rarr;
                            </Link>
                        </>
                    )}
                </div>
            </aside>

            {/* Logout Confirmation Modal */}
            {isLogoutModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-fade">
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl mb-4 mx-auto">
                            <i className="fas fa-sign-out-alt"></i>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 text-center mb-2">Ready to Leave?</h2>
                        <p className="text-slate-600 text-sm text-center mb-6">
                            Are you sure you want to log out of your account? You will need to sign in again to access your dashboard.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsLogoutModalOpen(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all active:scale-95"
                            >
                                Yes, Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
