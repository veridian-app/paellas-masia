'use strict';

/**
 * routes/payment.js
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/payment/create
 *
 * Receives payment details from the frontend and forwards a signed request
 * to the Redsys REST endpoint.
 *
 * Body: { amount: number, orderId: string, currency?: string }
 *   - amount  : integer in cents (e.g. 1500 = 15,00 €)
 *   - orderId : unique order ID — MUST start with at least 4 digits
 *               e.g. "0001", "20240001", "0001-abc"
 *   - currency: optional, defaults to REDSYS_CURRENCY env var (978 = EUR)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { createPayment } = require('../redsys.service');
const { saveOrder, savePaymentLink } = require('../db');
const { sendOrderNotification } = require('../mail');
const crypto = require('crypto');

router.post('/create', async (req, res) => {
  const { amount, orderId, currency, clientData, cart, date, time, notes } = req.body;

  // ── Basic input validation ──
  if (amount === undefined || amount === null) {
    return res.status(400).json({ error: 'Missing required field: amount' });
  }
  if (!orderId) {
    return res.status(400).json({ error: 'Missing required field: orderId' });
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({
      error: 'amount must be a positive integer representing cents (e.g. 1500 = 15,00 €)',
    });
  }

  try {
    // Save order in db as pending
    if (clientData) {
      const orderData = { orderId, clientData, cart, totalPrice: amount / 100, paymentMethod: 'tarjeta', paymentStatus: 'PENDING', date, time, notes };
      saveOrder(orderData);
      // Trigger notification email
      await sendOrderNotification(orderData);
    }

    const redsysData = await createPayment({ amount, orderId, currency });
    const { endpoint, formParams } = redsysData;

    // Save link to DB so it can be served via a shareable URL
    const token = crypto.randomBytes(16).toString('hex');
    savePaymentLink(token, endpoint, formParams);

    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
    const shareableUrl = `${baseUrl}/api/payment/link/${token}`;

    return res.status(200).json({
      success: true,
      data: { endpoint, formParams, shareableUrl },
    });
  } catch (err) {
    console.error('[POST /api/payment/create] Error:', err.message);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// GET /api/payment/link/:token — serve self-submitting Redsys payment form
router.get('/link/:token', (req, res) => {
  const { getPaymentLink } = require('../db');
  const link = getPaymentLink(req.params.token);
  if (!link) {
    return res.status(404).send('<h2>Link de pago no encontrado o expirado.</h2>');
  }
  const { endpoint, formParams } = link;
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redirigiendo al pago seguro…</title>
  <style>
    body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center;
           justify-content: center; min-height: 100vh; margin: 0; background: #fff8f0; color: #374151; }
    .spinner { width: 48px; height: 48px; border: 4px solid #fed7aa;
               border-top-color: #f97316; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 24px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { font-size: 1.1rem; font-weight: 600; }
    small { color: #9ca3af; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <p>Redirigiendo al pago seguro…</p>
  <small>Paellas Masía · TPV Redsys</small>
  <form id="f" method="POST" action="${endpoint}">
    <input type="hidden" name="Ds_SignatureVersion" value="${formParams.Ds_SignatureVersion}">
    <input type="hidden" name="Ds_MerchantParameters" value="${formParams.Ds_MerchantParameters}">
    <input type="hidden" name="Ds_Signature" value="${formParams.Ds_Signature}">
  </form>
  <script>window.onload = () => document.getElementById('f').submit();</script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

module.exports = router;
