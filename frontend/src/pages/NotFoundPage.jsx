import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFoundPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isStaff, isSuperAdmin } = useAuth();

    // Determine dashboard destination if logged in
    const getDashboardPath = () => {
        if (isSuperAdmin) return '/admin/dashboard';
        if (isStaff) return '/shop/dashboard';
        if (user) return '/dashboard';
        return '/';
    };

    const dashboardLabel = user ? 'Go to Dashboard' : 'Back to Home';
    const dashboardPath = getDashboardPath();

    return (
        <div className="min-h-[75vh] flex items-center justify-center py-10 px-4 animate-fade">
            <div className="max-w-2xl w-full text-center">
                {/* Visual Graphic & 404 Badge */}
                <div className="relative inline-block mb-6">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-500/25 ring-8 ring-blue-50">
                        <i className="fas fa-map-marked-alt text-4xl sm:text-5xl"></i>
                    </div>
                    <span className="absolute -bottom-2 -right-2 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                        <i className="fas fa-exclamation-triangle text-[10px]"></i> 404
                    </span>
                </div>

                {/* Big 404 Typography */}
                <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight text-slate-900 mb-2">
                    4<span className="text-blue-600">0</span>4
                </h1>

                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
                    Road Not Found / Wrong Turn
                </h2>

                <p className="text-slate-600 text-base sm:text-lg max-w-lg mx-auto mb-4">
                    The road you are trying to travel does not exist or may have been relocated.
                </p>

                {/* Attempted Route Chip */}
                {location.pathname && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-mono mb-8 max-w-md truncate">
                        <i className="fas fa-link text-slate-400"></i>
                        <span className="text-slate-400">Target path:</span>
                        <span className="font-semibold text-slate-700">{location.pathname}</span>
                    </div>
                )}

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-arrow-left"></i> Go Back
                    </button>

                    <Link
                        to={dashboardPath}
                        className="w-full sm:w-auto px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-home"></i> {dashboardLabel}
                    </Link>
                </div>

                {/* Quick Help & Alternative Destinations */}
                <div className="pt-8 border-t border-slate-200">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                        Popular AutoFusion Destinations
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                        <Link
                            to="/services-info"
                            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-500 hover:shadow-sm transition-all group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <i className="fas fa-tools text-sm"></i>
                            </div>
                            <div className="font-semibold text-slate-800 text-sm group-hover:text-blue-600">
                                Vehicle Services
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                                Explore maintenance & tune-ups
                            </div>
                        </Link>

                        <Link
                            to="/towing-request"
                            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-red-500 hover:shadow-sm transition-all group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <i className="fas fa-truck-pickup text-sm"></i>
                            </div>
                            <div className="font-semibold text-slate-800 text-sm group-hover:text-red-600">
                                Towing Rescue
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                                24/7 roadside assistance
                            </div>
                        </Link>

                        <Link
                            to="/contact"
                            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-sm transition-all group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <i className="fas fa-headset text-sm"></i>
                            </div>
                            <div className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600">
                                Contact Support
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                                Talk to our support desk
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
