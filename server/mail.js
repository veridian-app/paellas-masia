const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOrderNotification(orderData) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP_USER or SMTP_PASS not defined. Skipping email notification.');
    return;
  }

  const { orderId, clientData, cart, totalPrice, paymentMethod, date, time, notes } = orderData;
  
  const htmlContent = `
    <h2>Nuevo Pedido Recibido</h2>
    <p><strong>ID de Pedido:</strong> ${orderId}</p>
    <h3>Datos del Cliente</h3>
    <ul>
      <li><strong>Nombre:</strong> ${clientData.name}</li>
      <li><strong>Teléfono:</strong> ${clientData.phone}</li>
      <li><strong>Email:</strong> ${clientData.email}</li>
      <li><strong>Dirección:</strong> ${clientData.address}</li>
    </ul>
    <h3>Detalles de Entrega</h3>
    <ul>
      <li><strong>Fecha:</strong> ${date}</li>
      <li><strong>Hora:</strong> ${time}</li>
    </ul>
    <h3>Pedido</h3>
    <pre>${JSON.stringify(cart, null, 2)}</pre>
    <p><strong>Total:</strong> ${totalPrice}€</p>
    <p><strong>Método de pago:</strong> ${paymentMethod}</p>
    <p><strong>Notas:</strong> ${notes || 'Ninguna'}</p>
    <hr/>
    <p><em>Aviso de cancelación: Para cancelaciones solo se devolverá el dinero si se avisa con al menos 48h de antelación.</em></p>
  `;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: 'arrocesmasia@gmail.com',
    subject: `Nuevo Pedido - ${clientData.name} - ${totalPrice}€`,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent for order ${orderId} to arrocesmasia@gmail.com`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
}

module.exports = {
  sendOrderNotification
};
