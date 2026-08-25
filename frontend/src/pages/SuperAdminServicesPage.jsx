import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';

export default function SuperAdminServicesPage() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const fetchBookings = async () => {
        try {
            const res = await api.get('/admin/services');
            setBookings(res.data.bookings || []);
        } catch (err) {
            console.error('Fetch admin services failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchQuery, dateFilter]);

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await api.delete(`/admin/services/${itemToDelete}`);
            fetchBookings();
        } catch (err) {
            toast.error('Failed to delete booking');
        }
        setItemToDelete(null);
    };

    const filteredList = bookings.filter(b => {
        const matchesStatus = filter === 'all' || b.status === filter;
        
        const query = searchQuery.toLowerCase();
        const matchesSearch = !query || 
            (b.customer_name && b.customer_name.toLowerCase().includes(query)) ||
            (b.vehicle_info && b.vehicle_info.toLowerCase().includes(query)) ||
            (b.shop_name && b.shop_name.toLowerCase().includes(query));
            
        let localDate = '';
        if (b.preferred_date) {
            const bDateObj = new Date(b.preferred_date);
            const year = bDateObj.getFullYear();
            const month = String(bDateObj.getMonth() + 1).padStart(2, '0');
            const day = String(bDateObj.getDate()).padStart(2, '0');
            localDate = `${year}-${month}-${day}`;
        }
        const matchesDate = !dateFilter || localDate === dateFilter;
        
        return matchesStatus && matchesSearch && matchesDate;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredList.length / itemsPerPage);

    if (loading) {
        return (
            <div className="text-center py-16 text-slate-500">
                <i className="fas fa-spinner fa-spin text-2xl"></i>
                <p className="mt-2 text-sm">Loading platform bookings...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Platform-Wide Service Orders</h1>
                    <p className="text-slate-500 text-sm sm:text-base mt-1">
                        Global registry of all maintenance appointments across all partner garages.
                    </p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    <div className="flex-1 flex gap-3 w-full lg:w-auto flex-col sm:flex-row">
                        <div className="relative flex-1 max-w-md">
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            <input
                                type="text"
                                placeholder="Search customer, vehicle, or workshop..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-slate-700"
                            />
                            {dateFilter && (
                                <button onClick={() => setDateFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 bg-white px-1">
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto" style={{ scrollbarWidth: 'none' }}>
                        <button onClick={() => setFilter('all')} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>All ({bookings.length})</button>
                        <button onClick={() => setFilter('pending')} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Pending</button>
                        <button onClick={() => setFilter('processing')} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${filter === 'processing' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>In Progress</button>
                        <button onClick={() => setFilter('completed')} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Completed</button>
                        <button onClick={() => setFilter('cancelled')} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${filter === 'cancelled' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Cancelled</button>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                {filteredList.length === 0 ? (
                    <p className="text-center py-8 text-slate-500 text-sm">No bookings matching criteria.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-4">Order #</th>
                                    <th className="py-3 px-4">Customer & Contact</th>
                                    <th className="py-3 px-4">Workshop Hub</th>
                                    <th className="py-3 px-4">Vehicle Details</th>
                                    <th className="py-3 px-4">Scheduled Date</th>
                                    <th className="py-3 px-4">Payment</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {currentItems.map((b) => (
                                    <tr key={b.id} className="hover:bg-slate-50/50">
                                        <td className="py-3 px-4 font-bold text-slate-900">#{b.id}</td>
                                        <td className="py-3 px-4">
                                            <div className="font-semibold text-slate-900">{b.customer_name}</div>
                                            <div className="text-xs text-slate-500">{b.customer_phone}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-semibold text-blue-600">{b.shop_name}</div>
                                            <div className="text-xs text-slate-500">{b.city}</div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-700">{b.vehicle_info}</td>
                                        <td className="py-3 px-4 text-slate-600">{new Date(b.preferred_date).toLocaleDateString()} at {b.preferred_time}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                b.is_paid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {b.is_paid ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4"><StatusBadge status={b.status} /></td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => handleDeleteClick(b.id)}
                                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                                title="Delete Order"
                                            >
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 px-4 py-3 bg-slate-50 border-t border-slate-200 rounded-b-xl">
                                <div className="text-sm text-slate-500">
                                    Showing <span className="font-semibold text-slate-900">{indexOfFirstItem + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(indexOfLastItem, filteredList.length)}</span> of <span className="font-semibold text-slate-900">{filteredList.length}</span> entries
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        Previous
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-8 h-8 flex items-center justify-center text-sm font-semibold rounded-lg transition-colors ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${currentPage === totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setItemToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Service Booking"
                message={`Are you sure you want to permanently delete Service Booking #${itemToDelete}? This action cannot be undone.`}
                confirmText="Delete Booking"
                confirmColor="red"
            />
            
        </div>
    );
}
