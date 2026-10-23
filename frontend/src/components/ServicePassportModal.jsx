import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../api';
import toast from 'react-hot-toast';

export default function ServicePassportModal({ vehicleId, onClose }) {
    const [loading, setLoading] = useState(true);
    const [passportData, setPassportData] = useState(null);

    useEffect(() => {
        document.body.classList.add('has-print-modal');
        return () => {
            document.body.classList.remove('has-print-modal');
        };
    }, []);

    useEffect(() => {
        if (!vehicleId) return;
        const fetchPassport = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/client/vehicles/${vehicleId}/passport`);
                setPassportData(res.data);
            } catch (err) {
                console.error('Fetch passport failed:', err);
                toast.error('Failed to load vehicle service passport.');
            } finally {
                setLoading(false);
            }
        };
        fetchPassport();
    }, [vehicleId]);

    const handlePrint = () => {
        const originalTitle = document.title;
        const plate = passportData?.vehicle?.license_plate || 'Vehicle';
        document.title = `AutoFusion-Service-Passport-${plate}`;
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 1500);
    };

    if (!vehicleId) return null;

    const modalContent = (
        <div className="printable-modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto print:static print:p-0 print:m-0 print:bg-transparent print:overflow-visible print:block">
            <div className="printable-modal-card bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-fade print:m-0 print:border-none print:shadow-none print:w-full print:max-w-none print:rounded-none" id="printable-passport">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8 text-white relative overflow-hidden print:bg-white print:text-slate-900 print:border-b-2 print:border-blue-600 print:p-4">
                    <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none print:hidden"></div>

                    <div className="flex justify-between items-start gap-4 relative z-10">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-widest mb-3 print:bg-blue-50 print:text-blue-700">
                                <i className="fas fa-certificate text-amber-400"></i> Official Digital Passport
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight print:text-xl print:text-slate-900">
                                Certified Vehicle Service History
                            </h2>
                            <p className="text-slate-400 text-xs sm:text-sm mt-1 print:text-slate-600">
                                Immutable maintenance ledger authenticated by registered AutoFusion Workshop Hubs.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 print:hidden">
                            <button
                                onClick={handlePrint}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1.5"
                                title="Print Passport"
                            >
                                <i className="fas fa-print"></i> Print / PDF
                            </button>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-all"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto custom-scrollbar print:p-4 print:max-h-none print:overflow-visible">
                    {loading ? (
                        <div className="text-center py-16 text-slate-500">
                            <i className="fas fa-spinner fa-spin text-3xl text-blue-600"></i>
                            <p className="mt-3 font-semibold text-sm">Validating cryptographically signed service ledger...</p>
                        </div>
                    ) : passportData ? (
                        <div className="space-y-6">
                            {/* Passport Summary Card */}
                            <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl p-6 border border-slate-200 print:p-4 print:bg-slate-50 print-avoid-break">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle</div>
                                        <div className="text-base font-extrabold text-slate-900 mt-0.5">
                                            {passportData.vehicle.year} {passportData.vehicle.make} {passportData.vehicle.model}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plate Number</div>
                                        <div className="inline-block mt-0.5 px-2.5 py-0.5 rounded-lg bg-amber-100 border border-amber-300 font-mono font-black text-amber-900 text-sm tracking-wider">
                                            {passportData.vehicle.license_plate}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fuel & Odometer</div>
                                        <div className="text-sm font-bold text-slate-800 mt-0.5">
                                            {passportData.vehicle.fuel_type} · {(passportData.certified_passport.last_verified_odometer || 0).toLocaleString()} km
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resale Score</div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-lg font-black text-emerald-600">
                                                {passportData.certified_passport.resale_readiness_score}%
                                            </span>
                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                Certified
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-wrap justify-between items-center text-xs text-slate-500 gap-2">
                                    <span>
                                        <strong>Passport ID:</strong> <span className="font-mono text-slate-700">{passportData.certified_passport.passport_id}</span>
                                    </span>
                                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                                        <i className="fas fa-shield-check"></i> {passportData.certified_passport.verified_services_count} Verified Logged Services
                                    </span>
                                </div>
                            </div>

                            {/* Service Timeline */}
                            <div>
                                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2 print:mb-2">
                                    <i className="fas fa-history text-blue-600"></i> Chronological Service Milestones
                                </h3>

                                {passportData.history.length === 0 ? (
                                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6">
                                        <i className="fas fa-car-crash text-3xl text-slate-400 mb-2"></i>
                                        <p className="text-sm font-semibold text-slate-700">No completed services recorded yet</p>
                                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                                            Once your vehicle completes service bookings through AutoFusion, verified records with workshop seals will automatically populate here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative pl-6 border-l-2 border-blue-200 space-y-6 print:space-y-4">
                                        {passportData.history.map((record, idx) => (
                                            <div key={record.id} className="relative group print-avoid-break">
                                                {/* Bullet */}
                                                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm flex items-center justify-center print:border-slate-300"></div>

                                                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-blue-300 transition-all print:p-3 print:rounded-xl">
                                                    <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                                                        <div>
                                                            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                                                                {new Date(record.preferred_date).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })}
                                                            </div>
                                                            <h4 className="text-base font-extrabold text-slate-900 mt-0.5 print:text-sm">
                                                                {record.shop_name || 'Authorized AutoCare Hub'}
                                                            </h4>
                                                            <p className="text-xs text-slate-500">
                                                                {record.shop_address ? `${record.shop_address}, ${record.city}` : record.city || 'Verified AutoFusion Center'}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                <i className="fas fa-check-circle"></i> OTP Verified
                                                            </span>
                                                            <div className="text-xs font-bold text-slate-500 mt-1">
                                                                Cost: ₹{(record.total_cost || 0).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Services list */}
                                                    {record.services && record.services.length > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-slate-100 print:mt-2 print:pt-2">
                                                            <div className="text-xs font-bold text-slate-600 mb-1.5">Executed Services:</div>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {record.services.map((s) => (
                                                                    <span
                                                                        key={s.id}
                                                                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                                                                    >
                                                                        {s.title}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {record.service_report_summary && (
                                                        <div className="mt-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-700 print:mt-2 print:p-2">
                                                            <strong className="text-blue-900">Workshop Notes:</strong> {record.service_report_summary}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 print:hidden">
                    <span className="flex items-center gap-1.5">
                        <i className="fas fa-lock text-slate-400"></i> Tamper-evident digital vehicle passport
                    </span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-900 text-white transition-all text-xs print:hidden"
                    >
                        Close Passport
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
