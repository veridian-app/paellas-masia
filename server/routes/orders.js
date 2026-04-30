const express = require('express');
const router = express.Router();
const { saveOrder } = require('../db');
const { sendOrderNotification } = require('../mail');

// POST /api/orders/create - Save order for cash/bizum and trigger email
router.post('/create', async (req, res) => {
  const { orderId, clientData, cart, totalPrice, paymentMethod, date, time, notes } = req.body;

  if (!orderId || !clientData || !paymentMethod) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const orderData = {
      orderId, clientData, cart, totalPrice, paymentMethod, paymentStatus: 'PENDING', date, time, notes
    };
    saveOrder(orderData);
    
    // Send email notification for these new clients
    await sendOrderNotification(orderData);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error saving order:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
