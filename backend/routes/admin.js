const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireSuperAdmin } = require('../middleware/auth');
const { sendAdminCredentialsEmail } = require('../utils/email');

// GET /api/admin/dashboard
router.get('/dashboard', requireSuperAdmin, async (req, res) => {
    try {
        const bookingsRes = await db.query(
            `SELECT sb.*, ap.shop_name FROM service_bookings sb
             LEFT JOIN admin_profiles ap ON sb.shop_id = ap.id
             ORDER BY sb.id DESC`
        );

        const towingRes = await db.query(
            `SELECT tr.*, ap.shop_name FROM towing_requests tr
             LEFT JOIN admin_profiles ap ON tr.shop_id = ap.id
             ORDER BY tr.id DESC`
        );

        const providersRes = await db.query('SELECT COUNT(*) FROM admin_profiles');
        const offeringsRes = await db.query('SELECT COUNT(*) FROM service_offerings');
        const clientsRes = await db.query('SELECT COUNT(*) FROM users WHERE is_staff = false AND is_superuser = false');
        const revenueRes = await db.query(
            `SELECT SUM(so.price_starts_at) as total_revenue
             FROM service_offerings so
             JOIN service_booking_items sbi ON so.id = sbi.service_id
             JOIN service_bookings sb ON sb.id = sbi.booking_id
             WHERE sb.is_paid = true`
        );

        const stats = {
            recent_bookings: bookingsRes.rows.slice(0, 6),
            recent_towing: towingRes.rows.slice(0, 6),
            total_services: bookingsRes.rows.length,
            total_towing: towingRes.rows.length,
            total_shops: parseInt(providersRes.rows[0].count, 10),
            service_provider: parseInt(offeringsRes.rows[0].count, 10),
            total_users: parseInt(clientsRes.rows[0].count, 10),
            total_service_revenue: parseFloat(revenueRes.rows[0]?.total_revenue || 0)
        };

        res.json({ stats });
    } catch (err) {
        console.error('Superadmin dashboard error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/services
router.get('/services', requireSuperAdmin, async (req, res) => {
    try {
        const bookingsRes = await db.query(
            `SELECT sb.*, ap.shop_name FROM service_bookings sb
             LEFT JOIN admin_profiles ap ON sb.shop_id = ap.id
             ORDER BY sb.id DESC`
        );
        res.json({ bookings: bookingsRes.rows });
    } catch (err) {
        console.error('Superadmin services error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/admin/services/:id
router.delete('/services/:id', requireSuperAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM service_bookings WHERE id = $1', [req.params.id]);
        res.json({ message: 'Service booking deleted successfully' });
    } catch (err) {
        console.error('Superadmin service delete error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/towing
router.get('/towing', requireSuperAdmin, async (req, res) => {
    try {
        const towingRes = await db.query(
            `SELECT tr.*, ap.shop_name FROM towing_requests tr
             LEFT JOIN admin_profiles ap ON tr.shop_id = ap.id
             ORDER BY tr.id DESC`
        );
        res.json({ towing: towingRes.rows });
    } catch (err) {
        console.error('Superadmin towing error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/admin/towing/:id
router.delete('/towing/:id', requireSuperAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM towing_requests WHERE id = $1', [req.params.id]);
        res.json({ message: 'Towing request deleted successfully' });
    } catch (err) {
        console.error('Superadmin towing delete error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/providers
router.get('/providers', requireSuperAdmin, async (req, res) => {
    try {
        const providersRes = await db.query(
            `SELECT ap.*, u.username, u.email FROM admin_profiles ap
             JOIN users u ON ap.user_id = u.id
             ORDER BY ap.id DESC`
        );
        res.json({ providers: providersRes.rows });
    } catch (err) {
        console.error('Superadmin providers error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/add-provider
router.post('/add-provider', requireSuperAdmin, async (req, res) => {
    try {
        const { username, email, password, full_name, shop_name, phone_number, city, shop_address } = req.body;

        if (!username || !email || !password || !shop_name) {
            return res.status(400).json({ error: 'Username, email, password, and shop name are required' });
        }

        const existing = await db.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await db.query(
            `INSERT INTO users (username, email, password, first_name, last_name, is_staff, is_superuser)
             VALUES ($1, $2, $3, $4, '', true, false) RETURNING id`,
            [username, email, hashedPassword, full_name || '']
        );

        const newProfile = await db.query(
            `INSERT INTO admin_profiles (user_id, full_name, shop_name, phone_number, city, shop_address)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [newUser.rows[0].id, full_name || '', shop_name, phone_number || '', city || '', shop_address || '']
        );

        // Send credentials email to the new admin
        sendAdminCredentialsEmail(email, full_name, shop_name, username, password);

        res.status(201).json({ message: 'Service provider added successfully', provider: newProfile.rows[0] });
    } catch (err) {
        console.error('Superadmin add provider error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/admin/providers/:id (admin_profiles id)
router.delete('/providers/:id', requireSuperAdmin, async (req, res) => {
    try {
        const profileRes = await db.query('SELECT user_id FROM admin_profiles WHERE id = $1', [req.params.id]);
        if (profileRes.rows.length === 0) {
            return res.status(404).json({ error: 'Service provider not found' });
        }
        const userId = profileRes.rows[0].user_id;
        await db.query('DELETE FROM users WHERE id = $1', [userId]);
        res.json({ message: 'Service provider deleted successfully' });
    } catch (err) {
        console.error('Superadmin delete provider error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
