const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/client/dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const bookingsRes = await db.query(
            `SELECT sb.*, ap.shop_name FROM service_bookings sb
             LEFT JOIN admin_profiles ap ON sb.shop_id = ap.id
             WHERE sb.user_id = $1 ORDER BY sb.id DESC`,
            [userId]
        );

        const towingRes = await db.query(
            `SELECT tr.*, ap.shop_name FROM towing_requests tr
             LEFT JOIN admin_profiles ap ON tr.shop_id = ap.id
             WHERE tr.user_id = $1 ORDER BY tr.id DESC`,
            [userId]
        );

        const bookings = bookingsRes.rows;
        const towing = towingRes.rows;

        const stats = {
            total_orders: bookings.length + towing.length,
            total_service_orders: bookings.length,
            active_service_orders: bookings.filter(b => b.status === 'processing' || b.status === 'confirmed').length,
            total_towing_orders: towing.length,
            active_towing_orders: towing.filter(t => t.status === 'processing' || t.status === 'pending').length,
            recent_service_orders: bookings.slice(0, 3),
            recent_towing_orders: towing.slice(0, 3),
        };

        res.json({ stats });
    } catch (err) {
        console.error('Client dashboard error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/client/profile
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const userRes = await db.query(
            'SELECT id, username, email, first_name, last_name, COALESCE(phone, \'\') as phone FROM users WHERE id = $1',
            [userId]
        );

        const shopsRes = await db.query(
            `SELECT ap.*,
                    COALESCE(ROUND(AVG(wr.rating)::numeric, 1), 0.0) as avg_rating,
                    COUNT(wr.id)::int as review_count
             FROM admin_profiles ap
             LEFT JOIN workshop_reviews wr ON ap.id = wr.shop_id
             GROUP BY ap.id
             ORDER BY ap.shop_name ASC`
        );

        const selectedRes = await db.query(
            'SELECT select_shop_id FROM select_shops WHERE user_id = $1',
            [userId]
        );

        const selectedShopId = selectedRes.rows.length > 0 ? selectedRes.rows[0].select_shop_id : null;

        res.json({
            user: userRes.rows[0],
            shops: shopsRes.rows,
            selected_shop_id: selectedShopId,
        });
    } catch (err) {
        console.error('Client profile get error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/client/profile
router.post('/profile', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { first_name, last_name, email, phone } = req.body;

        await db.query(
            'UPDATE users SET first_name = $1, last_name = $2, email = $3, phone = $4 WHERE id = $5',
            [first_name || '', last_name || '', email, phone || '', userId]
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Client profile update error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/client/select-shop
router.post('/select-shop', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { select_shop_id } = req.body;

        if (!select_shop_id) {
            return res.status(400).json({ error: 'Shop ID is required' });
        }

        const existing = await db.query('SELECT id FROM select_shops WHERE user_id = $1', [userId]);
        if (existing.rows.length > 0) {
            await db.query('UPDATE select_shops SET select_shop_id = $1 WHERE user_id = $2', [select_shop_id, userId]);
        } else {
            await db.query('INSERT INTO select_shops (user_id, select_shop_id) VALUES ($1, $2)', [userId, select_shop_id]);
        }

        res.json({ message: 'Selected shop updated successfully' });
    } catch (err) {
        console.error('Select shop error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/client/service-orders
router.get('/service-orders', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const bookingsRes = await db.query(
            `SELECT sb.*, ap.shop_name,
                    COALESCE(json_agg(json_build_object(
                        'id', so.id, 
                        'title', so.title, 
                        'price_starts_at', COALESCE(sbi.price_at_booking, so.price_starts_at)
                    )) FILTER (WHERE so.id IS NOT NULL), '[]') as services
             FROM service_bookings sb
             LEFT JOIN admin_profiles ap ON sb.shop_id = ap.id
             LEFT JOIN service_booking_items sbi ON sb.id = sbi.booking_id
             LEFT JOIN service_offerings so ON sbi.service_id = so.id
             WHERE sb.user_id = $1
             GROUP BY sb.id, ap.shop_name
             ORDER BY sb.id DESC`,
            [userId]
        );

        const bookings = bookingsRes.rows.map(b => {
            const cost = b.total_amount != null 
                ? parseFloat(b.total_amount) 
                : b.services.reduce((sum, s) => sum + parseFloat(s.price_starts_at || 0), 0);
            return { ...b, total_cost: cost };
        });

        const counts = {
            pending: bookings.filter(b => b.status === 'pending').length,
            confirmed: bookings.filter(b => b.status === 'confirmed').length,
            processing: bookings.filter(b => b.status === 'processing').length,
            completed: bookings.filter(b => b.status === 'completed').length,
            cancelled: bookings.filter(b => b.status === 'cancelled').length,
        };

        res.json({ bookings, counts });

    } catch (err) {
        console.error('Client service orders error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/client/towing-orders
router.get('/towing-orders', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const towingRes = await db.query(
            `SELECT tr.*, ap.shop_name FROM towing_requests tr
             LEFT JOIN admin_profiles ap ON tr.shop_id = ap.id
             WHERE tr.user_id = $1 ORDER BY tr.id DESC`,
            [userId]
        );

        const towing = towingRes.rows;

        const counts = {
            pending: towing.filter(t => t.status === 'pending').length,
            processing: towing.filter(t => t.status === 'processing').length,
            completed: towing.filter(t => t.status === 'completed').length,
            cancelled: towing.filter(t => t.status === 'cancelled').length,
        };

        res.json({ towing, counts });
    } catch (err) {
        console.error('Client towing orders error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==========================================
// MY GARAGE & DIGITAL SERVICE PASSPORT
// ==========================================

// GET /api/client/vehicles - List all vehicles for the user
router.get('/vehicles', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const vehiclesRes = await db.query(
            `SELECT v.*,
                    COUNT(sb.id)::int as service_count,
                    MAX(sb.preferred_date) as last_service_date
             FROM client_vehicles v
             LEFT JOIN service_bookings sb ON v.id = sb.vehicle_id AND sb.status = 'completed'
             WHERE v.user_id = $1
             GROUP BY v.id
             ORDER BY v.is_primary DESC, v.id DESC`,
            [userId]
        );
        res.json({ vehicles: vehiclesRes.rows });
    } catch (err) {
        console.error('Fetch vehicles error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/client/vehicles - Add a new vehicle to My Garage
router.post('/vehicles', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { make, model, year, license_plate, vin, fuel_type, odometer_km, is_primary } = req.body;

        if (!make || !model || !license_plate) {
            return res.status(400).json({ error: 'Make, model, and license plate number are required' });
        }

        const countRes = await db.query('SELECT COUNT(*) FROM client_vehicles WHERE user_id = $1', [userId]);
        const isFirst = parseInt(countRes.rows[0].count, 10) === 0;
        const setPrimary = is_primary || isFirst;

        if (setPrimary) {
            await db.query('UPDATE client_vehicles SET is_primary = false WHERE user_id = $1', [userId]);
        }

        const newV = await db.query(
            `INSERT INTO client_vehicles (user_id, make, model, year, license_plate, vin, fuel_type, odometer_km, is_primary)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
                userId,
                make.trim(),
                model.trim(),
                parseInt(year, 10) || new Date().getFullYear(),
                license_plate.toUpperCase().trim(),
                (vin || '').toUpperCase().trim(),
                fuel_type || 'Petrol',
                parseInt(odometer_km, 10) || 0,
                setPrimary
            ]
        );

        res.status(201).json({ message: 'Vehicle added to your Garage!', vehicle: newV.rows[0] });
    } catch (err) {
        console.error('Add vehicle error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/client/vehicles/:id - Update vehicle details
router.put('/vehicles/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const vehicleId = req.params.id;
        const { make, model, year, license_plate, vin, fuel_type, odometer_km, is_primary } = req.body;

        const currentRes = await db.query('SELECT * FROM client_vehicles WHERE id = $1 AND user_id = $2', [vehicleId, userId]);
        if (currentRes.rows.length === 0) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        const current = currentRes.rows[0];

        if (is_primary && !current.is_primary) {
            await db.query('UPDATE client_vehicles SET is_primary = false WHERE user_id = $1', [userId]);
        }

        const updated = await db.query(
            `UPDATE client_vehicles
             SET make = $1,
                 model = $2,
                 year = $3,
                 license_plate = $4,
                 vin = $5,
                 fuel_type = $6,
                 odometer_km = $7,
                 is_primary = $8
             WHERE id = $9 AND user_id = $10 RETURNING *`,
            [
                make !== undefined ? make.trim() : current.make,
                model !== undefined ? model.trim() : current.model,
                year !== undefined ? parseInt(year, 10) : current.year,
                license_plate !== undefined ? license_plate.toUpperCase().trim() : current.license_plate,
                vin !== undefined ? vin.toUpperCase().trim() : current.vin,
                fuel_type !== undefined ? fuel_type : current.fuel_type,
                odometer_km !== undefined ? parseInt(odometer_km, 10) : current.odometer_km,
                is_primary !== undefined ? is_primary : current.is_primary,
                vehicleId,
                userId
            ]
        );

        res.json({ message: 'Vehicle details updated successfully', vehicle: updated.rows[0] });
    } catch (err) {
        console.error('Update vehicle error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/client/vehicles/:id - Remove vehicle
router.delete('/vehicles/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query('DELETE FROM client_vehicles WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        res.json({ message: 'Vehicle removed from your Garage' });
    } catch (err) {
        console.error('Delete vehicle error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/client/vehicles/:id/passport - Digital Vehicle Service Passport
router.get('/vehicles/:id/passport', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const vehicleId = req.params.id;

        const vRes = await db.query('SELECT * FROM client_vehicles WHERE id = $1 AND user_id = $2', [vehicleId, userId]);
        if (vRes.rows.length === 0) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        const vehicle = vRes.rows[0];

        const historyRes = await db.query(
            `SELECT sb.*, ap.shop_name, ap.shop_address, ap.city, ap.phone_number as shop_phone,
                    COALESCE(json_agg(json_build_object(
                        'id', so.id,
                        'title', so.title,
                        'price', COALESCE(sbi.price_at_booking, so.price_starts_at)
                    )) FILTER (WHERE so.id IS NOT NULL), '[]') as services
             FROM service_bookings sb
             LEFT JOIN admin_profiles ap ON sb.shop_id = ap.id
             LEFT JOIN service_booking_items sbi ON sb.id = sbi.booking_id
             LEFT JOIN service_offerings so ON sbi.service_id = so.id
             WHERE (sb.vehicle_id = $1 OR (sb.user_id = $2 AND LOWER(sb.vehicle_info) LIKE LOWER('%' || $3 || '%')))
               AND sb.status = 'completed'
             GROUP BY sb.id, ap.shop_name, ap.shop_address, ap.city, ap.phone_number
             ORDER BY sb.preferred_date DESC, sb.id DESC`,
            [vehicleId, userId, vehicle.license_plate]
        );

        const history = historyRes.rows.map(b => ({
            ...b,
            total_cost: b.total_amount != null ? parseFloat(b.total_amount) : b.services.reduce((acc, s) => acc + parseFloat(s.price || 0), 0)
        }));

        res.json({
            vehicle,
            history,
            certified_passport: {
                passport_id: `AF-PASS-${vehicle.id}-${vehicle.license_plate.replace(/[^A-Za-z0-9]/g, '')}`,
                status: 'AutoFusion Certified Maintenance Record',
                verified_services_count: history.length,
                last_verified_odometer: history[0]?.odometer_at_service || vehicle.odometer_km,
                resale_readiness_score: Math.min(100, Math.max(65, 65 + history.length * 7))
            }
        });
    } catch (err) {
        console.error('Fetch vehicle passport error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

