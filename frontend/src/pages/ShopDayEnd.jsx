import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import StatusBadge from '../components/StatusBadge';

export default function ShopDayEnd() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchReport = async () => {
        try {
            const res = await api.get('/shop/day-end-report');
            setReport(res.data);
        } catch (err) {
            toast.error('Failed to load day-end report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Day-End Closing</h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2 font-medium">
                        <i className="fas fa-calendar-day text-blue-600"></i>
                        Report for {new Date(report?.date || Date.now()).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors shadow-sm print:hidden"
                >
                    <i className="fas fa-print"></i> Print Report
                </button>
            </div>

            {/* Warning if there are pending jobs */}
            {report?.stats?.pending_bookings > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0 mt-0.5">
                        <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <div>
                        <h3 className="font-bold text-amber-800 text-lg">Action Required</h3>
                        <p className="text-amber-700 text-sm mt-1">
                            There are still <strong className="font-extrabold text-amber-900">{report.stats.pending_bookings}</strong> pending service jobs scheduled for today. 
                            Please update their statuses to "Completed" or "Cancelled" before closing the shop for the day.
                        </p>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-extrabold text-slate-900">{report?.stats?.total_bookings || 0}</div>
                        <div className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Total Scheduled</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-blue-50 text-blue-600">
                        <i className="fas fa-clipboard-list"></i>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-extrabold text-emerald-600">{report?.stats?.completed_bookings || 0}</div>
                        <div className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Completed Jobs</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-emerald-50 text-emerald-600">
                        <i className="fas fa-check-circle"></i>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-extrabold text-slate-900">₹{report?.stats?.collected_revenue || 0}</div>
                        <div className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Collected Revenue</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-green-50 text-green-600">
                        <i className="fas fa-rupee-sign"></i>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-extrabold text-slate-900">₹{report?.stats?.expected_revenue || 0}</div>
                        <div className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Expected Revenue</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-indigo-50 text-indigo-600">
                        <i className="fas fa-chart-line"></i>
                    </div>
                </div>
            </div>

            {/* Today's Bookings Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center">
                        <i className="fas fa-list-ul text-blue-600 mr-2"></i>
                        Today's Scheduled Services
                    </h2>
                </div>

                {report?.bookings?.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 text-2xl">
                            <i className="fas fa-car-side"></i>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No Services Today</h3>
                        <p className="text-slate-500 mt-1">There were no service orders scheduled for today.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-4 px-6">Order #</th>
                                    <th className="py-4 px-6">Customer</th>
                                    <th className="py-4 px-6">Vehicle</th>
                                    <th className="py-4 px-6">Amount</th>
                                    <th className="py-4 px-6">Payment Status</th>
                                    <th className="py-4 px-6">Service Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {report?.bookings?.map((b) => (
                                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-6 font-extrabold text-slate-900">#{b.id}</td>
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-slate-900">{b.customer_name}</div>
                                            <div className="text-xs font-medium text-slate-500 mt-0.5">{b.customer_phone}</div>
                                        </td>
                                        <td className="py-4 px-6 font-semibold text-slate-700">{b.vehicle_info}</td>
                                        <td className="py-4 px-6 font-extrabold text-slate-900">₹{b.total_cost || 0}</td>
                                        <td className="py-4 px-6">
                                            {b.is_paid ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                                    <i className="fas fa-check-circle mr-1.5"></i> Paid
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                                    <i className="fas fa-clock mr-1.5"></i> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <StatusBadge status={b.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {/* Print specific styles */}
            <style jsx>{`
                @media print {
                    aside, nav, button { display: none !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                    .max-w-6xl { max-width: 100% !important; }
                    .shadow-sm { box-shadow: none !important; }
                    .border { border-color: #e2e8f0 !important; }
                }
            `}</style>
        </div>
    );
}
