'use strict';

/**
 * server/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Express app entry point for the Paellas Masía backend.
 *
 * Routes:
 *   POST /api/payment/create   → Initiate a Redsys payment
 *   POST /api/payment/webhook  → Receive Redsys transaction notifications
 *
 * Start with:
 *   npm run dev     (uses --watch for auto-reload on Node 18+)
 *   npm start       (production)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Load .env FIRST — before any other imports read process.env
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const paymentRouter = require('./routes/payment');
const webhookRouter = require('./routes/webhook');
const ordersRouter = require('./routes/orders');
const clientsRouter = require('./routes/clients');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────────────────────

// CORS: allow the frontend dev server and your production domain
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  // Add your production frontend URL here when deploying:
  // 'https://paellasmasía.com',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman, Redsys webhook)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parse JSON bodies (for frontend → backend calls)
app.use(express.json());

// Parse URL-encoded bodies (Redsys webhook can send form-encoded data)
app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/payment', paymentRouter);
app.use('/api/payment/webhook', webhookRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/clients', clientsRouter);

// Health check — useful for deployment probes
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV || 'development',
    redsysMode: process.env.REDSYS_TEST_MODE === 'true' ? 'TEST' : 'PRODUCTION',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for unknown API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Start server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  const mode = process.env.REDSYS_TEST_MODE === 'true' ? '🧪 TEST' : '🚀 PRODUCTION';
  console.log(`\n✅ Paellas Masía backend running on http://localhost:${PORT}`);
  console.log(`   Redsys mode : ${mode}`);
  console.log(`   Merchant    : ${process.env.REDSYS_MERCHANT_CODE || '(not set)'}`);
  console.log(`   Terminal    : ${process.env.REDSYS_TERMINAL || '(not set)'}`);
  console.log(`   Webhook URL : ${process.env.REDSYS_NOTIFICATION_URL || '(not set)'}\n`);
});

module.exports = app; // exported for testing
