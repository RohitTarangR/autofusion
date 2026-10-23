const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/email');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, first_name, last_name, phone } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        const existingUser = await db.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await db.query(
            `INSERT INTO users (username, email, password, first_name, last_name, phone, is_staff, is_superuser)
             VALUES ($1, $2, $3, $4, $5, $6, false, false) RETURNING id, username, email, first_name, last_name, phone, is_staff, is_superuser`,
            [username, email, hashedPassword, first_name || '', last_name || '', phone || '']
        );

        const user = newUser.rows[0];

        // Link user to default shop if shops exist
        const firstShop = await db.query('SELECT id FROM admin_profiles ORDER BY id ASC LIMIT 1');
        if (firstShop.rows.length > 0) {
            await db.query(
                `INSERT INTO select_shops (user_id, select_shop_id) VALUES ($1, $2)`,
                [user.id, firstShop.rows[0].id]
            );
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, is_staff: user.is_staff, is_superuser: user.is_superuser },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Send Welcome Email asynchronously
        sendWelcomeEmail(user.email, user.first_name || user.username);

        res.status(201).json({
            message: 'Registration successful',
            token,
            user,
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const userRes = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userRes.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const user = userRes.rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, is_staff: user.is_staff, is_superuser: user.is_superuser },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone || '',
            is_staff: user.is_staff,
            is_superuser: user.is_superuser,
        };

        res.json({
            message: 'Login successful',
            token,
            user: userData,
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
    try {
        const userRes = await db.query(
            'SELECT id, username, email, first_name, last_name, COALESCE(phone, \'\') as phone, is_staff, is_superuser FROM users WHERE id = $1',
            [req.user.id]
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userRes.rows[0];
        let profile = null;

        if (user.is_staff) {
            const profileRes = await db.query('SELECT * FROM admin_profiles WHERE user_id = $1', [user.id]);
            profile = profileRes.rows[0] || null;
        } else {
            const shopRes = await db.query(
                `SELECT ap.* FROM select_shops ss
                 JOIN admin_profiles ap ON ss.select_shop_id = ap.id
                 WHERE ss.user_id = $1`,
                [user.id]
            );
            profile = shopRes.rows[0] || null;
        }

        res.json({ user, profile });
    } catch (err) {
        console.error('Auth Me error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/forget-password
router.post('/forget-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Please provide a valid email address.' });
        }

        const userRes = await db.query(
            'SELECT id, username, email, first_name, last_name FROM users WHERE LOWER(email) = LOWER($1)',
            [email.trim()]
        );

        if (userRes.rows.length === 0) {
            // Return success message to avoid email enumeration
            return res.json({
                message: 'If that email address is registered with AutoFusion, a password reset link has been dispatched to it.'
            });
        }

        const user = userRes.rows[0];
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        // Invalidate any previous reset tokens for this user
        await db.query('DELETE FROM password_reset_tokens WHERE user_id = $1 OR email = $2', [user.id, user.email]);

        // Insert new reset token
        await db.query(
            'INSERT INTO password_reset_tokens (user_id, email, token, expires_at) VALUES ($1, $2, $3, $4)',
            [user.id, user.email, token, expiresAt]
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
        const customerName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;

        await sendPasswordResetEmail(user.email, resetUrl, customerName);

        res.json({
            message: 'Password reset link sent to your registered email. Please check your inbox (and spam folder).'
        });
    } catch (err) {
        console.error('Forget password error:', err);
        res.status(500).json({ error: 'Failed to process password recovery. Please try again.' });
    }
});

// GET /api/auth/verify-reset-token
router.get('/verify-reset-token', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ error: 'Reset token is required.' });
        }

        const tokenRes = await db.query(
            'SELECT * FROM password_reset_tokens WHERE token = $1',
            [token]
        );

        if (tokenRes.rows.length === 0) {
            return res.status(400).json({ error: 'This password reset link is invalid or has already been used.' });
        }

        const record = tokenRes.rows[0];
        if (new Date() > new Date(record.expires_at)) {
            await db.query('DELETE FROM password_reset_tokens WHERE id = $1', [record.id]);
            return res.status(400).json({ error: 'This password reset link has expired (30-minute limit). Please request a new one.' });
        }

        res.json({ valid: true, email: record.email });
    } catch (err) {
        console.error('Verify reset token error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, new_password } = req.body;

        if (!token || !new_password) {
            return res.status(400).json({ error: 'Token and new password are required.' });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
        }

        const tokenRes = await db.query(
            'SELECT * FROM password_reset_tokens WHERE token = $1',
            [token]
        );

        if (tokenRes.rows.length === 0) {
            return res.status(400).json({ error: 'This password reset link is invalid or has already been used.' });
        }

        const record = tokenRes.rows[0];
        if (new Date() > new Date(record.expires_at)) {
            await db.query('DELETE FROM password_reset_tokens WHERE id = $1', [record.id]);
            return res.status(400).json({ error: 'This password reset link has expired. Please request a new one.' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        // Update user's password
        await db.query(
            'UPDATE users SET password = $1 WHERE id = $2',
            [hashedPassword, record.user_id]
        );

        // Invalidate token
        await db.query('DELETE FROM password_reset_tokens WHERE id = $1', [record.id]);

        res.json({ message: 'Your password has been successfully reset! You can now log in with your new credentials.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Failed to reset password. Please try again.' });
    }
});

module.exports = router;
