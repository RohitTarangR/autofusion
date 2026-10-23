import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';

export default function ForgetPasswordPage() {
    const [email, setEmail] = useState('');
    const [submittedEmail, setSubmittedEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/forget-password', { email });
            const msg = res.data.message || 'A password reset link has been sent to your email address.';
            setMessage(msg);
            setSubmittedEmail(email);
            toast.success('Password reset email sent!');
        } catch (err) {
            const errMsg = err.response?.data?.error || 'Unable to process request right now. Please try again.';
            toast.error(errMsg);
            setMessage('If the email is registered with AutoFusion, recovery instructions have been dispatched.');
            setSubmittedEmail(email);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto my-12 animate-fade">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center mx-auto mb-4 text-lg shadow-md shadow-amber-500/20">
                        <i className="fas fa-key"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Forgot Password</h2>
                    <p className="text-slate-500 text-sm mt-1">Enter your registered email to receive recovery instructions</p>
                </div>

                {message ? (
                    <div className="space-y-5">
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm">
                            <div className="flex items-start gap-3">
                                <i className="fas fa-envelope-open-text text-xl text-emerald-600 mt-0.5 flex-shrink-0"></i>
                                <div>
                                    <p className="font-semibold text-emerald-950 mb-1">Check Your Inbox</p>
                                    <p className="text-emerald-800 text-xs leading-relaxed">{message}</p>
                                    {submittedEmail && (
                                        <p className="mt-2 text-xs font-mono bg-emerald-100/70 text-emerald-900 px-2.5 py-1 rounded-md inline-block">
                                            {submittedEmail}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 flex items-center gap-2">
                            <i className="fas fa-clock text-amber-500"></i>
                            <span>The reset link will expire in <strong>30 minutes</strong> for your security.</span>
                        </div>

                        <div className="text-center pt-2 space-y-3">
                            <button
                                type="button"
                                onClick={() => { setMessage(''); setEmail(''); }}
                                className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-block"
                            >
                                <i className="fas fa-redo-alt mr-1"></i> Send to a different email
                            </button>
                            <div>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-sm transition-colors"
                                >
                                    <i className="fas fa-arrow-left mr-2 text-xs"></i> Back to Sign In
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 px-5 rounded-lg text-base font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Sending link...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-paper-plane"></i> Send Recovery Link
                                </>
                            )}
                        </button>

                        <div className="mt-6 pt-5 border-t border-slate-200 text-center text-sm text-slate-500">
                            Remember your password?{' '}
                            <Link to="/login" className="font-semibold text-blue-600 hover:underline ml-1">
                                Sign in
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
