import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import OtpModal from '../components/OtpModal';

export default function ClientDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedOtpData, setSelectedOtpData] = useState(null);
    const [isOtpOpen, setIsOtpOpen] = useState(false);

    const fetchDashboard = async () => {
        try {
            const res = await api.get('/client/dashboard');
            setStats(res.data.stats);
        } catch (err) {
            console.error('Fetch client dashboard failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
        const interval = setInterval(() => {
            fetchDashboard();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const openOtpView = (order) => {
        setSelectedOtpData({
            id: order.id,
            otp: order.otp,
            isVerified: order.otp_verified || order.status === 'completed',
            type: order.vehicle_info ? 'service' : 'towing',
        });
        setIsOtpOpen(true);
    };

    const handleVerifyOtp = async (otpCode) => {
        if (!selectedOtpData) return;
        const endpoint = selectedOtpData.type === 'service'
            ? `/portal/bookings/${selectedOtpData.id}/verify-otp`
            : `/portal/towing/${selectedOtpData.id}/verify-otp`;
        
        await api.post(endpoint, { otp: otpCode });
        fetchDashboard();
    };

    if (loading) {
        return (
            <div className="text-center py-16 text-slate-500">
                <i className="fas fa-spinner fa-spin text-2xl"></i>
                <p className="mt-2 text-sm">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade">
            {/* Top Welcome Header */}
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                        Welcome back, {user?.first_name || user?.username}!
                    </h1>
                    <p className="text-slate-500 text-sm sm:text-base mt-1">
                        Manage vehicle service requests, active towing assistance, and security passcodes.
                    </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <Link
                        to="/garage"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 transition-colors shadow-sm"
                    >
                        <i className="fas fa-warehouse text-blue-600"></i> My Garage
                    </Link>
                    <Link
                        to="/services-info"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
                    >
                        <i className="fas fa-plus"></i> New Service Booking
                    </Link>
                    <Link
                        to="/towing-request"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm"
                    >
                        <i className="fas fa-truck-pickup"></i> Request Towing
                    </Link>
                </div>
            </div>


            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-extrabold text-slate-900">{stats?.total_orders || 0}</div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Total Lifetime Orders</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                        <i className="fas fa-layer-group"></i>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-extrabold text-slate-900">{stats?.active_service_orders || 0}</div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Active Service Bookings</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
                        <i className="fas fa-wrench"></i>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-extrabold text-slate-900">{stats?.active_towing_orders || 0}</div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Active Towing Rescues</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center text-xl">
                        <i className="fas fa-truck-pickup"></i>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-extrabold text-slate-900">{stats?.total_service_orders || 0}</div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Completed Services</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                        <i className="fas fa-check-circle"></i>
                    </div>
                </div>
            </div>

            {/* Recent Service Orders Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center">
                        <i className="fas fa-clipboard-list text-blue-600 mr-2"></i>
                        Recent Service Bookings
                    </h2>
                    <Link to="/service-orders" className="text-sm font-semibold text-blue-600 hover:underline">
                        View All Orders &rarr;
                    </Link>
                </div>

                {stats?.recent_service_orders?.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-6">
                        No service bookings found. Schedule your first maintenance service above!
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-4">Order #</th>
                                    <th className="py-3 px-4">Vehicle Info</th>
                                    <th className="py-3 px-4">Shop Location</th>
                                    <th className="py-3 px-4">Scheduled Date</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Job OTP</th>
                                    <th className="py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {stats?.recent_service_orders?.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-slate-50/50">
                                        <td className="py-3 px-4 font-bold text-slate-900">#{booking.id}</td>
                                        <td className="py-3 px-4 text-slate-700">{booking.vehicle_info}</td>
                                        <td className="py-3 px-4 text-slate-600">{booking.shop_name || 'Assigned Hub'}</td>
                                        <td className="py-3 px-4 text-slate-600">{new Date(booking.preferred_date).toLocaleDateString()} at {booking.preferred_time}</td>
                                        <td className="py-3 px-4"><StatusBadge status={booking.status} /></td>
                                        <td className="py-3 px-4">
                                            {booking.otp ? (
                                                <button
                                                    onClick={() => openOtpView(booking)}
                                                    className="px-2.5 py-1 text-xs font-mono font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
                                                >
                                                    <i className="fas fa-key text-blue-600"></i> {booking.otp}
                                                </button>
                                            ) : '-'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Link
                                                to={`/bookings/${booking.id}`}
                                                className="px-3 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors inline-block"
                                            >
                                                View & Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Recent Towing Requests Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center">
                        <i className="fas fa-truck-pickup text-red-500 mr-2"></i>
                        Recent Towing Requests
                    </h2>
                    <Link to="/towing-orders" className="text-sm font-semibold text-blue-600 hover:underline">
                        View All Towing &rarr;
                    </Link>
                </div>

                {stats?.recent_towing_orders?.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-6">
                        No emergency towing requests found.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-4">Request #</th>
                                    <th className="py-3 px-4">Vehicle Details</th>
                                    <th className="py-3 px-4">Pickup Location</th>
                                    <th className="py-3 px-4">Requested Time</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">OTP</th>
                                    <th className="py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {stats?.recent_towing_orders?.map((towing) => (
                                    <tr key={towing.id} className="hover:bg-slate-50/50">
                                        <td className="py-3 px-4 font-bold text-slate-900">#{towing.id}</td>
                                        <td className="py-3 px-4 text-slate-700">{towing.vehicle_details}</td>
                                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                                            {towing.pickup_address}
                                        </td>
                                        <td className="py-3 px-4 text-slate-600">{new Date(towing.requested_at).toLocaleString()}</td>
                                        <td className="py-3 px-4"><StatusBadge status={towing.status} /></td>
                                        <td className="py-3 px-4">
                                            {towing.otp ? (
                                                <button
                                                    onClick={() => openOtpView(towing)}
                                                    className="px-2.5 py-1 text-xs font-mono font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
                                                >
                                                    <i className="fas fa-key text-red-500"></i> {towing.otp}
                                                </button>
                                            ) : '-'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Link
                                                to={`/towing/${towing.id}`}
                                                className="px-3 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors inline-block"
                                            >
                                                View & Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* OTP Modal */}
            <OtpModal
                isOpen={isOtpOpen}
                onClose={() => setIsOtpOpen(false)}
                onVerify={handleVerifyOtp}
                currentOtp={selectedOtpData?.otp}
                isVerified={selectedOtpData?.isVerified}
            />
        </div>
    );
}
