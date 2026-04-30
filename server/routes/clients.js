const express = require('express');
const router = express.Router();
const { db, getClientsWithOrders, updateOrderStatus } = require('../db');

// GET /api/clients - Fetch all clients and their orders for the dashboard
router.get('/', (req, res) => {
  try {
    const clients = getClientsWithOrders();
    res.json({ success: true, data: clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch clients' });
  }
});

// PATCH /api/clients/orders/:orderId/pay - Mark a cash order as paid
router.patch('/orders/:orderId/pay', (req, res) => {
  const { orderId } = req.params;
  try {
    const order = db.prepare('SELECT id, payment_method, payment_status FROM orders WHERE id = ?').get(orderId);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    updateOrderStatus(orderId, 'PAID');
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, error: 'Failed to update order' });
  }
});

module.exports = router;
