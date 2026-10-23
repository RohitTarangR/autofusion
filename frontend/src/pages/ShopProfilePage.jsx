import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import ConfirmModal from '../components/ConfirmModal';

export default function ShopProfilePage() {
    const [shop, setShop] = useState({
        full_name: '',
        shop_name: '',
        phone_number: '',
        city: '',
        shop_address: '',
        opening_time: '10:00:00',
        closing_time: '19:00:00',
        lunch_start_time: '13:00:00',
        lunch_end_time: '14:00:00',
    });
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Service modal state
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [editingServiceId, setEditingServiceId] = useState(null);
    const [serviceForm, setServiceForm] = useState({
        title: '',
        description: '',
        icon_class: 'fas fa-wrench',
        price_starts_at: '',
        is_active: true,
    });
    const [savingService, setSavingService] = useState(false);

    const fetchShopProfile = async () => {
        try {
            const res = await api.get('/shop/profile');
            setShop(res.data.shop || {});
            setServices(res.data.services || []);
        } catch (err) {
            console.error('Fetch shop profile failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShopProfile();
    }, []);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        ;
        try {
            await api.put('/shop/profile', shop);
            toast.success('Shop profile details updated successfully!');
            fetchShopProfile();
        } catch (err) {
            toast.error('Failed to update shop profile.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleOpenAddService = () => {
        setEditingServiceId(null);
        setServiceForm({
            title: '',
            description: '',
            icon_class: 'fas fa-wrench',
            price_starts_at: '',
            is_active: true,
        });
        setIsServiceModalOpen(true);
    };

    const handleOpenEditService = (service) => {
        setEditingServiceId(service.id);
        setServiceForm({
            title: service.title,
            description: service.description,
            icon_class: service.icon_class || 'fas fa-wrench',
            price_starts_at: service.price_starts_at,
            is_active: service.is_active,
        });
        setIsServiceModalOpen(true);
    };

    const handleDeleteClick = (serviceId) => {
        setItemToDelete(serviceId);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await api.delete(`/shop/services/${itemToDelete}`);
            fetchShopProfile();
        } catch (err) {
            toast.error('Failed to delete service offering.');
        }
        setItemToDelete(null);
    };

    const handleSaveService = async (e) => {
        e.preventDefault();
        setSavingService(true);
        try {
            if (editingServiceId) {
                await api.put(`/shop/services/${editingServiceId}`, serviceForm);
            } else {
                await api.post('/shop/services', serviceForm);
            }
            setIsServiceModalOpen(false);
            fetchShopProfile();
        } catch (err) {
            toast.error('Failed to save service offering.');
        } finally {
            setSavingService(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-16 text-slate-500">
                <i className="fas fa-spinner fa-spin text-2xl"></i>
                <p className="mt-2 text-sm">Loading shop settings...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade max-w-5xl mx-auto my-4">
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Shop Profile & Services Management</h1>
                <p className="text-slate-500 text-sm sm:text-base mt-1">
                    Configure your garage profile details and publish services available for online booking.
                </p>
            </div>

            {/* Shop Profile Form */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                    <i className="fas fa-store text-blue-600 mr-2"></i>
                    Workshop Profile Information
                </h2>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Shop / Business Name</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm"
                                value={shop.shop_name || ''}
                                onChange={(e) => setShop({ ...shop, shop_name: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Manager / Owner Name</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm"
                                value={shop.full_name || ''}
                                onChange={(e) => setShop({ ...shop, full_name: e.target.value })}
                            />
                        </div>
                    </div >

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Workshop Phone Number</label>
                            <input
                                type="tel"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm"
                                value={shop.phone_number || ''}
                                onChange={(e) => setShop({ ...shop, phone_number: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">City / Region</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm"
                                value={shop.city || ''}
                                onChange={(e) => setShop({ ...shop, city: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Shop Street Address</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm"
                            value={shop.shop_address || ''}
                            onChange={(e) => setShop({ ...shop, shop_address: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Opening Time</label>
                            <input
                                type="time"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm"
                                value={shop.opening_time ? shop.opening_time.slice(0, 5) : '10:00'}
                                onChange={(e) => setShop({ ...shop, opening_time: e.target.value + ':00' })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Closing Time</label>
                            <input
                                type="time"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm"
                                value={shop.closing_time ? shop.closing_time.slice(0, 5) : '19:00'}
                                onChange={(e) => setShop({ ...shop, closing_time: e.target.value + ':00' })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Lunch Break Start</label>
                            <input
                                type="time"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm"
                                value={shop.lunch_start_time ? shop.lunch_start_time.slice(0, 5) : '13:00'}
                                onChange={(e) => setShop({ ...shop, lunch_start_time: e.target.value + ':00' })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Lunch Break End</label>
                            <input
                                type="time"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm"
                                value={shop.lunch_end_time ? shop.lunch_end_time.slice(0, 5) : '14:00'}
                                onChange={(e) => setShop({ ...shop, lunch_end_time: e.target.value + ':00' })}
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center">

                            <i className="fas fa-sliders-h text-blue-600 mr-2"></i>
                            Capacity & Overbooking Prevention
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Max Concurrent Cars per Slot</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm font-bold"
                                    value={shop.max_concurrent_bookings || 3}
                                    onChange={(e) => setShop({ ...shop, max_concurrent_bookings: e.target.value })}
                                    required
                                />
                                <span className="text-[11px] text-slate-400 mt-1 block">Prevents booking when garage bays are full</span>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Turnaround Window</label>
                                <select
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm"
                                    value={shop.slot_duration_minutes || 120}
                                    onChange={(e) => setShop({ ...shop, slot_duration_minutes: e.target.value })}
                                >
                                    <option value="60">60 Minutes (1 Hour)</option>
                                    <option value="90">90 Minutes (1.5 Hours)</option>
                                    <option value="120">120 Minutes (2 Hours)</option>
                                    <option value="180">180 Minutes (3 Hours)</option>
                                </select>
                                <span className="text-[11px] text-slate-400 mt-1 block">Standard service duration</span>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Weekly Closed Days</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Sunday or Sunday, Saturday"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm"
                                    value={shop.closed_days || 'Sunday'}
                                    onChange={(e) => setShop({ ...shop, closed_days: e.target.value })}
                                />
                                <span className="text-[11px] text-slate-400 mt-1 block">Days customers cannot book</span>
                            </div>
                        </div>
                    </div>

                    {/* Towing Rates & Dispatch Settings */}
                    <div className="pt-4 border-t border-slate-200">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center">
                                <i className="fas fa-truck-pickup text-red-600 mr-2"></i>
                                Roadside Towing Rates & GPS Dispatch Settings
                            </h4>
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={shop.towing_service_available !== false}
                                    onChange={(e) => setShop({ ...shop, towing_service_available: e.target.checked })}
                                    className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                                />
                                Enable 24/7 Towing Dispatch
                            </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Base Hookup Fee (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="10"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-sm font-semibold"
                                    value={shop.base_towing_fee !== undefined ? shop.base_towing_fee : 500}
                                    onChange={(e) => setShop({ ...shop, base_towing_fee: e.target.value })}
                                    required
                                />
                                <span className="text-[11px] text-slate-400 mt-1 block">Fixed dispatch / hookup charge</span>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Per-Kilometer Rate (₹/km)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="5"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-sm font-semibold"
                                    value={shop.per_km_towing_rate !== undefined ? shop.per_km_towing_rate : 50}
                                    onChange={(e) => setShop({ ...shop, per_km_towing_rate: e.target.value })}
                                    required
                                />
                                <span className="text-[11px] text-slate-400 mt-1 block">Charged per km from shop to breakdown</span>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Max Towing Radius (km)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="500"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-sm font-semibold"
                                    value={shop.max_towing_radius_km !== undefined ? shop.max_towing_radius_km : 50}
                                    onChange={(e) => setShop({ ...shop, max_towing_radius_km: e.target.value })}
                                    required
                                />
                                <span className="text-[11px] text-slate-400 mt-1 block">Service limit for towing requests</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Shop GPS Latitude</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 23.052500"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-sm font-mono"
                                    value={shop.latitude || ''}
                                    onChange={(e) => setShop({ ...shop, latitude: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Shop GPS Longitude</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 72.511500"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-sm font-mono"
                                    value={shop.longitude || ''}
                                    onChange={(e) => setShop({ ...shop, longitude: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm mt-4"
                        disabled={savingProfile}
                    >
                        {savingProfile ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-save"></i> Save Shop Settings</>}
                    </button>
                </form >

            </div >

        {/* Service Offerings Management */ }
        < div className = "bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm" >
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center">
                        <i className="fas fa-tools text-blue-600 mr-2"></i>
                        Service Offerings Catalog
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                        Services displayed to clients for online booking appointments.
                    </p>
                </div>
                <button
                    onClick={handleOpenAddService}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
                >
                    <i className="fas fa-plus"></i> Add Service Offering
                </button>
            </div>

    {
        services.length === 0 ? (
            <p className="text-slate-400 text-center py-8 text-sm">No service offerings added yet. Click 'Add Service Offering' to create your first package.</p>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-3 px-4">Icon & Service Title</th>
                            <th className="py-3 px-4">Description</th>
                            <th className="py-3 px-4">Starting Price</th>
                            <th className="py-3 px-4">Active</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {services.map((service) => (
                            <tr key={service.id} className="hover:bg-slate-50/50">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm flex-shrink-0">
                                            <i className={service.icon_class || 'fas fa-wrench'}></i>
                                        </div>
                                        <span className="font-semibold text-slate-900">{service.title}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-slate-500 max-w-xs text-xs sm:text-sm">{service.description}</td>
                                <td className="py-3 px-4"><strong className="text-blue-600">₹{parseFloat(service.price_starts_at).toFixed(2)}</strong></td>
                                <td className="py-3 px-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${service.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                                        }`}>
                                        {service.is_active ? 'Active' : 'Disabled'}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <div className="inline-flex gap-1.5">
                                        <button
                                            onClick={() => handleOpenEditService(service)}
                                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(service.id)}
                                            className="px-2.5 py-1 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }
            </div >

        {/* Service Offering Add/Edit Modal */ }
    {
        isServiceModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 sm:p-8 relative">
                    <button
                        className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
                        onClick={() => setIsServiceModalOpen(false)}
                    >
                        <i className="fas fa-times"></i>
                    </button>

                    <h3 className="text-xl font-bold text-slate-900 mb-5">
                        {editingServiceId ? 'Edit Service Offering' : 'Add New Service Offering'}
                    </h3>

                    <form onSubmit={handleSaveService} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Service Package Title</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm"
                                placeholder="e.g. Synthetic Oil & Filter Service"
                                value={serviceForm.title}
                                onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Starting Price (₹ INR)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm"
                                placeholder="1499.00"
                                value={serviceForm.price_starts_at}
                                onChange={(e) => setServiceForm({ ...serviceForm, price_starts_at: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">FontAwesome Icon Class</label>
                            <select
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm"
                                value={serviceForm.icon_class}
                                onChange={(e) => setServiceForm({ ...serviceForm, icon_class: e.target.value })}
                            >
                                <option value="fas fa-wrench">fas fa-wrench (Wrench / Repair)</option>
                                <option value="fas fa-oil-can">fas fa-oil-can (Oil & Fluids)</option>
                                <option value="fas fa-compact-disc">fas fa-compact-disc (Brakes & Rotors)</option>
                                <option value="fas fa-dharmachakra">fas fa-dharmachakra (Wheel Alignment)</option>
                                <option value="fas fa-snowflake">fas fa-snowflake (AC Cooling Service)</option>
                                <option value="fas fa-car-battery">fas fa-car-battery (Battery Diagnostics)</option>
                                <option value="fas fa-truck-pickup">fas fa-truck-pickup (Flatbed Towing)</option>
                                <option value="fas fa-cog">fas fa-cog (Engine Tuning)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Service Details & Scope</label>
                            <textarea
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm"
                                rows="3"
                                placeholder="Detail what is included in this service package..."
                                value={serviceForm.description}
                                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={serviceForm.is_active}
                                    onChange={(e) => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
                                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                />
                                <span className="text-sm font-semibold text-slate-700">Active in Public Service Menu</span>
                            </label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                onClick={() => setIsServiceModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                                disabled={savingService}
                            >
                                {savingService ? <i className="fas fa-spinner fa-spin"></i> : 'Save Offering'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Remove Service Offering"
        message="Are you sure you want to remove this service offering? This action cannot be undone."
        confirmText="Remove Service"
        confirmColor="red"
    />
            
        </div >
    );
}
