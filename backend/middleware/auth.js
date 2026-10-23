const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'autocare_secret_jwt_key_2026';

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header missing or invalid format' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

function requireAuth(req, res, next) {
    verifyToken(req, res, next);
}

function requireStaff(req, res, next) {
    verifyToken(req, res, () => {
        if (!req.user.is_staff && !req.user.is_superuser) {
            return res.status(403).json({ error: 'Access denied: Staff / Shop Admin access required' });
        }
        next();
    });
}

function requireSuperAdmin(req, res, next) {
    verifyToken(req, res, () => {
        if (!req.user.is_superuser) {
            return res.status(403).json({ error: 'Access denied: Super Admin access required' });
        }
        next();
    });
}

function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (err) {
            // Ignore token error for optional auth
        }
    }
    next();
}

module.exports = {
    JWT_SECRET,
    verifyToken,
    requireAuth,
    requireStaff,
    requireSuperAdmin,
    optionalAuth,
};

