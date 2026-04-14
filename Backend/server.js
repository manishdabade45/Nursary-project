// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Import route modules
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/orders.routes');
const adminRoutes = require('./routes/admin.routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARE
// ==========================================

// Enable CORS for frontend (adjust origin in production)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json());

// Request logging (development)
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

// ==========================================
// ROUTES
// ==========================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'R.N. Agritech Services API is running!',
        timestamp: new Date().toISOString(),
        environment: {
            supabase_configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
            port: PORT
        }
    });
});

// Mount route modules
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Route not found: ${req.method} ${req.url}`,
        availableEndpoints: {
            health: 'GET /api/health',
            auth: {
                signup: 'POST /api/auth/signup',
                login: 'POST /api/auth/login',
                logout: 'POST /api/auth/logout',
                me: 'GET /api/auth/me'
            },
            users: {
                profile: 'GET /api/users/profile',
                updateProfile: 'PUT /api/users/profile',
                listAll: 'GET /api/users (admin)'
            },
            cart: {
                get: 'GET /api/cart',
                add: 'POST /api/cart',
                update: 'PUT /api/cart/:id',
                remove: 'DELETE /api/cart/:id',
                clear: 'DELETE /api/cart'
            },
            orders: {
                place: 'POST /api/orders',
                history: 'GET /api/orders',
                details: 'GET /api/orders/:orderId'
            },
            admin: {
                stats: 'GET /api/admin/stats',
                orders: 'GET /api/admin/orders',
                updateStatus: 'PUT /api/admin/orders/:orderId/status',
                deleteOrder: 'DELETE /api/admin/orders/:orderId',
                users: 'GET /api/admin/users'
            }
        }
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'An unexpected error occurred.',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║   R.N. Agritech Services - Backend API       ║
║──────────────────────────────────────────────║
║   Server:    http://localhost:${PORT}            ║
║   Health:    http://localhost:${PORT}/api/health  ║
║   Supabase:  ${process.env.SUPABASE_URL ? '✅ Configured' : '❌ Not configured'}                  ║
╚══════════════════════════════════════════════╝
    `);
});

module.exports = app;
