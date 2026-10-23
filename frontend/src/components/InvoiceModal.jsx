import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function InvoiceModal({ booking, onClose }) {
    if (!booking) return null;

    useEffect(() => {
        document.body.classList.add('has-print-modal');
        return () => {
            document.body.classList.remove('has-print-modal');
        };
    }, []);

    const invoiceDate = booking.created_at
        ? new Date(booking.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
          })
        : new Date().toLocaleDateString('en-US');

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(booking.id).padStart(5, '0')}`;
    const subtotal = booking.total_cost || 0;
    const gstRate = 0.18; // 18% standard GST
    const gstAmount = Math.round(subtotal * gstRate);
    const grandTotal = subtotal + gstAmount;

    const handlePrint = () => {
        const originalTitle = document.title;
        document.title = `Tax-Invoice-${invoiceNumber}`;
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 1500);
    };

    const modalContent = (
        <div className="printable-modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto print:static print:p-0 print:m-0 print:bg-transparent print:overflow-visible print:block">
            <div className="printable-modal-card bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-fade print:m-0 print:border-none print:shadow-none print:w-full print:max-w-none print:rounded-none">
                {/* Header Controls (Hidden in Print) */}
                <div className="p-4 bg-slate-900 text-white flex justify-between items-center print:hidden">
                    <span className="text-sm font-bold flex items-center gap-2">
                        <i className="fas fa-file-invoice text-blue-400"></i> AutoCare Tax Invoice #{invoiceNumber}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm flex items-center gap-1.5"
                        >
                            <i className="fas fa-print"></i> Download / Print PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs transition-all"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Printable Invoice Body */}
                <div className="p-8 sm:p-10 max-h-[80vh] overflow-y-auto custom-scrollbar print:p-0 print:max-h-none print:overflow-visible print:border-none" id="printable-invoice">
                    {/* Invoice Brand Header */}
                    <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8 print:pb-6 print:mb-6">
                        <div>
                            <div className="flex items-center gap-2 text-2xl font-black text-slate-900">
                                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white text-base">
                                    <i className="fas fa-car-side"></i>
                                </div>
                                AutoFusion<span className="text-blue-600">Pro</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 font-medium">
                                Multi-Tenant Automotive Service & Maintenance Network
                            </p>
                            <div className="text-xs text-slate-600 mt-3 space-y-0.5">
                                <p className="font-bold text-slate-800">{booking.shop_name || 'AutoFusion Partner Hub'}</p>
                                <p>{booking.shop_address || 'Authorized Maintenance Facility'}</p>
                                <p>Support Phone: {booking.shop_phone || '+91 98765 43210'}</p>
                                <p>GSTIN: <span className="font-mono font-semibold">24AAACA0000A1Z5</span></p>
                            </div>
                        </div>

                        <div className="text-right">
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">TAX INVOICE</h1>
                            <div className="mt-2 text-xs text-slate-600 space-y-1">
                                <p>
                                    <span className="text-slate-400 font-semibold">Invoice No:</span>{' '}
                                    <span className="font-mono font-bold text-slate-900">{invoiceNumber}</span>
                                </p>
                                <p>
                                    <span className="text-slate-400 font-semibold">Booking ID:</span>{' '}
                                    <span className="font-mono font-bold text-slate-900">#{booking.id}</span>
                                </p>
                                <p>
                                    <span className="text-slate-400 font-semibold">Date:</span>{' '}
                                    <span className="font-bold text-slate-900">{invoiceDate}</span>
                                </p>
                                <p>
                                    <span className="text-slate-400 font-semibold">Payment Status:</span>{' '}
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${booking.is_paid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {booking.is_paid ? 'PAID' : 'PENDING'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Vehicle Info */}
                    <div className="grid grid-cols-2 gap-6 bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-8 text-xs print:mb-6 print-avoid-break">
                        <div>
                            <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Billed To</div>
                            <div className="font-extrabold text-sm text-slate-900">{booking.customer_name}</div>
                            <div className="text-slate-600 mt-1 space-y-0.5">
                                <p>Phone: {booking.customer_phone}</p>
                                <p>Email: {booking.customer_email}</p>
                            </div>
                        </div>
                        <div>
                            <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Vehicle & Handover Record</div>
                            <div className="font-extrabold text-sm text-slate-900">{booking.vehicle_info}</div>
                            <div className="text-slate-600 mt-1 space-y-0.5">
                                <p>Service Date: {booking.preferred_date} at {booking.preferred_time}</p>
                                <p className="font-semibold text-emerald-700">
                                    <i className="fas fa-shield-alt"></i> OTP Handover Proof: {booking.otp_verified ? 'Verified & Authenticated' : 'Pending Verification'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Itemized Table */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden mb-8 print:mb-6 print-avoid-break">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-4 w-12">#</th>
                                    <th className="py-3 px-4">Service Description</th>
                                    <th className="py-3 px-4 text-center">Type</th>
                                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {booking.services && booking.services.length > 0 ? (
                                    booking.services.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 print-avoid-break">
                                            <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                                            <td className="py-3 px-4 font-bold text-slate-800">{item.title}</td>
                                            <td className="py-3 px-4 text-center text-slate-500">Workshop Package</td>
                                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                                ₹{parseFloat(item.price_at_booking || item.price_starts_at || 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="print-avoid-break">
                                        <td colSpan="4" className="py-4 px-4 text-center text-slate-500">
                                            General AutoCare Workshop Service
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals & Stamp */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-slate-200 pt-6 print-avoid-break">
                        {/* Stamp & Terms */}
                        <div className="space-y-3 max-w-sm">
                            <div className="border-2 border-dashed border-emerald-500/40 rounded-xl p-3 bg-emerald-50/40 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-lg flex-shrink-0">
                                    <i className="fas fa-check-double"></i>
                                </div>
                                <div>
                                    <div className="text-[11px] font-black uppercase text-emerald-900">AutoFusion Official Handover Proof</div>
                                    <div className="text-[10px] text-emerald-700">Digital Handover Verified with 6-Digit Pin. Safe and Guaranteed.</div>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                                Terms: 30-day / 1,000 km warranty on parts replaced by partner workshops. For warranty claims, present this verified invoice.
                            </p>
                        </div>

                        {/* Calculation Box */}
                        <div className="w-full sm:w-64 space-y-2 text-xs">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal</span>
                                <span className="font-mono font-semibold">₹{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>CGST (9%)</span>
                                <span className="font-mono font-semibold">₹{Math.round(gstAmount / 2).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>SGST (9%)</span>
                                <span className="font-mono font-semibold">₹{Math.round(gstAmount / 2).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                                <span>Grand Total</span>
                                <span className="font-mono text-blue-600">₹{grandTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 print:hidden">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all"
                    >
                        Close
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm flex items-center gap-1.5"
                    >
                        <i className="fas fa-print"></i> Print / Download PDF
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
