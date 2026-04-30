const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    client_id INTEGER,
    total_price REAL,
    payment_method TEXT,
    payment_status TEXT,
    delivery_date TEXT,
    delivery_time TEXT,
    notes TEXT,
    cart_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS payment_links (
    token TEXT PRIMARY KEY,
    endpoint TEXT NOT NULL,
    params_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

function saveOrder({ orderId, clientData, cart, totalPrice, paymentMethod, paymentStatus, date, time, notes }) {
  // Check if client exists by email or phone, or just insert new
  let clientId;
  const existingClient = db.prepare('SELECT id FROM clients WHERE email = ? OR phone = ?').get(clientData.email, clientData.phone);
  
  if (existingClient) {
    clientId = existingClient.id;
    // Update address or name? Let's just keep existing or update
    db.prepare('UPDATE clients SET name = ?, address = ? WHERE id = ?').run(clientData.name, clientData.address, clientId);
  } else {
    const info = db.prepare('INSERT INTO clients (name, phone, email, address) VALUES (?, ?, ?, ?)').run(
      clientData.name, clientData.phone, clientData.email, clientData.address
    );
    clientId = info.lastInsertRowid;
  }

  // Insert order
  db.prepare(`
    INSERT INTO orders (id, client_id, total_price, payment_method, payment_status, delivery_date, delivery_time, notes, cart_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderId, clientId, totalPrice, paymentMethod, paymentStatus, date, time, notes, JSON.stringify(cart)
  );

  return { clientId, orderId };
}

function updateOrderStatus(orderId, status) {
  db.prepare('UPDATE orders SET payment_status = ? WHERE id = ?').run(status, orderId);
}

function getClientsWithOrders() {
  const orders = db.prepare(`
    SELECT 
      o.id as orderId, o.total_price, o.payment_method, o.payment_status,
      o.delivery_date, o.delivery_time, o.notes, o.cart_json,
      o.created_at as order_created_at,
      c.id as clientId, c.name, c.phone, c.email, c.address,
      (SELECT COUNT(*) FROM orders WHERE client_id = c.id) as total_orders
    FROM orders o
    JOIN clients c ON o.client_id = c.id
    ORDER BY o.created_at DESC
  `).all();

  return orders.map(o => ({
    ...o,
    cart: JSON.parse(o.cart_json)
  }));
}

function savePaymentLink(token, endpoint, formParams) {
  db.prepare('INSERT OR REPLACE INTO payment_links (token, endpoint, params_json) VALUES (?, ?, ?)')
    .run(token, endpoint, JSON.stringify(formParams));
}

function getPaymentLink(token) {
  const row = db.prepare('SELECT endpoint, params_json FROM payment_links WHERE token = ?').get(token);
  if (!row) return null;
  return { endpoint: row.endpoint, formParams: JSON.parse(row.params_json) };
}

module.exports = {
  db,
  saveOrder,
  updateOrderStatus,
  getClientsWithOrders,
  savePaymentLink,
  getPaymentLink,
};
