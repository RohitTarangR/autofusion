import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api';

export default function ReviewModal({ booking, onClose, onSuccess }) {
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    if (!booking) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!rating) {
            toast.error('Please select a star rating');
            return;
        }

        try {
            setLoading(true);
            await api.post('/portal/reviews', {
                booking_id: booking.id,
                rating,
                comment,
            });
            toast.success('Thank you for rating your service experience!');
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-fade">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-xs"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 backdrop-blur-sm border border-white/30">
                        <i className="fas fa-star text-amber-300"></i>
                    </div>
                    <h2 className="text-xl font-extrabold tracking-tight">Rate Your Service</h2>
                    <p className="text-blue-100 text-xs mt-1">
                        How was your experience at {booking.shop_name || 'the AutoFusion Workshop'}?
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Interactive Star Picker */}
                    <div className="text-center">
                        <div className="flex justify-center items-center gap-2 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    type="button"
                                    key={star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="text-3xl transition-transform hover:scale-125 focus:outline-none"
                                >
                                    <i
                                        className={`fas fa-star ${
                                            (hoverRating || rating) >= star ? 'text-amber-400' : 'text-slate-200'
                                        }`}
                                    ></i>
                                </button>
                            ))}
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {rating === 5 && '🌟 Exceptional Service!'}
                            {rating === 4 && '👍 Great Job!'}
                            {rating === 3 && '👌 Satisfactory'}
                            {rating === 2 && '👎 Needs Improvement'}
                            {rating === 1 && '⚠️ Poor Experience'}
                        </span>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Customer Feedback & Comments
                        </label>
                        <textarea
                            rows="4"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your thoughts on the repair quality, timeliness, and customer service..."
                            className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
