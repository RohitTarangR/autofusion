import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';

export default function ShopServiceOrders() {
    const [bookings, setBookings] = useState([]);
    const [counts, setCounts] = useState({});
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, newStatus: '', currentStatus: '' });
    const [editForm, setEditForm] = useState({
        status: '',
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        vehicle_info: '',
        is_paid: false,
        detailed_status: '',
    });
    const [saving, setSaving] = useState(false);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/shop/service-orders');
            setBookings(res.data.bookings || []);
            setCounts(res.data.counts || {});
        } catch (err) {
            console.error('Fetch shop service orders failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filteredBookings = filter === 'all'
        ? bookings
        : bookings.filter(b => b.status === filter);

    const statusOrder = ['pending', 'confirmed', 'processing', 'completed'];
    const isStatusDisabled = (currentStatus, targetStatus) => {
        if (currentStatus === targetStatus) return false;
        if (currentStatus === 'cancelled' || currentStatus === 'completed') return true;
        if (targetStatus === 'cancelled') return false;
        
        const currentIndex = statusOrder.indexOf(currentStatus);
        const targetIndex = statusOrder.indexOf(targetStatus);
        
        if (currentIndex === -1 || targetIndex === -1) return true;
        return targetIndex < currentIndex;
    };

    const handleQuickStatusChange = async (bookingId, newStatus) => {
        try {
            await api.put(`/shop/service-orders/${bookingId}`, { status: newStatus });
            fetchOrders();
        } catch (err) {
            toast.error('Failed to update booking status');
        }
    };

    const handleQuickStatusDropdown = (booking, newStatus) => {
        if (newStatus === 'completed') {
            if (!booking.is_paid) {
                setSelectedBooking(booking);
                setEditForm({
                    status: 'completed',
                    customer_name: booking.customer_name,
                    customer_phone: booking.customer_phone,
                    customer_email: booking.customer_email,
                    vehicle_info: booking.vehicle_info,
                    is_paid: booking.is_paid,
                });
                setIsPaymentModalOpen(true);
            } else {
                handleQuickStatusChange(booking.id, 'completed');
            }
        } else {
            setConfirmModal({ isOpen: true, id: booking.id, newStatus, currentStatus: booking.status });
        }
    };

    const handleOpenEdit = (b) => {
        setSelectedBooking(b);
        setEditForm({
            status: b.status,
            customer_name: b.customer_name,
            customer_phone: b.customer_phone,
            customer_email: b.customer_email,
            vehicle_info: b.vehicle_info,
            is_paid: b.is_paid,
            detailed_status: b.detailed_status || '',
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (e) => {
        if (e) e.preventDefault();
        
        if (editForm.status === 'completed' && !editForm.is_paid) {
            setIsPaymentModalOpen(true);
            return;
        }

        executeSave(editForm);
    };

    const executeSave = async (payload) => {
        setSaving(true);
        try {
            await api.put(`/shop/service-orders/${selectedBooking.id}`, payload);
            setIsEditModalOpen(false);
            setIsPaymentModalOpen(false);
            fetchOrders();
            toast.success('Service order updated successfully');
        } catch (err) {
            toast.error('Failed to update order details');
        } finally {
            setSaving(false);
        }
    };

    const handlePaymentAction = (isPaid, sendPaymentLink) => {
        executeSave({ ...editForm, is_paid: isPaid, send_payment_link: sendPaymentLink });
    };

    if (loading) {
        return (
            <div className="text-center py-16 text-slate-500">
                <i className="fas fa-spinner fa-spin text-2xl"></i>
                <p className="mt-2 text-sm">Loading service bookings...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Workshop Service Bookings</h1>
                    <p className="text-slate-500 text-sm sm:text-base mt-1">
                        Manage incoming client vehicle maintenance appointments and update progress status.
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
                    Pending ({counts.pending || 0})
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

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                {filteredBookings.length === 0 ? (
                    <div className="text-center py-12">
                        <i className="fas fa-clipboard-check text-4xl text-slate-300 mb-3 block"></i>
                        <h3 className="text-lg font-bold text-slate-700">No service orders found</h3>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-4">Order #</th>
                                    <th className="py-3 px-4">Customer Info</th>
                                    <th className="py-3 px-4">Vehicle & Packages</th>
                                    <th className="py-3 px-4">Scheduled For</th>
                                    <th className="py-3 px-4">Payment</th>
                                    <th className="py-3 px-4">Current Status</th>
                                    <th className="py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredBookings.map((b) => (
                                    <tr key={b.id} className="hover:bg-slate-50/50">
                                        <td className="py-3 px-4 font-bold text-slate-900">#{b.id}</td>
                                        <td className="py-3 px-4">
                                            <div className="font-semibold text-slate-900">{b.customer_name}</div>
                                            <div className="text-xs text-slate-500">{b.customer_phone}</div>
                                            <div className="text-xs text-slate-400">{b.customer_email}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-semibold text-slate-900">{b.vehicle_info}</div>
                                            <div className="text-xs text-blue-600 font-medium">
                                                {b.services?.map(s => s.title).join(', ') || 'Standard Inspection'}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-700">
                                            {new Date(b.preferred_date).toLocaleDateString()}
                                            <span className="block text-xs text-slate-500">{b.preferred_time}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                b.is_paid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {b.is_paid ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <select
                                                className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg text-slate-700 bg-white focus:outline-none focus:border-blue-600"
                                                value={b.status}
                                                onChange={(e) => handleQuickStatusDropdown(b, e.target.value)}
                                            >
                                                <option value="pending" disabled={isStatusDisabled(b.status, 'pending')}>Pending</option>
                                                <option value="confirmed" disabled={isStatusDisabled(b.status, 'confirmed')}>Confirmed</option>
                                                <option value="processing" disabled={isStatusDisabled(b.status, 'processing')}>In Progress</option>
                                                <option value="completed" disabled={isStatusDisabled(b.status, 'completed')}>Completed</option>
                                                <option value="cancelled" disabled={isStatusDisabled(b.status, 'cancelled')}>Cancelled</option>
                                            </select>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => handleOpenEdit(b)}
                                                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors inline-flex items-center gap-1"
                                            >
                                                <i className="fas fa-edit"></i> Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Order Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 sm:p-8 relative">
                        <button
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
                            onClick={() => setIsEditModalOpen(false)}
                        >
                            <i className="fas fa-times"></i>
                        </button>

                        <h3 className="text-xl font-bold text-slate-900 mb-5">
                            Edit Service Order #{selectedBooking?.id}
                        </h3>

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Service Milestone Status</label>
                                <select
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm"
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                >
                                    <option value="pending" disabled={isStatusDisabled(selectedBooking?.status, 'pending')}>Pending Confirmation</option>
                                    <option value="confirmed" disabled={isStatusDisabled(selectedBooking?.status, 'confirmed')}>Confirmed</option>
                                    <option value="processing" disabled={isStatusDisabled(selectedBooking?.status, 'processing')}>Service In Progress</option>
                                    <option value="completed" disabled={isStatusDisabled(selectedBooking?.status, 'completed')}>Completed & Ready for Handover</option>
                                    <option value="cancelled" disabled={isStatusDisabled(selectedBooking?.status, 'cancelled')}>Cancelled</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Current Work Activity (Visible to Customer)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Car is washing now, Oil changing..."
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm"
                                    value={editForm.detailed_status}
                                    onChange={(e) => setEditForm({ ...editForm, detailed_status: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm"
                                    value={editForm.customer_name}
                                    onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Phone</label>
                                <input
                                    type="tel"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm"
                                    value={editForm.customer_phone}
                                    onChange={(e) => setEditForm({ ...editForm, customer_phone: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Vehicle Information</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm"
                                    value={editForm.vehicle_info}
                                    onChange={(e) => setEditForm({ ...editForm, vehicle_info: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editForm.is_paid}
                                        onChange={(e) => setEditForm({ ...editForm, is_paid: e.target.checked })}
                                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Mark as Paid</span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                    onClick={() => setIsEditModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                                    disabled={saving}
                                >
                                    {saving ? <i className="fas fa-spinner fa-spin"></i> : 'Update Order'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null, newStatus: '', currentStatus: '' })}
                onConfirm={() => handleQuickStatusChange(confirmModal.id, confirmModal.newStatus)}
                title="Confirm Status Change"
                message={`Are you sure you want to change the status from '${confirmModal.currentStatus}' to '${confirmModal.newStatus}'? This action cannot be undone.`}
                confirmText="Yes, Change Status"
                confirmColor="blue"
            />
            
            {/* Payment Collection Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8 relative">
                        <button className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors" onClick={() => setIsPaymentModalOpen(false)}>
                            <i className="fas fa-times"></i>
                        </button>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
                                <i className="fas fa-hand-holding-dollar text-2xl"></i>
                            </div>
                            <h2 className="text-xl font-extrabold text-slate-900">Payment Collection</h2>
                            <p className="text-sm text-slate-500 mt-2">
                                You are marking this service as completed, but payment hasn't been collected yet.
                            </p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
                            <p className="text-center font-bold text-slate-700">Estimated Amount Due</p>
                            <p className="text-center text-3xl font-extrabold text-blue-600 mt-1">
                                ₹{selectedBooking?.total_cost || 0}
                            </p>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={() => handlePaymentAction(true, false)}
                                disabled={saving}
                                className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-2"
                            >
                                {saving ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-check-circle"></i> Yes, Cash/UPI Collected</>}
                            </button>
                            <button
                                onClick={() => handlePaymentAction(false, true)}
                                disabled={saving}
                                className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center gap-2"
                            >
                                {saving ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-paper-plane"></i> No, Send Online Payment Link</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
}
