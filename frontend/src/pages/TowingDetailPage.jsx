import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import OtpModal from '../components/OtpModal';
import ConfirmModal from '../components/ConfirmModal';

export default function TowingDetailPage() {
    const { id } = useParams();
    const [towing, setTowing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    const fetchTowing = async () => {
        try {
            const res = await api.get(`/portal/towing/${id}`);
            setTowing(res.data.towing);
        } catch (err) {
            console.error('Fetch towing detail error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTowing();
        const interval = setInterval(() => {
            fetchTowing();
        }, 5000);
        return () => clearInterval(interval);
    }, [id]);


    const handleCancel = () => {
        setIsCancelModalOpen(true);
    };

    const confirmCancel = async () => {
        try {
            await api.delete(`/portal/towing/${id}`);
            fetchTowing();
        } catch (err) {
            console.error('Failed to cancel towing request:', err);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-16 text-slate-500">
                <i className="fas fa-spinner fa-spin text-2xl"></i>
                <p className="mt-2 text-sm">Loading towing request details...</p>
            </div>
        );
    }

    if (!towing) {
        return (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto my-8 shadow-sm">
                <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4 block"></i>
                <h2 className="text-xl font-bold text-slate-900">Towing Request Not Found</h2>
                <Link to="/towing-orders" className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm mt-6">
                    Back to Towing Orders
                </Link>
            </div>
        );
    }

    return (
        <div className="animate-fade max-w-4xl mx-auto my-4">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <Link to="/towing-orders" className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 mb-2 transition-colors">
                        <i className="fas fa-arrow-left"></i> Back to Towing Requests
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Towing Request #{towing.id}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <StatusBadge status={towing.status} />
                    {['pending', 'processing'].includes(towing.status) && (
                        <button
                            onClick={handleCancel}
                            className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors inline-flex items-center gap-1.5"
                        >
                            <i className="fas fa-ban"></i> Cancel Towing
                        </button>
                    )}
                </div>
            </div>


            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vehicle & Contact */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center">
                        <i className="fas fa-user-circle text-red-500 mr-2"></i>
                        Driver & Breakdown Details
                    </h3>
                    <div className="space-y-3.5 text-sm">
                        <div>
                            <span className="text-xs text-slate-400 block font-medium">Driver Name</span>
                            <span className="font-semibold text-slate-900">{towing.full_name}</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 block font-medium">Phone Contact</span>
                            <span className="font-semibold text-slate-900">{towing.phone_number}</span>
                        </div>
                        {towing.email && (
                            <div>
                                <span className="text-xs text-slate-400 block font-medium">Email Address</span>
                                <span className="font-semibold text-slate-900">{towing.email}</span>
                            </div>
                        )}
                        <div>
                            <span className="text-xs text-slate-400 block font-medium">Vehicle & Breakdown Condition</span>
                            <span className="text-slate-700">{towing.vehicle_details}</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 block font-medium">Requested Time</span>
                            <span className="text-slate-700">{new Date(towing.requested_at).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Pickup & Location Coordinates */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center">
                        <i className="fas fa-map-marker-alt text-red-500 mr-2"></i>
                        Location & GPS Coordinates
                    </h3>
                    <div className="space-y-3.5 text-sm">
                        <div>
                            <span className="text-xs text-slate-400 block font-medium">Pickup Address</span>
                            <span className="font-semibold text-slate-900">{towing.pickup_address}</span>
                        </div>
                        {towing.latitude && towing.longitude && (
                            <div>
                                <span className="text-xs text-slate-400 block font-medium">GPS Coordinates</span>
                                <span className="text-blue-600 font-mono font-semibold">
                                    {towing.latitude}, {towing.longitude}
                                </span>
                                <a
                                    href={`https://www.google.com/maps?q=${towing.latitude},${towing.longitude}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                >
                                    <i className="fas fa-external-link-alt"></i> Open in Google Maps
                                </a>
                            </div>
                        )}
                        <div>
                            <span className="text-xs text-slate-400 block font-medium">Assigned Towing Hub</span>
                            <span className="font-semibold text-slate-900">{towing.shop_name || 'AutoFusion Central Dispatch'}</span>
                            {towing.shop_phone && (
                                <a href={`tel:${towing.shop_phone}`} className="text-xs text-blue-600 block mt-0.5 hover:underline font-semibold">
                                    <i className="fas fa-phone mr-1"></i> {towing.shop_phone}
                                </a>
                            )}
                            {towing.shop_address && (
                                <span className="text-xs text-slate-500 block mt-0.5">
                                    {towing.shop_address}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Towing Pricing & Invoice Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-6">
                <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center">
                        <i className="fas fa-file-invoice-dollar text-red-500 mr-2"></i>
                        Towing Cost & Payment Breakdown
                    </h3>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        Method: {towing.payment_method === 'cash' ? 'Pay Driver on Arrival' : 'Online Invoice'}
                    </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-sm">
                    <div className="flex justify-between items-center text-slate-600">
                        <span>Base Hookup / Dispatch Fee:</span>
                        <span className="font-semibold text-slate-800">₹{parseFloat(towing.base_fee || 500).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                        <span>
                            Distance Charge ({towing.distance_km || 0} km @ ₹{towing.per_km_rate || 50}/km):
                        </span>
                        <span className="font-semibold text-slate-800">
                            ₹{(parseFloat(towing.distance_km || 0) * parseFloat(towing.per_km_rate || 50)).toFixed(2)}
                        </span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                        <span className="font-extrabold text-base text-slate-900">Total Towing Amount:</span>
                        <span className="text-2xl font-black text-red-600">
                            ₹{parseFloat(towing.estimated_cost || 0).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>


            {/* Cancel Confirmation Modal */}
            <ConfirmModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={confirmCancel}
                title="Cancel Towing Request"
                message="Are you sure you want to cancel this emergency towing request? This action cannot be undone."
                confirmText="Cancel Request"
                confirmColor="red"
            />
        </div>
    );
}
