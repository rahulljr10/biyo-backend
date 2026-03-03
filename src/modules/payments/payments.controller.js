const crypto = require('crypto');
const pool = require('../../config/db');
const triggerAutomation = require('../../utils/triggerAutomation');

const createOrder = async (req, res) => {
  if (!process.env.RAZORPAY_KEY_ID) {
    return res.status(503).json({ error: 'Payments not configured yet.' });
  }
  const { product_id, customer_email } = req.body;
  if (!product_id || !customer_email) {
    return res.status(400).json({ error: 'product_id and customer_email are required.' });
  }
  try {
    const productResult = await pool.query('SELECT * FROM products WHERE id = $1 AND is_published = true', [product_id]);
    if (!productResult.rows.length) return res.status(404).json({ error: 'Product not found.' });
    const product = productResult.rows[0];
    if (product.type !== 'paid') return res.status(400).json({ error: 'Use /free-download for free products.' });
    const creatorResult = await pool.query('SELECT razorpay_key_id, razorpay_key_secret FROM users WHERE id = $1', [product.user_id]);
    const creator = creatorResult.rows[0];
    if (!creator.razorpay_key_id || !creator.razorpay_key_secret) {
      return res.status(400).json({ error: 'Creator has not configured payment settings.' });
    }
    const { getCreatorRazorpay } = require('../../utils/razorpay');
    const razorpay = getCreatorRazorpay(creator.razorpay_key_id, creator.razorpay_key_secret);
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(product.price * 100),
      currency: 'INR',
      notes: { product_id: product.id, customer_email, creator_id: product.user_id },
    });
    await pool.query(
      `INSERT INTO orders (creator_id, product_id, customer_email, amount, razorpay_order_id, status) VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [product.user_id, product.id, customer_email, product.price, razorpayOrder.id]
    );
    res.json({
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: creator.razorpay_key_id,
      product: { title: product.title, description: product.description, image_url: product.image_url },
    });
  } catch (err) {
    console.error('CreateOrder error:', err.message);
    res.status(500).json({ error: 'Server error creating payment order.' });
  }
};

const razorpayWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) return res.status(503).json({ error: 'Webhook not configured.' });
  const signature = req.headers['x-razorpay-signature'];
  const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(req.rawBody).digest('hex');
  if (signature !== expectedSignature) return res.status(400).json({ error: 'Invalid webhook signature.' });
  const event = req.body;
  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    try {
      const orderResult = await pool.query(
        `UPDATE orders SET status = 'paid', razorpay_payment_id = $1 WHERE razorpay_order_id = $2 RETURNING *`,
        [payment.id, payment.order_id]
      );
      if (orderResult.rows.length) {
        const order = orderResult.rows[0];
        const productResult = await pool.query('SELECT file_url FROM products WHERE id = $1', [order.product_id]);
        await triggerAutomation('purchase', order.creator_id, order.customer_email, {
          product_id: order.product_id, order_id: order.id, file_url: productResult.rows[0]?.file_url,
        });
      }
    } catch (err) {
      console.error('Webhook processing error:', err.message);
    }
  }
  res.json({ status: 'ok' });
};

module.exports = { createOrder, razorpayWebhook };
