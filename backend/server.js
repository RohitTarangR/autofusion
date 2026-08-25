const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/client');
const portalRoutes = require('./routes/portal');
const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;
const db = require('./db');

// Auto-migrate
db.query("ALTER TABLE service_bookings ADD COLUMN detailed_status TEXT DEFAULT ''")
    .then(() => console.log('Added detailed_status column'))
    .catch((err) => {}); // Ignore error if column already exists

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`AutoFusion Express Backend running on http://localhost:${PORT}`);
});
