const crypto = require('crypto');
const pool = require('../../config/db');
const { getCreatorRazorpay } = require('../../utils/razorpay');
const triggerAutomation = require('../../utils/triggerAutomation');

// POST /payments/create-order
const createOrder = async (req, res) => {
  const { product_id, customer_email } = req.body;

  if (!product_id || !customer_email) {
    return res.status(400).json({ error: 'product_id and customer_email are required.' });
  }

  try {
    // Fetch product
    const productResult = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND is_published = true',
      [product_id]
    );

    if (!productResult.rows.length) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = productResult.rows[0];

    if (product.type !== 'paid') {
      return res.status(400).json({ error: 'Use /free-download for free products.' });
    }

    // Fetch creator Razorpay keys
    const creatorResult = await pool.query(
      'SELECT razorpay_key_id, razorpay_key_secret FROM users WHERE id = $1',
      [product.user_id]
    );

    const creator = creatorResult.rows[0];

    if (!creator.razorpay_key_id || !creator.razorpay_key_secret) {
      return res.status(400).json({ error: 'Creator has not configured payment settings.' });
    }

    const razorpay = getCreatorRazorpay(creator.razorpay_key_id, creator.razorpay_key_secret);

    // Create Razorpay order (amount in paise)
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(product.price * 100),
      currency: 'INR',
      notes: {
        product_id: product.id,
        customer_email,
        creator_id: product.user_id,
      },
    });

    // Save pending order in DB
    await pool.query(
      `INSERT INTO orders (creator_id, product_id, customer_email, amount, razorpay_order_id, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [product.user_id, product.id, customer_email, product.price, razorpayOrder.id]
    );

    res.json({
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: creator.razorpay_key_id,
      product: {
        title: product.title,
        description: product.description,
        image_url: product.image_url,
      },
    });
  } catch (err) {
    console.error('CreateOrder error:', err.message);
    res.status(500).json({ error: 'Server error creating payment order.' });
  }
};

// POST /payments/webhook/razorpay
// Raw body needed — configured in app.js
const razorpayWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.rawBody) // rawBody attached in app.js
    .digest('hex');

  if (signature !== expectedSignature) {
    console.warn('⚠️ Invalid Razorpay webhook signature');
    return res.status(400).json({ error: 'Invalid webhook signature.' });
  }

  const event = req.body;

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const razorpayOrderId = payment.order_id;
    const razorpayPaymentId = payment.id;

    try {
      // Update order status
      const orderResult = await pool.query(
        `UPDATE orders
         SET status = 'paid', razorpay_payment_id = $1
         WHERE razorpay_order_id = $2
         RETURNING *`,
        [razorpayPaymentId, razorpayOrderId]
      );

      if (orderResult.rows.length) {
        const order = orderResult.rows[0];

        // Fetch product file_url
        const productResult = await pool.query(
          'SELECT file_url FROM products WHERE id = $1',
          [order.product_id]
        );

        // Trigger automation
        await triggerAutomation('purchase', order.creator_id, order.customer_email, {
          product_id: order.product_id,
          order_id: order.id,
          file_url: productResult.rows[0]?.file_url,
        });

        console.log(`✅ Payment captured: ${razorpayPaymentId} for order ${order.id}`);
      }
    } catch (err) {
      console.error('Webhook processing error:', err.message);
    }
  }

  res.json({ status: 'ok' });
};

module.exports = { createOrder, razorpayWebhook };
