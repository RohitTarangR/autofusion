import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import ServicePassportModal from '../components/ServicePassportModal';

export default function ClientGaragePage() {
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [passportVehicleId, setPassportVehicleId] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        license_plate: '',
        vin: '',
        fuel_type: 'Petrol',
        odometer_km: '',
        is_primary: false,
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const res = await api.get('/client/vehicles');
            setVehicles(res.data.vehicles || []);
        } catch (err) {
            console.error('Fetch garage vehicles error:', err);
            toast.error('Failed to load your garage vehicles.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const handleOpenAdd = () => {
        setFormData({
            make: '',
            model: '',
            year: new Date().getFullYear(),
            license_plate: '',
            vin: '',
            fuel_type: 'Petrol',
            odometer_km: '',
            is_primary: vehicles.length === 0,
        });
        setIsAddModalOpen(true);
    };

    const handleOpenEdit = (v) => {
        setEditingVehicle(v);
        setFormData({
            make: v.make,
            model: v.model,
            year: v.year,
            license_plate: v.license_plate,
            vin: v.vin || '',
            fuel_type: v.fuel_type || 'Petrol',
            odometer_km: v.odometer_km || '',
            is_primary: v.is_primary,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.make || !formData.model || !formData.license_plate) {
            toast.error('Please enter Make, Model, and License Plate.');
            return;
        }

        try {
            setSubmitting(true);
            if (editingVehicle) {
                await api.put(`/client/vehicles/${editingVehicle.id}`, formData);
                toast.success('Vehicle updated successfully!');
                setEditingVehicle(null);
            } else {
                await api.post('/client/vehicles', formData);
                toast.success('Vehicle added to your Garage!');
                setIsAddModalOpen(false);
            }
            fetchVehicles();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save vehicle details');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, plate) => {
        if (!window.confirm(`Are you sure you want to remove vehicle ${plate} from your garage?`)) return;

        try {
            await api.delete(`/client/vehicles/${id}`);
            toast.success('Vehicle removed from garage');
            fetchVehicles();
        } catch (err) {
            toast.error('Failed to delete vehicle');
        }
    };

    const handleMakePrimary = async (v) => {
        try {
            await api.put(`/client/vehicles/${v.id}`, { ...v, is_primary: true });
            toast.success(`${v.make} ${v.model} is now your primary vehicle`);
            fetchVehicles();
        } catch (err) {
            toast.error('Failed to set primary vehicle');
        }
    };

    return (
        <div className="animate-fade max-w-6xl mx-auto my-4">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider mb-2">
                        <i className="fas fa-warehouse text-blue-600"></i> Multi-Vehicle Management
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        My Garage & Digital Passports
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Register your cars to 1-click book maintenance, request emergency towing, and track certified service histories.
                    </p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                    <i className="fas fa-plus-circle"></i> Add New Vehicle
                </button>
            </div>

            {/* Garage Grid */}
            {loading ? (
                <div className="text-center py-20 text-slate-500">
                    <i className="fas fa-spinner fa-spin text-3xl text-blue-600"></i>
                    <p className="mt-3 font-semibold text-sm">Opening your garage doors...</p>
                </div>
            ) : vehicles.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mx-auto mb-4">
                        <i className="fas fa-car"></i>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Your Garage is Empty</h2>
                    <p className="text-slate-500 text-sm mb-6">
                        Add your personal or family vehicles once to speed up booking repairs, towing requests, and unlock certified digital maintenance passports.
                    </p>
                    <button
                        onClick={handleOpenAdd}
                        className="px-6 py-3 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all inline-flex items-center gap-2"
                    >
                        <i className="fas fa-plus-circle"></i> Add First Car to Garage
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vehicles.map((v) => (
                        <div
                            key={v.id}
                            className={`bg-white rounded-3xl border transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden flex flex-col justify-between ${
                                v.is_primary ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'
                            }`}
                        >
                            {/* Card Top */}
                            <div className="p-6">
                                <div className="flex justify-between items-start gap-2 mb-3">
                                    <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 tracking-wider">
                                        {v.license_plate}
                                    </span>
                                    {v.is_primary ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                            <i className="fas fa-star text-amber-500"></i> Primary Vehicle
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleMakePrimary(v)}
                                            className="text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors"
                                        >
                                            Set as primary
                                        </button>
                                    )}
                                </div>

                                <h3 className="text-xl font-black text-slate-900">
                                    {v.year} {v.make} {v.model}
                                </h3>

                                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
                                    <div>
                                        <span className="text-slate-400 font-bold block uppercase text-[10px]">Fuel Type</span>
                                        <span className="font-extrabold text-slate-800 mt-0.5 inline-flex items-center gap-1">
                                            <i className="fas fa-gas-pump text-slate-400"></i> {v.fuel_type}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-bold block uppercase text-[10px]">Odometer</span>
                                        <span className="font-extrabold text-slate-800 mt-0.5 inline-flex items-center gap-1">
                                            <i className="fas fa-tachometer-alt text-slate-400"></i> {(v.odometer_km || 0).toLocaleString()} km
                                        </span>
                                    </div>
                                </div>

                                {v.vin && (
                                    <div className="mt-3 text-[11px] text-slate-500">
                                        <span className="font-bold text-slate-400">VIN:</span> <span className="font-mono">{v.vin}</span>
                                    </div>
                                )}

                                <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                                    <span className="text-slate-500 font-medium">Logged Services:</span>
                                    <span className="font-black text-blue-600">
                                        {v.service_count} Completed
                                    </span>
                                </div>
                            </div>

                            {/* Card Actions */}
                            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPassportVehicleId(v.id)}
                                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-white text-slate-800 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                    >
                                        <i className="fas fa-certificate text-amber-500"></i> Service Passport
                                    </button>
                                        <button
                                            onClick={() => navigate(`/book-service?vehicle_id=${v.id}`)}
                                            className="py-2 px-3.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm flex items-center justify-center gap-1.5"
                                            title="Book Service with this Car"
                                        >
                                            <i className="fas fa-tools"></i> Book
                                        </button>
                                        <button
                                            onClick={() => navigate(`/towing-request?vehicle_id=${v.id}`)}
                                            className="py-2 px-3 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 transition-all shadow-sm flex items-center justify-center gap-1.5"
                                            title="Request Towing for this Car"
                                        >
                                            <i className="fas fa-truck-pickup"></i> Tow
                                        </button>
                                    </div>

                                <div className="flex justify-between items-center pt-1 px-1 text-xs">
                                    <button
                                        onClick={() => handleOpenEdit(v)}
                                        className="text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1"
                                    >
                                        <i className="fas fa-edit"></i> Edit Details
                                    </button>
                                    <button
                                        onClick={() => handleDelete(v.id, v.license_plate)}
                                        className="text-red-500 hover:text-red-700 font-semibold inline-flex items-center gap-1"
                                    >
                                        <i className="fas fa-trash-alt"></i> Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add / Edit Vehicle Modal */}
            {(isAddModalOpen || editingVehicle) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-fade">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black">
                                    {editingVehicle ? 'Edit Vehicle Details' : 'Register Vehicle in My Garage'}
                                </h3>
                                <p className="text-slate-400 text-xs mt-0.5">
                                    Fill in your vehicle credentials to manage service bookings.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setEditingVehicle(null);
                                }}
                                className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center text-xs"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Make *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Toyota, Hyundai"
                                        value={formData.make}
                                        onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                                        className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Model *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Fortuner, Creta"
                                        value={formData.model}
                                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                        className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Registration Year
                                    </label>
                                    <input
                                        type="number"
                                        min="1990"
                                        max={new Date().getFullYear() + 1}
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                        className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        License Plate Number *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. GJ-01-AB-1234"
                                        value={formData.license_plate}
                                        onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                                        className="w-full text-xs rounded-xl border border-slate-300 p-2.5 uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Fuel Type
                                    </label>
                                    <select
                                        value={formData.fuel_type}
                                        onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                                        className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Petrol">Petrol</option>
                                        <option value="Diesel">Diesel</option>
                                        <option value="Electric">Electric (EV)</option>
                                        <option value="Hybrid">Hybrid</option>
                                        <option value="CNG">CNG</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Odometer (km)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Current reading"
                                        value={formData.odometer_km}
                                        onChange={(e) => setFormData({ ...formData, odometer_km: e.target.value })}
                                        className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Chassis / VIN Number (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="17-character VIN"
                                    value={formData.vin}
                                    onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_primary}
                                        onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                    />
                                    Set as primary vehicle for quick bookings
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        setEditingVehicle(null);
                                    }}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Add to Garage'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Digital Service Passport Modal */}
            {passportVehicleId && (
                <ServicePassportModal
                    vehicleId={passportVehicleId}
                    onClose={() => setPassportVehicleId(null)}
                />
            )}
        </div>
    );
}
