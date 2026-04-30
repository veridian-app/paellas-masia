'use strict';

/**
 * redsys.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Core cryptographic service for Redsys REST API (Santander TPV).
 *
 * Signing algorithm summary:
 *  1. Build the merchant parameters JSON and Base64-encode it (no whitespace).
 *  2. Decode the secret key from Base64.
 *  3. 3DES-CBC encrypt Ds_Merchant_Order (padded to 8-byte boundary, \0 padding)
 *     with the decoded key and an all-zero IV → "diversified key".
 *  4. HMAC-SHA256 of the Base64 parameters string using the diversified key.
 *  5. Base64-encode the HMAC → Ds_Signature.
 *
 * References:
 *  - Redsys Integration Guide v2 (REST/JSON mode)
 *  - https://pagosonline.redsys.es/conexion-rest.html
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto = require('crypto');

// ── Redsys REST/Redirect endpoints ─────────────────────────────────────────────
const ENDPOINTS = {
  test: 'https://sis-t.redsys.es:25443/sis/realizarPago',
  production: 'https://sis.redsys.es/sis/realizarPago',
};

// Signature version identifier required by Redsys
const SIGNATURE_VERSION = 'HMAC_SHA256_V1';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Pad a string to a multiple of `blockSize` bytes using null bytes (\x00).
 * Redsys uses 8-byte blocks for 3DES.
 */
function padTo8Bytes(str) {
  const buf = Buffer.from(str, 'utf8');
  const padLength = 8 - (buf.length % 8 === 0 ? 8 : buf.length % 8);
  // padLength will be 8 if already aligned → still adds a full block (PKCS5-like)
  // Redsys expects zero-padding, not PKCS#5, so we only pad if not aligned.
  if (buf.length % 8 === 0) return buf;
  return Buffer.concat([buf, Buffer.alloc(padLength, 0)]);
}

/**
 * 3DES-CBC encrypt `data` with `key` and an all-zero IV.
 * Returns a Buffer.
 */
function tripleDES(key, data) {
  // Node's crypto requires a 24-byte key for des-ede3-cbc.
  // Redsys provides a 16-byte key; extend it by repeating the first 8 bytes.
  let keyBuf = Buffer.isBuffer(key) ? key : Buffer.from(key);
  if (keyBuf.length === 16) {
    keyBuf = Buffer.concat([keyBuf, keyBuf.slice(0, 8)]);
  }

  const iv = Buffer.alloc(8, 0); // all-zero 8-byte IV
  const cipher = crypto.createCipheriv('des-ede3-cbc', keyBuf, iv);
  cipher.setAutoPadding(false); // we do manual \0-padding above
  const paddedData = padTo8Bytes(data);
  return Buffer.concat([cipher.update(paddedData), cipher.final()]);
}

/**
 * Build the Ds_MerchantParameters Base64 string.
 *
 * @param {object} params - Raw merchant parameter fields
 * @returns {string} Base64-encoded JSON (no whitespace)
 */
function buildMerchantParameters(params) {
  const json = JSON.stringify(params); // no whitespace
  return Buffer.from(json, 'utf8').toString('base64');
}

/**
 * Derive the per-order signing key using 3DES on the order number.
 *
 * @param {string} orderId          - The Ds_Merchant_Order value
 * @param {string} secretKeyBase64  - Raw Base64 secret from .env
 * @returns {Buffer} Diversified key
 */
function diversifyKey(orderId, secretKeyBase64) {
  const secretKey = Buffer.from(secretKeyBase64, 'base64');
  return tripleDES(secretKey, orderId);
}

/**
 * Calculate HMAC-SHA256 and Base64-encode the result.
 *
 * @param {string} paramsBase64   - The Ds_MerchantParameters Base64 string
 * @param {Buffer} diversifiedKey - Output of diversifyKey()
 * @returns {string} Base64-encoded HMAC-SHA256 → Ds_Signature
 */
function calculateSignature(paramsBase64, diversifiedKey) {
  const hmac = crypto.createHmac('sha256', diversifiedKey);
  hmac.update(Buffer.from(paramsBase64, 'utf8'));
  return hmac.digest('base64');
}

// ── Main service functions ───────────────────────────────────────────────────

/**
 * Build and sign a payment request, then POST it to Redsys.
 *
 * @param {object} options
 * @param {number} options.amount    - Amount in **cents** (e.g. 1500 = 15,00 €)
 * @param {string} options.orderId   - Unique order ID (4–12 alphanumeric chars,
 *                                     must start with at least 4 digits per Redsys)
 * @param {string} [options.currency] - Override currency code (default from env)
 * @returns {Promise<object>} Redsys API JSON response
 * @throws {Error} On network failure or Redsys error response
 */
async function createPayment({ amount, orderId, currency }) {
  const {
    REDSYS_MERCHANT_CODE,
    REDSYS_TERMINAL,
    REDSYS_CURRENCY,
    REDSYS_TRANSACTION_TYPE,
    REDSYS_SECRET_KEY,
    REDSYS_NOTIFICATION_URL,
    REDSYS_TEST_MODE,
  } = process.env;

  // ── Validate required env vars ──
  if (!REDSYS_MERCHANT_CODE || !REDSYS_TERMINAL || !REDSYS_SECRET_KEY) {
    throw new Error(
      'Missing required Redsys environment variables. ' +
        'Check REDSYS_MERCHANT_CODE, REDSYS_TERMINAL, REDSYS_SECRET_KEY in .env'
    );
  }

  // ── Validate inputs ──
  if (!orderId || !/^\d{4}/.test(orderId)) {
    throw new Error(
      'Invalid orderId: must start with at least 4 numeric digits (Redsys requirement)'
    );
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Amount must be a positive integer representing cents (e.g. 1500 = 15,00 €)');
  }

  // ── 1. Build merchant parameters ──
  const merchantParams = {
    DS_MERCHANT_AMOUNT: String(amount),
    DS_MERCHANT_ORDER: orderId,
    DS_MERCHANT_MERCHANTCODE: REDSYS_MERCHANT_CODE,
    DS_MERCHANT_CURRENCY: currency || REDSYS_CURRENCY || '978',
    DS_MERCHANT_TRANSACTIONTYPE: REDSYS_TRANSACTION_TYPE || '0',
    DS_MERCHANT_TERMINAL: REDSYS_TERMINAL,
    DS_MERCHANT_URLOK: 'http://localhost:5173/?payment=success',
    DS_MERCHANT_URLKO: 'http://localhost:5173/?payment=error',
    // Optional: include notification URL if configured
    ...(REDSYS_NOTIFICATION_URL && {
      DS_MERCHANT_MERCHANTURL: REDSYS_NOTIFICATION_URL,
    }),
  };

  // ── 2. Encode parameters ──
  const paramsBase64 = buildMerchantParameters(merchantParams);

  // ── 3 & 4. Diversify key + sign ──
  const divKey = diversifyKey(orderId, REDSYS_SECRET_KEY);
  const signature = calculateSignature(paramsBase64, divKey);

  // ── 5. Devuelve los datos para el Redirect ──
  const isTest = REDSYS_TEST_MODE === 'true' || REDSYS_TEST_MODE === true;
  const endpoint = isTest ? ENDPOINTS.test : ENDPOINTS.production;

  console.log(`[Redsys] → Form parameters generated | order=${orderId} amount=${amount}`);

  return {
    endpoint,
    formParams: {
      Ds_SignatureVersion: SIGNATURE_VERSION,
      Ds_MerchantParameters: paramsBase64,
      Ds_Signature: signature,
    }
  };
}

/**
 * Verify and decode an incoming Redsys webhook notification.
 *
 * Redsys POSTs { Ds_SignatureVersion, Ds_MerchantParameters, Ds_Signature }
 * to your notification URL after every transaction attempt.
 *
 * @param {object} notification
 * @param {string} notification.Ds_SignatureVersion
 * @param {string} notification.Ds_MerchantParameters - Base64
 * @param {string} notification.Ds_Signature          - Base64
 * @returns {{ verified: boolean, params: object, responseCode: string | null }}
 */
function verifyWebhook({ Ds_SignatureVersion, Ds_MerchantParameters, Ds_Signature }) {
  try {
    // ── 1. Decode the parameters ──
    const paramsJson = Buffer.from(Ds_MerchantParameters, 'base64').toString('utf8');
    const params = JSON.parse(paramsJson);

    const orderId = params.Ds_Order;
    if (!orderId) {
      console.error('[Redsys Webhook] Missing Ds_Order in parameters');
      return { verified: false, params, responseCode: null };
    }

    // ── 2. Re-derive key and re-calculate signature ──
    const divKey = diversifyKey(orderId, process.env.REDSYS_SECRET_KEY);
    const expectedSignature = calculateSignature(Ds_MerchantParameters, divKey);

    // ── 3. Constant-time comparison to prevent timing attacks ──
    const receivedBuf = Buffer.from(Ds_Signature, 'base64');
    const expectedBuf = Buffer.from(expectedSignature, 'base64');

    const signatureMatch =
      receivedBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(receivedBuf, expectedBuf);

    if (!signatureMatch) {
      console.warn('[Redsys Webhook] ⚠ Signature mismatch — possible tampering!');
      return { verified: false, params, responseCode: params.Ds_Response || null };
    }

    console.log(`[Redsys Webhook] ✓ Verified | order=${orderId} response=${params.Ds_Response}`);
    return { verified: true, params, responseCode: params.Ds_Response || null };
  } catch (err) {
    console.error('[Redsys Webhook] Error verifying notification:', err.message);
    return { verified: false, params: null, responseCode: null };
  }
}

/**
 * Interpret a Redsys response code.
 * Codes 0000–0099 are approved; anything else is rejected/error.
 *
 * @param {string} responseCode - e.g. "0000", "0190", "9915"
 * @returns {{ approved: boolean, message: string }}
 */
function interpretResponseCode(responseCode) {
  if (!responseCode) return { approved: false, message: 'No response code' };

  const code = parseInt(responseCode, 10);

  if (code >= 0 && code <= 99) {
    return { approved: true, message: `Pago aprobado (código ${responseCode})` };
  }

  // Common rejection / error codes
  const messages = {
    101:  'Tarjeta caducada',
    102:  'Tarjeta bloqueada transitoriamente',
    104:  'Operación no permitida para esa tarjeta',
    116:  'Saldo insuficiente',
    118:  'Tarjeta no registrada',
    129:  'CVV2/CVC2 incorrecto',
    180:  'Tarjeta ajena al servicio',
    184:  'Error en autenticación del titular',
    190:  'Denegación sin especificar motivo',
    191:  'Fecha de caducidad errónea',
    202:  'Tarjeta bloqueada definitivamente',
    9915: 'Operación cancelada por el usuario',
    9928: 'Anulación de autorización en diferido',
    9929: 'Anulación de autorización en diferido confirmada',
  };

  const message = messages[code] || `Pago rechazado (código ${responseCode})`;
  return { approved: false, message };
}

module.exports = { createPayment, verifyWebhook, interpretResponseCode };
