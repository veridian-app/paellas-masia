'use strict';

/**
 * routes/webhook.js
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/payment/webhook
 *
 * Redsys calls this URL after every transaction attempt (approved or rejected).
 * It sends:
 *   Ds_SignatureVersion   → always "HMAC_SHA256_V1"
 *   Ds_MerchantParameters → Base64-encoded JSON with transaction details
 *   Ds_Signature          → Base64-encoded HMAC-SHA256 we must verify
 *
 * Security: We re-derive the signature server-side and compare with
 * constant-time equality to prevent timing attacks and spoofed callbacks.
 *
 * IMPORTANT: Redsys expects a plain 200 OK response body-free (or with "OK").
 * If we return anything other than 2xx, Redsys will retry the notification.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { verifyWebhook, interpretResponseCode } = require('../redsys.service');
const { updateOrderStatus } = require('../db');

/**
 * Helper: update your order in the database.
 * Replace this stub with your real DB logic (e.g. Prisma, Mongoose, pg, etc.)
 *
 * @param {string} orderId
 * @param {{ approved: boolean, message: string, params: object }} result
 */
async function updateOrderStatusInDb(orderId, { approved, message, params }) {
  const status = approved ? 'PAID' : 'REJECTED';
  try {
    updateOrderStatus(orderId, status);
  } catch (error) {
    console.error('Error updating order status:', error);
  }
  console.log(
    `[Webhook] Order ${orderId} → ${approved ? '✅ PAID' : '❌ REJECTED'} | ${message}`
  );
  console.log('[Webhook] Full params:', JSON.stringify(params, null, 2));
}

router.post('/', async (req, res) => {
  // Redsys can send parameters as JSON body or as form-encoded — handle both
  const {
    Ds_SignatureVersion,
    Ds_MerchantParameters,
    Ds_Signature,
  } = req.body;

  // ── Validate that all required fields are present ──
  if (!Ds_SignatureVersion || !Ds_MerchantParameters || !Ds_Signature) {
    console.warn('[Webhook] Received incomplete notification — missing fields');
    // Still return 200 so Redsys doesn't keep retrying with invalid data
    return res.status(200).send('OK');
  }

  // ── Verify signature and decode parameters ──
  const { verified, params, responseCode } = verifyWebhook({
    Ds_SignatureVersion,
    Ds_MerchantParameters,
    Ds_Signature,
  });

  if (!verified) {
    // Signature mismatch: log and return 200 (do NOT update order)
    console.error('[Webhook] ❌ Signature verification failed. Ignoring notification.');
    return res.status(200).send('OK');
  }

  // ── Interpret the response code ──
  const { approved, message } = interpretResponseCode(responseCode);
  const orderId = params?.Ds_Order;

  if (!orderId) {
    console.error('[Webhook] Verified notification missing Ds_Order — cannot update order');
    return res.status(200).send('OK');
  }

  // ── Update the order in your database ──
  try {
    await updateOrderStatusInDb(orderId, { approved, message, params });
  } catch (dbErr) {
    // Log DB errors but still return 200 to Redsys (retrying won't help a DB issue)
    console.error(`[Webhook] DB update failed for order ${orderId}:`, dbErr.message);
  }

  // ── MUST respond with 200 ──
  return res.status(200).send('OK');
});

module.exports = router;
