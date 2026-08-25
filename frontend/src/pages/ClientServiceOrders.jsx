import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import OtpModal from '../components/OtpModal';

export default function ClientServiceOrders() {
    const [bookings, setBookings] = useState([]);
    const [counts, setCounts] = useState({});
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [selectedOtp, setSelectedOtp] = useState(null);
    const [isOtpOpen, setIsOtpOpen] = useState(false);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/client/service-orders');
            setBookings(res.data.bookings || []);
            setCounts(res.data.counts || {});
        } catch (err) {
            console.error('Fetch service orders error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(() => {
            fetchOrders();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const filteredBookings = filter === 'all'
        ? bookings
        : bookings.filter(b => b.status === filter);

    const handleVerifyOtp = async (otpCode) => {
        if (!selectedOtp) return;
        await api.post(`/portal/bookings/${selectedOtp.id}/verify-otp`, { otp: otpCode });
        fetchOrders();
    };

    if (loading) {
        return (
            <div className="text-center py-16 text-slate-500">
                <i className="fas fa-spinner fa-spin text-2xl"></i>
                <p className="mt-2 text-sm">Loading service orders...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Service Bookings</h1>
                    <p className="text-slate-500 text-sm sm:text-base mt-1">
                        Track real-time workshop milestones, view job passcodes, and invoice receipts.
                    </p>
                </div>
                <Link
                    to="/services-info"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
                >
                    <i className="fas fa-plus"></i> New Service Booking
                </Link>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                <button
                    onClick={() => setFilter('all')}
                    className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    All Orders ({bookings.length})
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    Pending ({counts.pending || 0})
                </button>
                <button
                    onClick={() => setFilter('confirmed')}
                    className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${filter === 'confirmed' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    Confirmed ({counts.confirmed || 0})
                </button>
                <button
                    onClick={() => setFilter('processing')}
                    className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${filter === 'processing' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    In Progress ({counts.processing || 0})
                </button>
                <button
                    onClick={() => setFilter('completed')}
                    className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    Completed ({counts.completed || 0})
                </button>
                <button
                    onClick={() => setFilter('cancelled')}
                    className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${filter === 'cancelled' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    Cancelled ({counts.cancelled || 0})
                </button>
            </div>

            {/* Orders Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                {filteredBookings.length === 0 ? (
                    <div className="text-center py-12">
                        <i className="fas fa-clipboard-list text-4xl text-slate-300 mb-3 block"></i>
                        <h3 className="text-lg font-bold text-slate-700">No bookings matching filter '{filter}'</h3>
                        <p className="text-slate-500 text-sm mt-1">Select another filter tab or book a new service offering.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-4">Order #</th>
                                    <th className="py-3 px-4">Vehicle Details</th>
                                    <th className="py-3 px-4">Workshop Hub</th>
                                    <th className="py-3 px-4">Schedule Date & Time</th>
                                    <th className="py-3 px-4">Payment</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredBookings.map((b) => (
                                    <tr key={b.id} className="hover:bg-slate-50/50">
                                        <td className="py-3 px-4 font-bold text-slate-900">#{b.id}</td>
                                        <td className="py-3 px-4">
                                            <div className="font-semibold text-slate-900">{b.vehicle_info}</div>
                                            <div className="text-xs text-slate-500">
                                                {b.services?.map(s => s.title).join(', ') || 'General Service'}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-600">{b.shop_name || 'Assigned Workshop'}</td>
                                        <td className="py-3 px-4 text-slate-600">
                                            {new Date(b.preferred_date).toLocaleDateString()}
                                            <span className="block text-xs text-slate-400">{b.preferred_time}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${b.is_paid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                {b.is_paid ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <StatusBadge status={b.status} />
                                            {b.detailed_status && (
                                                <div className="text-xs text-indigo-600 mt-1.5 font-medium bg-indigo-50 border border-indigo-100 px-2 py-1 rounded w-max max-w-xs truncate" title={b.detailed_status}>
                                                    <i className="fas fa-info-circle mr-1"></i> {b.detailed_status}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Link
                                                to={`/bookings/${b.id}`}
                                                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors inline-block"
                                            >
                                                Details &rarr;
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
                currentOtp={selectedOtp?.otp}
                isVerified={selectedOtp?.otp_verified || selectedOtp?.status === 'completed'}
            />
        </div>
    );
}
