const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_secret_key');
const { sendOTPByEmail, sendServiceBookingEmail, sendTowingRequestEmail } = require('../utils/email');

// Helper to generate 6-digit OTP
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// GET /api/portal/services
router.get('/services', optionalAuth, async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        let shopId = null;

        if (userId) {
            // Get user's selected shop
            const shopRes = await db.query(
                'SELECT select_shop_id FROM select_shops WHERE user_id = $1',
                [userId]
            );
            if (shopRes.rows.length > 0) {
                shopId = shopRes.rows[0].select_shop_id;
            }
        }

        if (!shopId) {
            const firstShop = await db.query('SELECT id FROM admin_profiles ORDER BY id ASC LIMIT 1');
            if (firstShop.rows.length > 0) {
                shopId = firstShop.rows[0].id;
            }
        }


        if (!shopId) {
            return res.json({ services: [], shop: null });
        }

        const shopInfo = await db.query(
            `SELECT ap.*,
                    COALESCE(ROUND(AVG(wr.rating)::numeric, 1), 0.0) as avg_rating,
                    COUNT(wr.id)::int as review_count
             FROM admin_profiles ap
             LEFT JOIN workshop_reviews wr ON ap.id = wr.shop_id
             WHERE ap.id = $1
             GROUP BY ap.id`,
            [shopId]
        );
        const servicesRes = await db.query(
            'SELECT * FROM service_offerings WHERE shop_id = $1 AND is_active = true ORDER BY id DESC',
            [shopId]
        );

        res.json({
            services: servicesRes.rows,
            shop: shopInfo.rows[0] || null,
        });
    } catch (err) {
        console.error('Portal services error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper to validate workshop capacity and closed days
async function validateSlotCapacity(shopId, preferred_date, preferred_time) {
    if (!shopId) return null;

    const shopRes = await db.query(
        'SELECT shop_name, max_concurrent_bookings, closed_days FROM admin_profiles WHERE id = $1',
        [shopId]
    );
    if (shopRes.rows.length === 0) return null;

    const shop = shopRes.rows[0];
    const maxCapacity = shop.max_concurrent_bookings || 3;
    const closedDaysStr = (shop.closed_days || 'Sunday').toLowerCase();

    // Check closed days
    const dateObj = new Date(preferred_date + 'T00:00:00');
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const bookingDay = dayNames[dateObj.getDay()];

    const closedList = closedDaysStr.split(',').map(d => d.trim().toLowerCase());
    if (closedList.includes(bookingDay)) {
        const capitalizedDay = bookingDay.charAt(0).toUpperCase() + bookingDay.slice(1);
        return `${shop.shop_name} is closed on ${capitalizedDay}s. Please select an open operating day.`;
    }

    // Check concurrent bookings against capacity limit
    const countRes = await db.query(
        `SELECT COUNT(*)::int as count 
         FROM service_bookings 
         WHERE preferred_date = $1 AND preferred_time = $2 AND shop_id = $3 AND status != 'cancelled'`,
        [preferred_date, preferred_time, shopId]
    );

    const currentCount = countRes.rows[0]?.count || 0;
    if (currentCount >= maxCapacity) {
        return `This time slot has reached maximum capacity (${maxCapacity} cars limit). Please select another time.`;
    }

    return null;
}

// POST /api/portal/check-timeslot
router.post('/check-timeslot', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { preferred_date, preferred_time } = req.body;

        if (!preferred_date || !preferred_time) {
            return res.status(400).json({ error: 'Date and time are required' });
        }

        const shopRes = await db.query('SELECT select_shop_id FROM select_shops WHERE user_id = $1', [userId]);
        const shopId = shopRes.rows.length > 0 ? shopRes.rows[0].select_shop_id : null;

        const validationError = await validateSlotCapacity(shopId, preferred_date, preferred_time);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        res.json({ message: 'Timeslot is available and workshop is open!' });
    } catch (err) {
        console.error('Check timeslot error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// POST /api/portal/send-otp
router.post('/send-otp', async (req, res) => {
    try {
        const { email, contextMessage } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const otp = generateOtp();

        await db.query('DELETE FROM otp_verifications WHERE email = $1', [email]);

        await db.query(
            `INSERT INTO otp_verifications (email, otp, expires_at) 
             VALUES ($1, $2, NOW() + INTERVAL '1 minute')`,
            [email, otp]
        );

        await sendOTPByEmail(email, otp, contextMessage || 'Your Pre-Booking Verification Code');

        res.json({ message: 'OTP sent successfully' });
    } catch (err) {
        console.error('Send OTP error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/portal/book-service
router.post('/book-service', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { customer_name, customer_phone, customer_email, vehicle_info, vehicle_id, preferred_date, preferred_time, additional_notes, service_ids, payment_method, otp } = req.body;

        if (!customer_name || !customer_phone || !customer_email || !vehicle_info || !preferred_date || !preferred_time || !service_ids || service_ids.length === 0 || !otp) {
            return res.status(400).json({ error: 'All required booking fields and OTP must be provided' });
        }

        // Verify OTP
        const otpRes = await db.query(
            'SELECT * FROM otp_verifications WHERE email = $1 AND otp = $2',
            [customer_email, otp]
        );

        if (otpRes.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid OTP provided' });
        }

        const otpRecord = otpRes.rows[0];
        if (new Date() > new Date(otpRecord.expires_at)) {
            return res.status(400).json({ error: 'OTP has expired (1 minute timeout). Please request a new one.' });
        }

        // OTP is valid, delete it
        await db.query('DELETE FROM otp_verifications WHERE email = $1', [customer_email]);

        // Get user's selected shop
        const shopRes = await db.query('SELECT select_shop_id FROM select_shops WHERE user_id = $1', [userId]);
        const shopId = shopRes.rows.length > 0 ? shopRes.rows[0].select_shop_id : null;

        // Check workshop capacity and closed days
        const capacityError = await validateSlotCapacity(shopId, preferred_date, preferred_time);
        if (capacityError) {
            return res.status(400).json({ error: capacityError });
        }

        const bookingRes = await db.query(
            `INSERT INTO service_bookings (user_id, shop_id, customer_name, customer_phone, customer_email, vehicle_info, vehicle_id, preferred_date, preferred_time, additional_notes, status, otp, otp_verified, payment_method, is_paid)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', '', true, $11, false) RETURNING *`,
            [userId, shopId, customer_name, customer_phone, customer_email, vehicle_info, vehicle_id || null, preferred_date, preferred_time, additional_notes || '', payment_method || 'cash']
        );

        const booking = bookingRes.rows[0];


        // Insert booking items with price snapshot
        let totalCost = 0;
        for (const sId of service_ids) {
            const sRes = await db.query('SELECT price_starts_at FROM service_offerings WHERE id = $1', [sId]);
            const price = sRes.rows.length > 0 ? parseFloat(sRes.rows[0].price_starts_at) : 0;
            totalCost += price;
            await db.query(
                'INSERT INTO service_booking_items (booking_id, service_id, price_at_booking) VALUES ($1, $2, $3)', 
                [booking.id, sId, price]
            );
        }

        await db.query('UPDATE service_bookings SET total_amount = $1 WHERE id = $2', [totalCost, booking.id]);

        // Auto-save phone to user profile if user has none saved yet
        if (userId && customer_phone) {
            await db.query(
                "UPDATE users SET phone = $1 WHERE id = $2 AND (phone IS NULL OR phone = '')",
                [customer_phone, userId]
            ).catch(() => {});
        }
        booking.total_cost = totalCost;
        booking.total_amount = totalCost;

        // Stripe Payment Intent handling if online
        let stripeData = null;
        if (payment_method === 'online' && totalCost > 0) {
            try {
                const amountInPaise = Math.round(totalCost * 100);
                const intent = await stripe.paymentIntents.create({
                    amount: amountInPaise,
                    currency: 'inr',
                    description: `AutoFusion Booking ID: ${booking.id}`,
                    receipt_email: customer_email,
                });

                await db.query('UPDATE service_bookings SET stripe_payment_intent_id = $1 WHERE id = $2', [intent.id, booking.id]);
                stripeData = {
                    client_secret: intent.client_secret,
                    payment_intent_id: intent.id,
                };
            } catch (stripeErr) {
                console.warn('Stripe initialization warning (fallback to mock mode):', stripeErr.message);
                stripeData = {
                    client_secret: `mock_secret_${booking.id}_${Date.now()}`,
                    payment_intent_id: `pi_mock_${booking.id}_${Date.now()}`,
                };
            }
        }

        // Email sending moved to shop admin confirmation (shop.js)

        res.status(201).json({
            message: 'Booking created successfully',
            booking,
            otp,
            stripe: stripeData,
        });
    } catch (err) {
        console.error('Book service error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/portal/bookings/:id
router.get('/bookings/:id', requireAuth, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const bookingRes = await db.query(
            `SELECT sb.*, ap.shop_name, ap.shop_address, ap.phone_number as shop_phone FROM service_bookings sb
             LEFT JOIN admin_profiles ap ON sb.shop_id = ap.id
             WHERE sb.id = $1 AND sb.user_id = $2`,
            [bookingId, req.user.id]
        );

        if (bookingRes.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = bookingRes.rows[0];

        const servicesRes = await db.query(
            `SELECT so.*, COALESCE(sbi.price_at_booking, so.price_starts_at) as price_at_booking 
             FROM service_booking_items sbi
             JOIN service_offerings so ON sbi.service_id = so.id
             WHERE sbi.booking_id = $1`,
            [bookingId]
        );

        booking.services = servicesRes.rows;
        booking.total_cost = booking.total_amount != null 
            ? parseFloat(booking.total_amount) 
            : servicesRes.rows.reduce((sum, item) => sum + parseFloat(item.price_at_booking || item.price_starts_at || 0), 0);

        res.json({ booking });

    } catch (err) {
        console.error('Booking detail error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/portal/bookings/:id
router.put('/bookings/:id', requireAuth, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { customer_name, customer_phone, customer_email, vehicle_info, preferred_date, preferred_time, additional_notes } = req.body;

        const bookingCheck = await db.query('SELECT status FROM service_bookings WHERE id = $1 AND user_id = $2', [bookingId, req.user.id]);
        if (bookingCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (['completed', 'cancelled'].includes(bookingCheck.rows[0].status)) {
            return res.status(400).json({ error: 'Cannot edit completed or cancelled bookings' });
        }

        await db.query(
            `UPDATE service_bookings
             SET customer_name = $1, customer_phone = $2, customer_email = $3, vehicle_info = $4, preferred_date = $5, preferred_time = $6, additional_notes = $7
             WHERE id = $8`,
            [customer_name, customer_phone, customer_email, vehicle_info, preferred_date, preferred_time, additional_notes || '', bookingId]
        );

        res.json({ message: 'Booking updated successfully' });
    } catch (err) {
        console.error('Booking edit error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/portal/bookings/:id (Cancel)
router.delete('/bookings/:id', requireAuth, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const result = await db.query("UPDATE service_bookings SET status = 'cancelled' WHERE id = $1 AND user_id = $2 RETURNING id", [bookingId, req.user.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Booking not found' });
        res.json({ message: 'Booking cancelled successfully' });
    } catch (err) {
        console.error('Booking cancel error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/portal/bookings/:id/verify-otp
router.post('/bookings/:id/verify-otp', requireAuth, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { otp } = req.body;

        const bookingRes = await db.query('SELECT otp FROM service_bookings WHERE id = $1 AND user_id = $2', [bookingId, req.user.id]);
        if (bookingRes.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (bookingRes.rows[0].otp === otp) {
            await db.query(
                "UPDATE service_bookings SET otp_verified = true, status = 'completed' WHERE id = $1 AND user_id = $2",
                [bookingId, req.user.id]
            );
            res.json({ message: 'OTP verified successfully! Booking marked as completed.' });
        } else {
            res.status(400).json({ error: 'Incorrect OTP code. Please try again.' });
        }
    } catch (err) {
        console.error('Booking OTP verification error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/portal/bookings/:id/pay
router.post('/bookings/:id/pay', requireAuth, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const bookingRes = await db.query('SELECT * FROM service_bookings WHERE id = $1 AND user_id = $2', [bookingId, req.user.id]);
        if (bookingRes.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = bookingRes.rows[0];
        if (booking.is_paid) {
            return res.status(400).json({ error: 'Booking is already paid' });
        }

        const servicesRes = await db.query(
            `SELECT price_starts_at FROM service_booking_items sbi
             JOIN service_offerings so ON sbi.service_id = so.id
             WHERE sbi.booking_id = $1`,
            [bookingId]
        );
        const totalCost = servicesRes.rows.reduce((sum, item) => sum + parseFloat(item.price_starts_at), 0);

        let stripeData;
        try {
            const intent = await stripe.paymentIntents.create({
                amount: Math.round(totalCost * 100),
                currency: 'inr',
                description: `AutoFusion Bill Payment ID: ${booking.id}`,
                receipt_email: booking.customer_email,
            });
            await db.query('UPDATE service_bookings SET stripe_payment_intent_id = $1 WHERE id = $2', [intent.id, bookingId]);
            stripeData = { client_secret: intent.client_secret, payment_intent_id: intent.id };
        } catch (e) {
            const mockId = `pi_mock_${booking.id}_${Date.now()}`;
            await db.query('UPDATE service_bookings SET stripe_payment_intent_id = $1 WHERE id = $2', [mockId, bookingId]);
            stripeData = { client_secret: `mock_secret_${booking.id}`, payment_intent_id: mockId };
        }

        res.json({ stripe: stripeData, amount: totalCost });
    } catch (err) {
        console.error('Pay online error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/portal/payment/verify
router.post('/payment/verify', requireAuth, async (req, res) => {
    try {
        const { payment_intent_id, booking_id } = req.body;
        if (!payment_intent_id && !booking_id) {
            return res.status(400).json({ error: 'Payment intent ID or Booking ID is required' });
        }

        let bookingRes;
        if (booking_id) {
            bookingRes = await db.query('SELECT * FROM service_bookings WHERE id = $1', [booking_id]);
        } else {
            bookingRes = await db.query('SELECT * FROM service_bookings WHERE stripe_payment_intent_id = $1', [payment_intent_id]);
        }

        if (bookingRes.rows.length === 0) {
            return res.status(404).json({ error: 'Booking with given payment intent not found' });
        }

        const booking = bookingRes.rows[0];
        const otp = generateOtp();

        await db.query(
            'UPDATE service_bookings SET is_paid = true, otp = $1 WHERE id = $2',
            [otp, booking.id]
        );

        res.json({ message: 'Payment verified successfully!', booking_id: booking.id, otp });
    } catch (err) {
        console.error('Payment verify error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Haversine formula to compute distance in km
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// GET /api/portal/towing/nearest-shop
router.get('/towing/nearest-shop', requireAuth, async (req, res) => {
    try {
        const { latitude, longitude } = req.query;
        const shopsRes = await db.query(
            'SELECT id, shop_name, phone_number, city, shop_address, latitude, longitude, base_towing_fee, per_km_towing_rate, max_towing_radius_km, towing_service_available FROM admin_profiles WHERE towing_service_available = true ORDER BY id ASC'
        );

        const allShops = shopsRes.rows;
        if (allShops.length === 0) {
            return res.status(404).json({ error: 'No workshops currently offer towing services.' });
        }

        const customerLat = latitude ? parseFloat(latitude) : null;
        const customerLng = longitude ? parseFloat(longitude) : null;

        let sortedShops = allShops.map(shop => {
            let dist = null;
            if (customerLat !== null && customerLng !== null && shop.latitude && shop.longitude) {
                dist = calculateHaversineDistance(
                    customerLat,
                    customerLng,
                    parseFloat(shop.latitude),
                    parseFloat(shop.longitude)
                );
            }
            const distanceKm = dist !== null ? Math.max(0.5, parseFloat(dist.toFixed(1))) : 4.5;
            const baseFee = parseFloat(shop.base_towing_fee || 500);
            const perKmRate = parseFloat(shop.per_km_towing_rate || 50);
            const distanceCost = parseFloat((distanceKm * perKmRate).toFixed(2));
            const estimatedCost = parseFloat((baseFee + distanceCost).toFixed(2));
            const etaMinutes = Math.max(12, Math.round(distanceKm * 2.5) + 8);

            return {
                ...shop,
                distance_km: distanceKm,
                base_fee: baseFee,
                per_km_rate: perKmRate,
                distance_cost: distanceCost,
                estimated_cost: estimatedCost,
                eta_minutes: etaMinutes,
            };
        });

        if (customerLat !== null && customerLng !== null) {
            sortedShops.sort((a, b) => a.distance_km - b.distance_km);
        }

        const nearest = sortedShops[0];

        res.json({
            nearest_shop: nearest,
            distance_km: nearest.distance_km,
            base_fee: nearest.base_fee,
            per_km_rate: nearest.per_km_rate,
            distance_cost: nearest.distance_cost,
            estimated_cost: nearest.estimated_cost,
            eta_minutes: nearest.eta_minutes,
            all_nearby_shops: sortedShops,
        });
    } catch (err) {
        console.error('Nearest shop detection error:', err);
        res.status(500).json({ error: 'Failed to calculate nearest towing shop' });
    }
});

// POST /api/portal/towing
router.post('/towing', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, phone_number, email, vehicle_details, pickup_address, latitude, longitude, otp, payment_method } = req.body;

        if (!full_name || !phone_number || !email || !vehicle_details || !pickup_address || !otp) {
            return res.status(400).json({ error: 'Full name, phone number, email, vehicle details, pickup address, and OTP are required' });
        }

        // Verify OTP
        const otpRes = await db.query(
            'SELECT * FROM otp_verifications WHERE email = $1 AND otp = $2',
            [email, otp]
        );

        if (otpRes.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid OTP provided' });
        }

        const otpRecord = otpRes.rows[0];
        if (new Date() > new Date(otpRecord.expires_at)) {
            return res.status(400).json({ error: 'OTP has expired (1 minute timeout). Please request a new one.' });
        }

        // OTP is valid, delete it
        await db.query('DELETE FROM otp_verifications WHERE email = $1', [email]);

        // Find nearest store offering towing service
        const shopsRes = await db.query(
            'SELECT * FROM admin_profiles WHERE towing_service_available = true'
        );

        let assignedShop = null;
        let minDistance = Infinity;

        const customerLat = latitude ? parseFloat(latitude) : null;
        const customerLng = longitude ? parseFloat(longitude) : null;

        if (customerLat !== null && customerLng !== null && shopsRes.rows.length > 0) {
            for (const shop of shopsRes.rows) {
                if (shop.latitude && shop.longitude) {
                    const dist = calculateHaversineDistance(
                        customerLat,
                        customerLng,
                        parseFloat(shop.latitude),
                        parseFloat(shop.longitude)
                    );
                    if (dist < minDistance) {
                        minDistance = dist;
                        assignedShop = shop;
                    }
                }
            }
        }

        // Fallback to select_shops or first shop if coordinates missing or distance couldn't be calculated
        if (!assignedShop) {
            const shopRes = await db.query('SELECT select_shop_id FROM select_shops WHERE user_id = $1', [userId]);
            const shopId = shopRes.rows.length > 0 ? shopRes.rows[0].select_shop_id : null;
            if (shopId) {
                assignedShop = shopsRes.rows.find(s => s.id === shopId) || shopsRes.rows[0];
            } else {
                assignedShop = shopsRes.rows[0] || null;
            }
            minDistance = 3.5;
        }

        const shopId = assignedShop ? assignedShop.id : null;
        const distanceKm = Math.max(0.5, parseFloat(minDistance.toFixed(1)));
        const baseFee = parseFloat(assignedShop?.base_towing_fee || 500);
        const perKmRate = parseFloat(assignedShop?.per_km_towing_rate || 50);
        const distanceCost = parseFloat((distanceKm * perKmRate).toFixed(2));
        const estimatedCost = parseFloat((baseFee + distanceCost).toFixed(2));

        const towingRes = await db.query(
            `INSERT INTO towing_requests (
                user_id, shop_id, full_name, phone_number, email, vehicle_details,
                pickup_address, latitude, longitude, status, otp, otp_verified,
                distance_km, base_fee, per_km_rate, estimated_cost, payment_method, payment_status
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', '', true, $10, $11, $12, $13, $14, 'unpaid')
             RETURNING *`,
            [
                userId, shopId, full_name, phone_number, email, vehicle_details,
                pickup_address, latitude || null, longitude || null,
                distanceKm, baseFee, perKmRate, estimatedCost, payment_method || 'cash'
            ]
        );

        // Auto-save phone to user profile if user has none saved yet
        if (userId && phone_number) {
            await db.query(
                "UPDATE users SET phone = $1 WHERE id = $2 AND (phone IS NULL OR phone = '')",
                [phone_number, userId]
            ).catch(() => {});
        }

        res.status(201).json({
            message: 'Towing request submitted successfully and dispatched to nearest workshop',
            towing: {
                ...towingRes.rows[0],
                shop_name: assignedShop?.shop_name,
                shop_phone: assignedShop?.phone_number,
                shop_address: assignedShop?.shop_address,
            },
        });
    } catch (err) {
        console.error('Towing request error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/portal/towing/:id
router.get('/towing/:id', requireAuth, async (req, res) => {
    try {
        const towingRes = await db.query(
            `SELECT tr.*, ap.shop_name, ap.phone_number as shop_phone, ap.shop_address, ap.city as shop_city
             FROM towing_requests tr
             LEFT JOIN admin_profiles ap ON tr.shop_id = ap.id
             WHERE tr.id = $1 AND tr.user_id = $2`,
            [req.params.id, req.user.id]
        );

        if (towingRes.rows.length === 0) {
            return res.status(404).json({ error: 'Towing request not found' });
        }

        res.json({ towing: towingRes.rows[0] });
    } catch (err) {
        console.error('Towing detail error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/portal/towing/:id
router.put('/towing/:id', requireAuth, async (req, res) => {
    try {
        const towingId = req.params.id;
        const { full_name, phone_number, vehicle_details, pickup_address, latitude, longitude } = req.body;

        const result = await db.query(
            `UPDATE towing_requests
             SET full_name = $1, phone_number = $2, vehicle_details = $3, pickup_address = $4, latitude = $5, longitude = $6
             WHERE id = $7 AND user_id = $8 RETURNING id`,
            [full_name, phone_number, vehicle_details, pickup_address, latitude || null, longitude || null, towingId, req.user.id]
        );
        
        if (result.rowCount === 0) return res.status(404).json({ error: 'Towing request not found' });

        res.json({ message: 'Towing request updated successfully' });
    } catch (err) {
        console.error('Towing edit error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/portal/towing/:id (Cancel)
router.delete('/towing/:id', requireAuth, async (req, res) => {
    try {
        const result = await db.query("UPDATE towing_requests SET status = 'cancelled' WHERE id = $1 AND user_id = $2 RETURNING id", [req.params.id, req.user.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Towing request not found' });
        res.json({ message: 'Towing request cancelled successfully' });
    } catch (err) {
        console.error('Towing cancel error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/portal/towing/:id/verify-otp
router.post('/towing/:id/verify-otp', requireAuth, async (req, res) => {
    try {
        const towingId = req.params.id;
        const { otp } = req.body;

        const towingRes = await db.query('SELECT otp, email, pickup_address FROM towing_requests WHERE id = $1 AND user_id = $2', [towingId, req.user.id]);
        if (towingRes.rows.length === 0) {
            return res.status(404).json({ error: 'Towing request not found' });
        }

        if (towingRes.rows[0].otp === otp) {
            await db.query(
                "UPDATE towing_requests SET otp_verified = true, status = 'completed' WHERE id = $1 AND user_id = $2",
                [towingId, req.user.id]
            );

            sendTowingRequestEmail(towingRes.rows[0].email, towingId, towingRes.rows[0].pickup_address).catch(e => console.error(e));

            res.json({ message: 'Towing OTP verified successfully! Request marked as completed.' });
        } else {
            res.status(400).json({ error: 'Incorrect OTP code.' });
        }
    } catch (err) {
        console.error('Towing OTP verify error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// POST /api/portal/contact
router.post('/contact', optionalAuth, async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        let shopId = null;
        if (userId) {
            const shopRes = await db.query('SELECT select_shop_id FROM select_shops WHERE user_id = $1', [userId]);
            shopId = shopRes.rows.length > 0 ? shopRes.rows[0].select_shop_id : null;
        }

        if (!shopId) {
            const firstShop = await db.query('SELECT id FROM admin_profiles ORDER BY id ASC LIMIT 1');
            if (firstShop.rows.length > 0) shopId = firstShop.rows[0].id;
        }

        await db.query(
            `INSERT INTO contact_messages (user_id, shop_id, name, email, subject, message, is_read)
             VALUES ($1, $2, $3, $4, $5, $6, false)`,
            [userId, shopId, name, email, subject, message]
        );

        res.status(201).json({ message: 'Message sent successfully!' });
    } catch (err) {
        console.error('Contact message error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==========================================
// WORKSHOP REVIEWS & RATINGS (1-5 STARS)
// ==========================================

// POST /api/portal/reviews - Submit review for completed booking
router.post('/reviews', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { booking_id, rating, comment } = req.body;

        if (!booking_id || !rating) {
            return res.status(400).json({ error: 'Booking ID and star rating (1-5) are required' });
        }

        const ratingNum = parseInt(rating, 10);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5 stars' });
        }

        // Verify booking belongs to this user and is completed
        const bRes = await db.query(
            'SELECT id, shop_id, status FROM service_bookings WHERE id = $1 AND user_id = $2',
            [booking_id, userId]
        );

        if (bRes.rows.length === 0) {
            return res.status(404).json({ error: 'Service booking not found' });
        }

        const booking = bRes.rows[0];
        if (booking.status !== 'completed') {
            return res.status(400).json({ error: 'Only completed services can be reviewed' });
        }

        // Check if already reviewed
        const existing = await db.query('SELECT id FROM workshop_reviews WHERE booking_id = $1', [booking_id]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'You have already reviewed this service order' });
        }

        const newReview = await db.query(
            `INSERT INTO workshop_reviews (user_id, shop_id, booking_id, rating, comment)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [userId, booking.shop_id, booking_id, ratingNum, (comment || '').trim()]
        );

        res.status(201).json({ message: 'Thank you for your rating & feedback!', review: newReview.rows[0] });
    } catch (err) {
        console.error('Submit review error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/portal/reviews/booking/:bookingId - Check if booking was already reviewed
router.get('/reviews/booking/:bookingId', requireAuth, async (req, res) => {
    try {
        const revRes = await db.query(
            'SELECT * FROM workshop_reviews WHERE booking_id = $1 AND user_id = $2',
            [req.params.bookingId, req.user.id]
        );
        res.json({ review: revRes.rows[0] || null });
    } catch (err) {
        console.error('Fetch booking review error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/portal/shops/:shopId/reviews - Fetch public reviews and stats for workshop
router.get('/shops/:shopId/reviews', optionalAuth, async (req, res) => {
    try {
        const shopId = req.params.shopId;
        const reviewsRes = await db.query(
            `SELECT wr.*, u.first_name, u.last_name, u.username
             FROM workshop_reviews wr
             JOIN users u ON wr.user_id = u.id
             WHERE wr.shop_id = $1
             ORDER BY wr.id DESC
             LIMIT 25`,
            [shopId]
        );

        const statsRes = await db.query(
            `SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0) as avg_rating,
                    COUNT(id)::int as total_reviews
             FROM workshop_reviews
             WHERE shop_id = $1`,
            [shopId]
        );

        res.json({
            reviews: reviewsRes.rows,
            avg_rating: parseFloat(statsRes.rows[0]?.avg_rating || 0),
            total_reviews: statsRes.rows[0]?.total_reviews || 0
        });
    } catch (err) {
        console.error('Fetch shop reviews error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;


