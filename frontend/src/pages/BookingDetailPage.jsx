import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import OtpModal from '../components/OtpModal';
import StripePaymentModal from '../components/StripePaymentModal';
import ConfirmModal from '../components/ConfirmModal';
import InvoiceModal from '../components/InvoiceModal';
import ReviewModal from '../components/ReviewModal';

export default function BookingDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] = useState(null);
    const [existingReview, setExistingReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isStripeOpen, setIsStripeOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    const fetchBooking = async () => {
        try {
            const res = await api.get(`/portal/bookings/${id}`);
            setBooking(res.data.booking);

            if (res.data.booking?.status === 'completed') {
                try {
                    const revRes = await api.get(`/portal/reviews/booking/${id}`);
                    setExistingReview(revRes.data?.review || null);
                } catch (e) {
                    // Ignore review fetch error
                }
            }
        } catch (err) {
            console.error('Fetch booking detail error:', err);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchBooking();
        const interval = setInterval(() => {
            fetchBooking();
        }, 5000);
        return () => clearInterval(interval);
    }, [id]);


    const handlePaymentSuccess = async (paymentIntentId) => {
        try {
            await api.post('/portal/payment/verify', { payment_intent_id: paymentIntentId, booking_id: booking.id });
            setIsStripeOpen(false);
            toast.success('Payment confirmed successfully!');
            fetchBooking();
        } catch (err) {
            toast.error('Payment verification failed.');
        }
    };

    const handleCancel = () => {
        setIsCancelModalOpen(true);
    };

    const confirmCancel = async () => {
        try {
            await api.delete(`/portal/bookings/${id}`);
            toast.success('Booking cancelled successfully.');
            fetchBooking();
            setIsCancelModalOpen(false);
        } catch (err) {
            console.error('Failed to cancel booking:', err);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-16 text-slate-500">
                <i className="fas fa-spinner fa-spin text-2xl"></i>
                <p className="mt-2 text-sm">Loading booking details...</p>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto my-8 shadow-sm">
                <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4 block"></i>
                <h2 className="text-xl font-bold text-slate-900">Booking Not Found</h2>
                <p className="text-slate-500 text-sm mt-2 mb-6">The requested service booking does not exist or has been removed.</p>
                <Link to="/service-orders" className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm">
                    Back to Orders
                </Link>
            </div>
        );
    }

    return (
        <div className="animate-fade max-w-4xl mx-auto my-4">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <Link to="/service-orders" className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 mb-2 transition-colors">
                        <i className="fas fa-arrow-left"></i> Back to Service Orders
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Service Booking #{booking.id}</h1>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                    <StatusBadge status={booking.status} />

                    {/* Tax Invoice Download */}
                    <button
                        onClick={() => setIsInvoiceOpen(true)}
                        className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                        title="Download official tax invoice"
                    >
                        <i className="fas fa-file-invoice"></i> Tax Invoice / PDF
                    </button>

                    {/* Rating and Review Button */}
                    {booking.status === 'completed' && (
                        existingReview ? (
                            <span className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-amber-50 border border-amber-200 text-amber-800 inline-flex items-center gap-1.5">
                                <i className="fas fa-star text-amber-500"></i> Rated {existingReview.rating}/5
                            </span>
                        ) : (
                            <button
                                onClick={() => setIsReviewOpen(true)}
                                className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors inline-flex items-center gap-1.5 shadow-sm"
                            >
                                <i className="fas fa-star text-amber-200"></i> Rate Workshop
                            </button>
                        )
                    )}

                    {['pending', 'confirmed'].includes(booking.status) && (
                        <button
                            onClick={handleCancel}
                            className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors inline-flex items-center gap-1.5"
                        >
                            <i className="fas fa-ban"></i> Cancel Booking
                        </button>
                    )}
                </div>
            </div>


            {/* Detailed Status Live Update Banner */}
            {booking.detailed_status && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-8 shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <i className="fas fa-info-circle text-lg"></i>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">Live Update from Workshop</h3>
                        <p className="text-indigo-800 font-semibold">{booking.detailed_status}</p>
                    </div>
                </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Vehicle & Schedule Info */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center">
                        <i className="fas fa-car text-blue-600 mr-2"></i>
                        Vehicle & Schedule
                    </h3>
                    <div className="space-y-3.5 text-sm">
                        <div>
                            <span className="text-xs text-slate-400 block font-medium">Vehicle Information</span>
                            <span className="font-semibold text-slate-900">{booking.vehicle_info}</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 block font-medium">Scheduled Date & Time</span>
                            <span className="font-semibold text-slate-900">
                                {new Date(booking.preferred_date).toLocaleDateString()} at {booking.preferred_time}
                            </span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 block font-medium">Workshop Hub</span>
                            <span className="font-semibold text-slate-900">{booking.shop_name} ({booking.shop_address})</span>
                        </div>
                        {booking.additional_notes && (
                            <div>
                                <span className="text-xs text-slate-400 block font-medium">Client Notes</span>
                                <span className="text-slate-700">{booking.additional_notes}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Billing & Payment Info */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center">
                        <i className="fas fa-credit-card text-blue-600 mr-2"></i>
                        Payment & Invoicing
                    </h3>
                    <div className="space-y-3.5 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">Payment Mode:</span>
                            <span className="font-semibold text-slate-900 uppercase">{booking.payment_method}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">Payment Status:</span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                booking.is_paid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                                <i className={`fas ${booking.is_paid ? 'fa-check' : 'fa-clock'}`}></i>
                                {booking.is_paid ? 'Paid' : 'Unpaid'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                            <span className="font-bold text-slate-900">Total Estimated Cost:</span>
                            <span className="text-2xl font-extrabold text-blue-600">₹{booking.total_cost || 0}</span>
                        </div>

                        {!booking.is_paid && (
                            <button
                                onClick={() => setIsStripeOpen(true)}
                                className="w-full mt-3 py-3 px-4 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                <i className="fab fa-stripe-s"></i> Pay ₹{booking.total_cost || 0} Online with Stripe
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Booked Services List */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    <i className="fas fa-list-check text-blue-600 mr-2"></i>
                    Selected Service Packages
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="py-3 px-4">Service Package</th>
                                <th className="py-3 px-4">Description</th>
                                <th className="py-3 px-4 text-right">Price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {booking.services?.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50/50">
                                    <td className="py-3 px-4 font-semibold text-slate-900">{s.title}</td>
                                    <td className="py-3 px-4 text-slate-500 text-xs sm:text-sm">{s.description}</td>
                                    <td className="py-3 px-4 text-right font-bold text-blue-600">₹{parseFloat(s.price_starts_at).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* Stripe Payment Modal */}
            <StripePaymentModal
                isOpen={isStripeOpen}
                onClose={() => setIsStripeOpen(false)}
                booking={booking}
                amount={booking.total_cost}
                onPaymentSuccess={handlePaymentSuccess}
            />

            {/* Cancel Confirmation Modal */}
            <ConfirmModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={confirmCancel}
                title="Cancel Service Booking"
                message="Are you sure you want to cancel this service booking? This action cannot be undone."
                confirmText="Cancel Booking"
                confirmColor="red"
            />

            {/* Official Tax Invoice Modal */}
            {isInvoiceOpen && (
                <InvoiceModal
                    booking={booking}
                    onClose={() => setIsInvoiceOpen(false)}
                />
            )}

            {/* Workshop Review & Rating Modal */}
            {isReviewOpen && (
                <ReviewModal
                    booking={booking}
                    onClose={() => setIsReviewOpen(false)}
                    onSuccess={fetchBooking}
                />
            )}
        </div>
    );
}

