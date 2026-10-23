import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import PreBookingOtpModal from '../components/PreBookingOtpModal';

const COMMON_BREAKDOWN_ISSUES = [
    { label: "Engine Won't Start", icon: 'fa-exclamation-triangle' },
    { label: 'Flat / Blown Tire', icon: 'fa-circle-notch' },
    { label: 'Dead Battery / No Crank', icon: 'fa-bolt' },
    { label: 'Accident / Collision', icon: 'fa-car-crash' },
    { label: 'Brake System Failure', icon: 'fa-stop-circle' },
    { label: 'Overheating / Smoke', icon: 'fa-temperature-high' },
    { label: 'Gearbox / Clutch Stuck', icon: 'fa-cogs' },
    { label: 'Fuel Depleted / Leak', icon: 'fa-gas-pump' }
];

export default function RequestTowingPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const urlVehicleId = searchParams.get('vehicle_id');

    const [formData, setFormData] = useState({
        full_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username : '',
        email: user ? user.email || '' : '',
        phone_number: user?.phone || '',
        vehicle_details: '',
        pickup_address: '',
        latitude: '',
        longitude: '',
    });

    const [vehicles, setVehicles] = useState([]);
    const [loadingVehicles, setLoadingVehicles] = useState(true);
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [selectedIssue, setSelectedIssue] = useState('');
    const [breakdownNotes, setBreakdownNotes] = useState('');
    const [customVehicle, setCustomVehicle] = useState({
        makeModel: '',
        licensePlate: ''
    });

    // Nearest Store & Live Pricing State
    const [nearestInfo, setNearestInfo] = useState(null);
    const [loadingNearest, setLoadingNearest] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');

    const [locationLoading, setLocationLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [gpsSuccess, setGpsSuccess] = useState(false);
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

    useEffect(() => {
        if (user?.phone && !formData.phone_number) {
            setFormData(prev => ({ ...prev, phone_number: user.phone }));
        }
    }, [user]);

    useEffect(() => {
        const fetchUserProfilePhone = async () => {
            try {
                const res = await api.get('/client/profile');
                if (res.data?.user?.phone) {
                    setFormData(prev => ({ ...prev, phone_number: prev.phone_number || res.data.user.phone }));
                }
            } catch (e) {}
        };
        fetchUserProfilePhone();
    }, []);

    // Load user vehicles
    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                setLoadingVehicles(true);
                const res = await api.get('/client/vehicles');
                const vList = res.data?.vehicles || [];
                setVehicles(vList);

                if (vList.length > 0) {
                    // Match URL vehicle_id, primary, or fallback to first
                    let matched = null;
                    if (urlVehicleId) {
                        matched = vList.find(v => String(v.id) === String(urlVehicleId));
                    }
                    if (!matched) {
                        matched = vList.find(v => v.is_primary) || vList[0];
                    }

                    if (matched) {
                        setSelectedVehicleId(String(matched.id));
                        const baseText = `${matched.year ? matched.year + ' ' : ''}${matched.make} ${matched.model} (${matched.license_plate})`;
                        setFormData(prev => ({
                            ...prev,
                            vehicle_details: prev.vehicle_details || baseText
                        }));
                    }
                } else {
                    setSelectedVehicleId('custom');
                }
            } catch (err) {
                console.error('Failed to load vehicles for towing:', err);
                setSelectedVehicleId('custom');
            } finally {
                setLoadingVehicles(false);
            }
        };

        fetchVehicles();
    }, [urlVehicleId]);

    // Fetch nearest shop based on coordinates
    const fetchNearestShop = async (lat, lng) => {
        try {
            setLoadingNearest(true);
            const res = await api.get('/portal/towing/nearest-shop', {
                params: {
                    latitude: lat || undefined,
                    longitude: lng || undefined
                }
            });
            setNearestInfo(res.data);
        } catch (err) {
            console.error('Failed to detect nearest towing shop:', err);
        } finally {
            setLoadingNearest(false);
        }
    };

    // Calculate nearest store whenever coordinates change or on initial mount
    useEffect(() => {
        fetchNearestShop(formData.latitude, formData.longitude);
    }, [formData.latitude, formData.longitude]);

    // Helper to compute vehicle details string
    const updateVehicleDetails = (vehId, issue = selectedIssue, notes = breakdownNotes, custom = customVehicle) => {
        let text = '';
        if (vehId && vehId !== 'custom') {
            const v = vehicles.find(item => String(item.id) === String(vehId));
            if (v) {
                text = `${v.year ? v.year + ' ' : ''}${v.make} ${v.model} (${v.license_plate})`;
            }
        } else if (vehId === 'custom') {
            const parts = [];
            if (custom.makeModel?.trim()) parts.push(custom.makeModel.trim());
            if (custom.licensePlate?.trim()) parts.push(`(${custom.licensePlate.trim()})`);
            text = parts.join(' ');
        }

        const conditionParts = [];
        if (issue) conditionParts.push(issue);
        if (notes?.trim()) conditionParts.push(notes.trim());

        if (conditionParts.length > 0) {
            if (text) {
                text += ` - ${conditionParts.join(', ')}`;
            } else {
                text = conditionParts.join(', ');
            }
        }

        setFormData(prev => ({ ...prev, vehicle_details: text }));
    };

    const handleSelectVehicle = (newId) => {
        setSelectedVehicleId(newId);
        updateVehicleDetails(newId, selectedIssue, breakdownNotes, customVehicle);
    };

    const handleIssueToggle = (issueLabel) => {
        const nextIssue = selectedIssue === issueLabel ? '' : issueLabel;
        setSelectedIssue(nextIssue);
        updateVehicleDetails(selectedVehicleId, nextIssue, breakdownNotes, customVehicle);
    };

    const handleBreakdownNotesChange = (e) => {
        const notes = e.target.value;
        setBreakdownNotes(notes);
        updateVehicleDetails(selectedVehicleId, selectedIssue, notes, customVehicle);
    };

    const handleCustomVehicleChange = (field, val) => {
        const updated = { ...customVehicle, [field]: val };
        setCustomVehicle(updated);
        updateVehicleDetails('custom', selectedIssue, breakdownNotes, updated);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser.');
            return;
        }

        setLocationLoading(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude.toFixed(6);
                const lng = position.coords.longitude.toFixed(6);
                setFormData(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                    pickup_address: prev.pickup_address || `GPS Coordinates: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
                }));
                setGpsSuccess(true);
                setLocationLoading(false);
                toast.success('GPS coordinates locked! Nearest towing hub updated.');
            },
            (err) => {
                console.warn('Geolocation error:', err.message);
                // Fallback default coordinates if permission denied
                const fallbackLat = '23.022500';
                const fallbackLng = '72.571400';
                setFormData(prev => ({
                    ...prev,
                    latitude: fallbackLat,
                    longitude: fallbackLng,
                }));
                setGpsSuccess(true);
                setLocationLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.full_name || !formData.phone_number || !formData.email || !formData.vehicle_details || !formData.pickup_address) {
            toast.error('Please fill in all required breakdown details, including your email and vehicle info.');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/portal/send-otp', {
                email: formData.email,
                contextMessage: 'Your AutoFusion Emergency Towing Verification Code'
            });
            setIsOtpModalOpen(true);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to send OTP to your email. Please check your email address.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifyAndSubmit = async (otpCode) => {
        const payload = {
            ...formData,
            otp: otpCode,
            payment_method: paymentMethod
        };
        const res = await api.post('/portal/towing', payload);
        const { towing } = res.data;
        setIsOtpModalOpen(false);
        navigate(`/towing/${towing.id}`);
    };

    const selectedVehicle = vehicles.find(v => String(v.id) === String(selectedVehicleId));

    return (
        <div className="animate-fade max-w-3xl mx-auto my-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-700 rounded-2xl p-8 sm:p-10 text-white mb-8 shadow-xl shadow-red-500/20">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
                        <i className="fas fa-truck-pickup"></i>
                    </div>
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-red-100 block">
                            24/7 Roadside Assistance
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                            Emergency Towing Request
                        </h1>
                    </div>
                </div>
                <p className="text-red-100 text-sm sm:text-base leading-relaxed">
                    Immediate breakdown rescue service. Transmit instant GPS coordinates to automatically dispatch the nearest towing hub with live distance-based pricing.
                </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Driver & Contact Details */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                            <i className="fas fa-user-circle text-red-500 mr-2"></i>
                            Driver & Contact Details
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                                    placeholder="John Doe"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-semibold text-slate-700">Active Contact Number</label>
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">Editable</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="tel"
                                    name="phone_number"
                                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 font-medium"
                                    placeholder="e.g. 9876543210"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    required
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <i className="fas fa-phone text-xs"></i>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">Pre-filled from your profile. Feel free to edit for this dispatch.</p>
                        </div>
                    </div>

                    {/* Car Selection Section */}
                    <div className="pt-6 border-t border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center">
                                <i className="fas fa-car text-red-500 mr-2"></i>
                                Car & Breakdown Details
                            </h3>
                            <Link
                                to="/garage"
                                className="text-xs text-red-600 hover:text-red-700 font-semibold inline-flex items-center gap-1.5 transition-colors"
                            >
                                <i className="fas fa-warehouse"></i> My Garage
                            </Link>
                        </div>

                        {/* Car Select Dropdown */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="car-select" className="block text-sm font-semibold text-slate-700">
                                    Select Car
                                </label>
                                {vehicles.length > 0 && (
                                    <span className="text-xs text-slate-500 font-medium">
                                        {vehicles.length} vehicle{vehicles.length > 1 ? 's' : ''} available
                                    </span>
                                )}
                            </div>

                            <select
                                id="car-select"
                                value={selectedVehicleId}
                                onChange={(e) => handleSelectVehicle(e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 font-medium transition-colors"
                            >
                                {vehicles.length > 0 ? (
                                    <>
                                        <option value="" disabled>-- Choose a vehicle from your garage --</option>
                                        {vehicles.map((v) => (
                                            <option key={v.id} value={String(v.id)}>
                                                {v.year} {v.make} {v.model} ({v.license_plate}) - {v.fuel_type} {v.is_primary ? '★ [Primary Car]' : ''}
                                            </option>
                                        ))}
                                        <option value="custom">+ Other / Enter Unregistered Vehicle Manually</option>
                                    </>
                                ) : (
                                    <option value="custom">Enter Custom Vehicle (No saved cars in garage)</option>
                                )}
                            </select>
                        </div>

                        {/* Quick Select Car Pills/Cards (when garage vehicles exist) */}
                        {vehicles.length > 0 && (
                            <div className="mb-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-slate-800">
                                        <i className="fas fa-bolt text-red-500"></i> Quick Select From Garage
                                    </span>
                                    <span className="text-[11px] text-red-600 font-semibold">1-Click Pick</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {vehicles.map(v => {
                                        const isSelected = String(selectedVehicleId) === String(v.id);
                                        return (
                                            <button
                                                type="button"
                                                key={v.id}
                                                onClick={() => handleSelectVehicle(String(v.id))}
                                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                                                    isSelected
                                                        ? 'bg-red-50 text-red-700 border-red-500 shadow-sm ring-2 ring-red-500/20'
                                                        : 'bg-white text-slate-700 border-slate-300 hover:border-red-300 hover:bg-slate-50'
                                                }`}
                                            >
                                                <i className={`fas fa-car ${isSelected ? 'text-red-600' : 'text-slate-400'}`}></i>
                                                <span className="font-mono">{v.license_plate}</span>
                                                <span className="text-slate-500 font-normal">({v.make} {v.model})</span>
                                                {v.is_primary && (
                                                    <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase">
                                                        Primary
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                    <button
                                        type="button"
                                        onClick={() => handleSelectVehicle('custom')}
                                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border border-dashed flex items-center gap-1.5 ${
                                            selectedVehicleId === 'custom'
                                                ? 'bg-red-50 text-red-700 border-red-500 ring-2 ring-red-500/20'
                                                : 'bg-white text-slate-500 border-slate-300 hover:border-slate-400 hover:text-slate-800'
                                        }`}
                                    >
                                        <i className="fas fa-plus text-[10px]"></i> Other Vehicle
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Garage Empty Notice */}
                        {!loadingVehicles && vehicles.length === 0 && (
                            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-info-circle text-amber-600 text-sm"></i>
                                    <span>No cars registered in your garage yet. Save your vehicle to speed up emergency towing and repair bookings.</span>
                                </div>
                                <Link to="/garage" className="ml-3 shrink-0 font-bold text-amber-900 underline hover:text-amber-700">
                                    + Add Car to Garage
                                </Link>
                            </div>
                        )}

                        {/* Selected Car Details Banner */}
                        {selectedVehicle && selectedVehicleId !== 'custom' && (
                            <div className="mb-4 p-3 bg-red-50/70 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-900">
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-check-circle text-red-600 text-sm"></i>
                                    <span>
                                        Selected: <strong className="font-bold">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</strong> (<span className="font-mono">{selectedVehicle.license_plate}</span>) • {selectedVehicle.fuel_type}
                                    </span>
                                </div>
                                <span className="font-semibold text-slate-500 text-[11px]">
                                    {selectedVehicle.odometer_km ? `${selectedVehicle.odometer_km.toLocaleString()} km` : ''}
                                </span>
                            </div>
                        )}

                        {/* Manual / Custom Vehicle Inputs (if selectedVehicleId === 'custom') */}
                        {selectedVehicleId === 'custom' && (
                            <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <i className="fas fa-edit text-red-500"></i> Enter Unregistered Vehicle Details
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Make & Model</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                                            placeholder="e.g. White Toyota Fortuner"
                                            value={customVehicle.makeModel}
                                            onChange={(e) => handleCustomVehicleChange('makeModel', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">License Plate / Reg. No.</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white uppercase font-mono focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                                            placeholder="e.g. GJ-01-AB-1234"
                                            value={customVehicle.licensePlate}
                                            onChange={(e) => handleCustomVehicleChange('licensePlate', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Breakdown Cause / Issue Tags */}
                        <div className="mb-4">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                                <i className="fas fa-wrench text-red-500"></i> Breakdown Reason / Problem (Quick Select)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {COMMON_BREAKDOWN_ISSUES.map((issue) => {
                                    const isSelected = selectedIssue === issue.label;
                                    return (
                                        <button
                                            type="button"
                                            key={issue.label}
                                            onClick={() => handleIssueToggle(issue.label)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                                                isSelected
                                                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-red-300 hover:bg-red-50/50'
                                            }`}
                                        >
                                            <i className={`fas ${issue.icon} text-[11px]`}></i>
                                            {issue.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Specific Breakdown Notes */}
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Specific Breakdown Notes (Optional)
                            </label>
                            <input
                                type="text"
                                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                                placeholder="e.g. Front left wheel punctured, smoking from under hood, stalled on bridge"
                                value={breakdownNotes}
                                onChange={handleBreakdownNotesChange}
                            />
                        </div>

                        {/* Final Dispatched Vehicle Details (Editable) */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Vehicle & Breakdown Details for Dispatch
                                </label>
                                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                                    Transmitted to Driver
                                </span>
                            </div>
                            <input
                                type="text"
                                name="vehicle_details"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 font-medium"
                                placeholder="e.g. 2022 Toyota Fortuner (GJ-01-AB-1234) - Flat / Blown Tire"
                                value={formData.vehicle_details}
                                onChange={handleChange}
                                required
                            />
                            <p className="text-[11px] text-slate-400 mt-1">
                                Generated automatically from your car selection above. You can also customize or type additional details directly.
                            </p>
                        </div>
                    </div>

                    {/* Breakdown Location & GPS */}
                    <div className="pt-6 border-t border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                            <i className="fas fa-map-marker-alt text-red-500 mr-2"></i>
                            Breakdown Location & GPS
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-semibold text-slate-700">Pickup Address / Landmark</label>
                                    <button
                                        type="button"
                                        onClick={handleGetLocation}
                                        className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3 py-1 text-xs font-semibold rounded-lg transition-colors"
                                        disabled={locationLoading}
                                    >
                                        {locationLoading ? (
                                            <><i className="fas fa-spinner fa-spin"></i> Detecting GPS...</>
                                        ) : (
                                            <><i className="fas fa-crosshairs"></i> Use My Current GPS Location</>
                                        )}
                                    </button>
                                </div>
                                <textarea
                                    name="pickup_address"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                                    rows="3"
                                    placeholder="e.g. Near Iscon Bridge exit, SG Highway northbound lane"
                                    value={formData.pickup_address}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">GPS Latitude</label>
                                    <input
                                        type="text"
                                        name="latitude"
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                                        placeholder="23.022500"
                                        value={formData.latitude}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">GPS Longitude</label>
                                    <input
                                        type="text"
                                        name="longitude"
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                                        placeholder="72.571400"
                                        value={formData.longitude}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {gpsSuccess && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center">
                            <i className="fas fa-satellite-dish mr-2"></i> GPS location locked: [{formData.latitude}, {formData.longitude}]
                        </div>
                    )}

                    {/* Nearest Towing Hub & Live Pricing Quote Card */}
                    {nearestInfo && nearestInfo.nearest_shop && (
                        <div className="pt-6 border-t border-slate-200">
                            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center">
                                    <i className="fas fa-radar text-red-500 mr-2"></i>
                                    Assigned Nearest Hub & Towing Quote
                                </h3>
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Nearest Store Assigned
                                </span>
                            </div>

                            <div className="bg-gradient-to-br from-slate-50 to-red-50/40 rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
                                {/* Workshop Header Info */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block mb-0.5">
                                            Closest Towing Store (Receiving Dispatch)
                                        </span>
                                        <h4 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                            {nearestInfo.nearest_shop.shop_name}
                                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                                                {nearestInfo.distance_km} km away
                                            </span>
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1 flex items-center flex-wrap gap-x-3 gap-y-1">
                                            <span>
                                                <i className="fas fa-map-marker-alt text-red-500 mr-1"></i>
                                                {nearestInfo.nearest_shop.shop_address}, {nearestInfo.nearest_shop.city}
                                            </span>
                                            {nearestInfo.nearest_shop.phone_number && (
                                                <a href={`tel:${nearestInfo.nearest_shop.phone_number}`} className="text-blue-600 font-semibold hover:underline">
                                                    <i className="fas fa-phone mr-1"></i> {nearestInfo.nearest_shop.phone_number}
                                                </a>
                                            )}
                                        </p>
                                    </div>
                                    <div className="sm:text-right shrink-0 bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200 w-full sm:w-auto">
                                        <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Estimated Driver Arrival</span>
                                        <span className="text-xl font-black text-red-600 flex items-center sm:justify-end gap-1.5 mt-0.5">
                                            <i className="fas fa-clock text-base"></i> ~{nearestInfo.eta_minutes} Minutes
                                        </span>
                                    </div>
                                </div>

                                {/* Pricing Breakdown */}
                                <div className="pt-4 space-y-2 text-sm">
                                    <div className="flex justify-between items-center text-slate-600">
                                        <span className="flex items-center gap-1.5">
                                            <i className="fas fa-truck text-slate-400 text-xs"></i>
                                            Base Hookup / Dispatch Fee ({nearestInfo.nearest_shop.shop_name}):
                                        </span>
                                        <span className="font-semibold text-slate-900">₹{parseFloat(nearestInfo.base_fee || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-600">
                                        <span className="flex items-center gap-1.5">
                                            <i className="fas fa-route text-slate-400 text-xs"></i>
                                            Distance Road Fee ({nearestInfo.distance_km} km @ ₹{nearestInfo.per_km_rate}/km):
                                        </span>
                                        <span className="font-semibold text-slate-900">₹{parseFloat(nearestInfo.distance_cost || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="pt-3 mt-2 border-t border-slate-200 flex justify-between items-center">
                                        <div>
                                            <span className="text-base font-extrabold text-slate-900 block">Total Estimated Towing Price</span>
                                            <span className="text-[11px] text-slate-500">Calculated directly from nearest store rates</span>
                                        </div>
                                        <span className="text-2xl sm:text-3xl font-black text-red-600">
                                            ₹{parseFloat(nearestInfo.estimated_cost || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Payment Method Selector */}
                                <div className="mt-5 pt-4 border-t border-slate-200">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                        Payment Method
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                            paymentMethod === 'cash' ? 'border-red-600 bg-white ring-2 ring-red-600/20 shadow-sm' : 'border-slate-200 bg-white/70 hover:border-slate-300'
                                        }`}>
                                            <div className="flex items-center gap-2.5">
                                                <input
                                                    type="radio"
                                                    name="payment_method"
                                                    value="cash"
                                                    checked={paymentMethod === 'cash'}
                                                    onChange={() => setPaymentMethod('cash')}
                                                    className="text-red-600 focus:ring-red-500"
                                                />
                                                <div>
                                                    <span className="font-bold text-xs text-slate-900 block">Pay Upon Driver Arrival</span>
                                                    <span className="text-[10px] text-slate-500">Cash / UPI directly to tow truck driver</span>
                                                </div>
                                            </div>
                                            <i className="fas fa-money-bill-wave text-emerald-600 text-base"></i>
                                        </label>

                                        <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                            paymentMethod === 'online' ? 'border-red-600 bg-white ring-2 ring-red-600/20 shadow-sm' : 'border-slate-200 bg-white/70 hover:border-slate-300'
                                        }`}>
                                            <div className="flex items-center gap-2.5">
                                                <input
                                                    type="radio"
                                                    name="payment_method"
                                                    value="online"
                                                    checked={paymentMethod === 'online'}
                                                    onChange={() => setPaymentMethod('online')}
                                                    className="text-red-600 focus:ring-red-500"
                                                />
                                                <div>
                                                    <span className="font-bold text-xs text-slate-900 block">Online / Digital Invoice</span>
                                                    <span className="text-[10px] text-slate-500">Instant digital bill on dispatch completion</span>
                                                </div>
                                            </div>
                                            <i className="fas fa-credit-card text-blue-600 text-base"></i>
                                        </label>
                                    </div>
                                </div>

                                <div className="mt-4 p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-blue-900 text-xs flex items-center gap-2.5">
                                    <i className="fas fa-info-circle text-blue-600 text-base shrink-0"></i>
                                    <span>
                                        This request will be sent exclusively to <strong>{nearestInfo.nearest_shop.shop_name}</strong>. Only this nearest workshop will receive and handle your dispatch.
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-3.5 px-5 rounded-xl text-base font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 transition-colors flex items-center justify-center gap-2"
                        disabled={submitting}
                    >
                        {submitting ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-paper-plane"></i> Dispatch Emergency Tow Truck</>}
                    </button>
                </form>
            </div>

            <PreBookingOtpModal
                isOpen={isOtpModalOpen}
                onClose={() => setIsOtpModalOpen(false)}
                onVerify={handleVerifyAndSubmit}
                email={formData.email}
            />
        </div>
    );
}
