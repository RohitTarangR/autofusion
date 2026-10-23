import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function ClientProfilePage() {
    const { user, refreshUser } = useAuth();
    const [profileData, setProfileData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
    });
    const [shops, setShops] = useState([]);
    const [selectedShopId, setSelectedShopId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/client/profile');
                setProfileData({
                    first_name: res.data.user?.first_name || '',
                    last_name: res.data.user?.last_name || '',
                    email: res.data.user?.email || '',
                    phone: res.data.user?.phone || '',
                });
                setShops(res.data.shops || []);
                setSelectedShopId(res.data.selected_shop_id || '');
            } catch (err) {
                console.error('Fetch profile failed:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        ;
        ;

        try {
            await api.post('/client/profile', profileData);
            if (selectedShopId) {
                await api.post('/client/select-shop', { select_shop_id: selectedShopId });
            }
            toast.success('Profile and service shop preferences updated successfully!');
            refreshUser();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-16 text-slate-500">
                <i className="fas fa-spinner fa-spin text-2xl"></i>
                <p className="mt-2 text-sm">Loading profile...</p>
            </div>
        );
    }

    const currentShop = shops.find(s => s.id === parseInt(selectedShopId, 10));

    return (
        <div className="animate-fade max-w-2xl mx-auto my-6">
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Client Account & Workshop Settings</h1>
                <p className="text-slate-500 text-sm sm:text-base mt-1">
                    Configure personal details and select your preferred authorized repair hub.
                </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center">
                        <i className="fas fa-user-edit text-blue-600 mr-2"></i>
                        Personal Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">First Name</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                                value={profileData.first_name}
                                onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                                value={profileData.last_name}
                                onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                                value={profileData.email}
                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                                placeholder="e.g. 9876543210"
                                value={profileData.phone}
                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200">
                        <label className="block text-base font-bold text-slate-900 mb-1">
                            <i className="fas fa-store text-blue-600 mr-2"></i>
                            Preferred Authorized Service Hub
                        </label>
                        <p className="text-slate-500 text-xs sm:text-sm mb-3">
                            All new maintenance bookings and towing dispatch will default to this service workshop.
                        </p>
                        <select
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                            value={selectedShopId}
                            onChange={(e) => setSelectedShopId(e.target.value)}
                        >
                            <option value="">-- Choose a Service Workshop Hub --</option>
                            {shops.map((shop) => (
                                <option key={shop.id} value={shop.id}>
                                    {shop.shop_name} ({shop.city}) {shop.avg_rating > 0 ? `· ★ ${shop.avg_rating} (${shop.review_count})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {currentShop && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 space-y-1.5">
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-bold text-slate-900 flex items-center">
                                    <i className="fas fa-store text-blue-600 mr-2"></i>
                                    {currentShop.shop_name}
                                </p>
                                {currentShop.avg_rating > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                        <i className="fas fa-star text-amber-500"></i> {currentShop.avg_rating} ({currentShop.review_count} reviews)
                                    </span>
                                )}
                            </div>
                            <p><strong>Address:</strong> {currentShop.shop_address}, {currentShop.city}</p>
                            <p><strong>Phone:</strong> {currentShop.phone_number}</p>
                            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-4 text-xs text-slate-500">
                                <span><i className="fas fa-car mr-1 text-slate-400"></i> Max <strong>{currentShop.max_concurrent_bookings || 3} cars</strong> per slot</span>
                                <span><i className="fas fa-calendar-times mr-1 text-slate-400"></i> Closed on <strong>{currentShop.closed_days || 'Sunday'}s</strong></span>
                            </div>
                        </div>
                    )}


                    <button
                        type="submit"
                        className="w-full py-3 px-5 rounded-lg text-base font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-6 shadow-sm"
                        disabled={saving}
                    >
                        {saving ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-save"></i> Save Profile & Shop Preferences</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
