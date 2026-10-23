import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [verifying, setVerifying] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [tokenError, setTokenError] = useState('');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setTokenValid(false);
                setTokenError('No reset token was provided in the URL. Please verify your recovery link.');
                setVerifying(false);
                return;
            }

            try {
                const res = await api.get('/auth/verify-reset-token', {
                    params: { token }
                });
                if (res.data.valid) {
                    setTokenValid(true);
                    setUserEmail(res.data.email || '');
                } else {
                    setTokenValid(false);
                    setTokenError('The reset link is invalid or has expired.');
                }
            } catch (err) {
                setTokenValid(false);
                setTokenError(
                    err.response?.data?.error ||
                    'This password reset link is invalid or has expired (links expire after 30 minutes).'
                );
            } finally {
                setVerifying(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match. Please re-enter.');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/auth/reset-password', {
                token,
                new_password: newPassword
            });

            setSuccess(true);
            toast.success('Your password has been reset successfully!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to reset password. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto my-12 animate-fade">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-4 text-lg shadow-md shadow-blue-500/20">
                        <i className={`fas ${success ? 'fa-check' : 'fa-lock-open'}`}></i>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        {success ? 'Password Reset Complete' : 'Reset Your Password'}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        {success
                            ? 'Your new credentials are saved. You can now sign in.'
                            : userEmail
                                ? `Choose a secure new password for ${userEmail}`
                                : 'Choose a secure new password for your account'}
                    </p>
                </div>

                {/* Loading verification state */}
                {verifying && (
                    <div className="py-12 text-center text-slate-500">
                        <i className="fas fa-spinner fa-spin text-3xl text-blue-600 mb-3"></i>
                        <p className="text-sm font-medium">Validating recovery link security token...</p>
                    </div>
                )}

                {/* Invalid or Expired Token */}
                {!verifying && !tokenValid && !success && (
                    <div className="space-y-5">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
                            <i className="fas fa-exclamation-triangle text-base mt-0.5 flex-shrink-0"></i>
                            <div>
                                <p className="font-semibold mb-1">Invalid or Expired Link</p>
                                <p className="text-red-600">{tokenError}</p>
                            </div>
                        </div>

                        <div className="text-center pt-2">
                            <Link
                                to="/forget-password"
                                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                            >
                                <i className="fas fa-redo-alt text-xs"></i>
                                Request a New Reset Link
                            </Link>
                            <Link
                                to="/login"
                                className="inline-block text-sm text-slate-500 hover:text-slate-700 mt-4"
                            >
                                Back to Sign In
                            </Link>
                        </div>
                    </div>
                )}

                {/* Successful Reset State */}
                {success && (
                    <div className="space-y-6 text-center">
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-start gap-3 text-left">
                            <i className="fas fa-check-circle text-lg text-emerald-600 mt-0.5 flex-shrink-0"></i>
                            <div>
                                <p className="font-semibold text-emerald-900">Success!</p>
                                <p className="text-emerald-700">
                                    Your password has been changed securely. Any previous sessions have been refreshed.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="w-full py-3 px-5 rounded-lg text-base font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                            <i className="fas fa-sign-in-alt"></i> Proceed to Sign In
                        </button>
                    </div>
                )}

                {/* Form to enter new password */}
                {!verifying && tokenValid && !success && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full px-4 py-2.5 pr-11 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                                    placeholder="At least 6 characters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    minLength={6}
                                    required
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                                    aria-label="Toggle password visibility"
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                            <span className="text-xs text-slate-400 mt-1 block">
                                Must be minimum 6 characters long
                            </span>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className="w-full px-4 py-2.5 pr-11 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                                    placeholder="Re-enter password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    minLength={6}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                                    aria-label="Toggle confirm password visibility"
                                >
                                    <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 px-5 rounded-lg text-base font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Updating Password...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-key"></i> Update Password
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
