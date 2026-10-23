import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';

export default function ShopTowingOrders() {
    const [towingList, setTowingList] = useState([]);
    const [counts, setCounts] = useState({});
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, newStatus: '', currentStatus: '' });

    const fetchTowing = async () => {
        try {
            const res = await api.get('/shop/towing-orders');
            setTowingList(res.data.towing || []);
            setCounts(res.data.counts || {});
        } catch (err) {
            console.error('Fetch shop towing orders failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTowing();
    }, []);

    const filteredList = filter === 'all'
        ? towingList
        : towingList.filter(t => t.status === filter);

    const towingStatusOrder = ['pending', 'processing', 'completed'];
    const isStatusDisabled = (currentStatus, targetStatus) => {
        if (currentStatus === targetStatus) return false;
        if (currentStatus === 'cancelled' || currentStatus === 'completed') return true;
        if (targetStatus === 'cancelled') return false;
        
        const currentIndex = towingStatusOrder.indexOf(currentStatus);
        const targetIndex = towingStatusOrder.indexOf(targetStatus);
        
        if (currentIndex === -1 || targetIndex === -1) return true;
        return targetIndex < currentIndex;
    };

    const handleQuickStatusChange = async (towingId, newStatus) => {
        try {
            await api.put(`/shop/towing-orders/${towingId}`, { status: newStatus });
            fetchTowing();
        } catch (err) {
            toast.error('Failed to update towing status');
        }
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
                        Dispatch tow trucks to driver GPS coordinates and verify physical handover.
                    </p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                <button
                    onClick={() => setFilter('all')}
                    className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    All ({counts.total || 0})
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

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                {filteredList.length === 0 ? (
                    <div className="text-center py-12">
                        <i className="fas fa-truck-pickup text-4xl text-slate-300 mb-3 block"></i>
                        <h3 className="text-lg font-bold text-slate-700">No towing requests found</h3>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-4">Request #</th>
                                    <th className="py-3 px-4">Driver & Contact</th>
                                    <th className="py-3 px-4">Vehicle Details</th>
                                    <th className="py-3 px-4">Pickup Location & Map</th>
                                    <th className="py-3 px-4">Towing Fee</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Update Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredList.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50/50">
                                        <td className="py-3 px-4 font-bold text-slate-900">#{t.id}</td>
                                        <td className="py-3 px-4">
                                            <div className="font-semibold text-slate-900">{t.full_name}</div>
                                            <div className="text-xs text-slate-500">
                                                <a href={`tel:${t.phone_number}`} className="text-blue-600 hover:underline">{t.phone_number}</a>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-700">{t.vehicle_details}</td>
                                        <td className="py-3 px-4 max-w-xs">
                                            <div className="truncate text-slate-800">{t.pickup_address}</div>
                                            {t.latitude && t.longitude && (
                                                <a
                                                    href={`https://www.google.com/maps?q=${t.latitude},${t.longitude}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs text-blue-600 hover:underline font-semibold inline-flex items-center gap-1 mt-1"
                                                >
                                                    <i className="fas fa-map-marked-alt"></i> View GPS Map
                                                </a>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-black text-red-600">₹{parseFloat(t.estimated_cost || 0).toFixed(2)}</div>
                                            <div className="text-[11px] text-slate-400 font-medium">({t.distance_km || 0} km away)</div>
                                        </td>
                                        <td className="py-3 px-4"><StatusBadge status={t.status} /></td>
                                        <td className="py-3 px-4">
                                            <select
                                                className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg text-slate-700 bg-white focus:outline-none focus:border-blue-600"
                                                value={t.status}
                                                onChange={(e) => setConfirmModal({ isOpen: true, id: t.id, newStatus: e.target.value, currentStatus: t.status })}
                                            >
                                                <option value="pending" disabled={isStatusDisabled(t.status, 'pending')}>Looking for Driver</option>
                                                <option value="processing" disabled={isStatusDisabled(t.status, 'processing')}>Driver En Route</option>
                                                <option value="completed" disabled={isStatusDisabled(t.status, 'completed')}>Completed</option>
                                                <option value="cancelled" disabled={isStatusDisabled(t.status, 'cancelled')}>Cancelled</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null, newStatus: '', currentStatus: '' })}
                onConfirm={() => handleQuickStatusChange(confirmModal.id, confirmModal.newStatus)}
                title="Confirm Status Change"
                message={`Are you sure you want to change the status from '${confirmModal.currentStatus}' to '${confirmModal.newStatus}'? This action cannot be undone.`}
                confirmText="Yes, Change Status"
                confirmColor="blue"
            />
            
        </div>
    );
}
