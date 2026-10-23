import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import OtpModal from '../components/OtpModal';

export default function ClientTowingOrders() {
    const [towingList, setTowingList] = useState([]);
    const [counts, setCounts] = useState({});
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [selectedOtp, setSelectedOtp] = useState(null);
    const [isOtpOpen, setIsOtpOpen] = useState(false);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/client/towing-orders');
            setTowingList(res.data.towing || []);
            setCounts(res.data.counts || {});
        } catch (err) {
            console.error('Fetch towing orders error:', err);
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

    const filteredList = filter === 'all'
        ? towingList
        : towingList.filter(t => t.status === filter);

    const handleVerifyOtp = async (otpCode) => {
        if (!selectedOtp) return;
        await api.post(`/portal/towing/${selectedOtp.id}/verify-otp`, { otp: otpCode });
        fetchOrders();
    };

    if (loading) {
        return (
            <div className="text-center py-16 text-slate-500">
                <i className="fas fa-spinner fa-spin text-2xl"></i>
                <p className="mt-2 text-sm">Loading towing requests...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Emergency Towing Requests</h1>
                    <p className="text-slate-500 text-sm sm:text-base mt-1">
                        Track live towing drivers dispatched to your vehicle location.
                    </p>
                </div>
                <Link
                    to="/towing-request"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm"
                >
                    <i className="fas fa-truck-pickup"></i> Request Emergency Towing
                </Link>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                <button
                    onClick={() => setFilter('all')}
                    className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    All Requests ({towingList.length})
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    Looking for Driver ({counts.pending || 0})
                </button>
                <button
                    onClick={() => setFilter('processing')}
                    className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${filter === 'processing' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    Driver En Route ({counts.processing || 0})
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
                {filteredList.length === 0 ? (
                    <div className="text-center py-12">
                        <i className="fas fa-truck-pickup text-4xl text-slate-300 mb-3 block"></i>
                        <h3 className="text-lg font-bold text-slate-700">No requests matching filter '{filter}'</h3>
                        <p className="text-slate-500 text-sm mt-1">Select another filter tab or request roadside towing.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-4">Request #</th>
                                    <th className="py-3 px-4">Vehicle Details</th>
                                    <th className="py-3 px-4">Pickup Location</th>
                                    <th className="py-3 px-4">Dispatch Hub</th>
                                    <th className="py-3 px-4">Towing Cost</th>
                                    <th className="py-3 px-4">Requested Time</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredList.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50/50">
                                        <td className="py-3 px-4 font-bold text-slate-900">#{t.id}</td>
                                        <td className="py-3 px-4 font-semibold text-slate-900">{t.vehicle_details}</td>
                                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                                            {t.pickup_address}
                                        </td>
                                        <td className="py-3 px-4 text-slate-600">{t.shop_name || 'Assigned Workshop'}</td>
                                        <td className="py-3 px-4 font-black text-red-600">₹{parseFloat(t.estimated_cost || 0).toFixed(2)}</td>
                                        <td className="py-3 px-4 text-slate-600">{new Date(t.requested_at).toLocaleString()}</td>
                                        <td className="py-3 px-4"><StatusBadge status={t.status} /></td>
                                        <td className="py-3 px-4">
                                            <Link
                                                to={`/towing/${t.id}`}
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
