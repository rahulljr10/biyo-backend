const crypto = require('crypto');
const pool = require('../../config/db');
const { platformRazorpay } = require('../../utils/razorpay');

// POST /subscriptions/create
const createSubscription = async (req, res) => {
  const userId = req.user.id;

  try {
    // Check if already has active subscription
    const existing = await pool.query(
      `SELECT * FROM subscriptions WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    if (existing.rows.length) {
      return res.status(400).json({ error: 'You already have an active Biyo subscription.' });
    }

    // Create Razorpay subscription
    const subscription = await platformRazorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
      total_count: 12, // 12 months
    });

    // Save subscription record
    await pool.query(
      `INSERT INTO subscriptions (user_id, razorpay_subscription_id, status)
       VALUES ($1, $2, 'created')
       ON CONFLICT (razorpay_subscription_id) DO NOTHING`,
      [userId, subscription.id]
    );

    res.json({
      subscription_id: subscription.id,
      status: subscription.status,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('CreateSubscription error:', err.message);
    res.status(500).json({ error: 'Error creating subscription.' });
  }
};

// POST /subscriptions/webhook
const subscriptionWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ error: 'Invalid webhook signature.' });
  }

  const event = req.body;
  const subscriptionId = event.payload?.subscription?.entity?.id;

  try {
    if (event.event === 'subscription.activated') {
      const sub = event.payload.subscription.entity;

      await pool.query(
        `UPDATE subscriptions
         SET status = 'active',
             start_date = TO_TIMESTAMP($1),
             expiry_date = TO_TIMESTAMP($2),
             updated_at = NOW()
         WHERE razorpay_subscription_id = $3`,
        [sub.current_start, sub.current_end, subscriptionId]
      );

      // Update user subscription status
      const subRecord = await pool.query(
        'SELECT user_id FROM subscriptions WHERE razorpay_subscription_id = $1',
        [subscriptionId]
      );

      if (subRecord.rows.length) {
        await pool.query(
          `UPDATE users SET subscription_status = 'active' WHERE id = $1`,
          [subRecord.rows[0].user_id]
        );
        console.log(`✅ Subscription activated for user: ${subRecord.rows[0].user_id}`);
      }
    }

    if (event.event === 'subscription.cancelled' || event.event === 'subscription.expired') {
      await pool.query(
        `UPDATE subscriptions SET status = $1, updated_at = NOW()
         WHERE razorpay_subscription_id = $2`,
        [event.event === 'subscription.cancelled' ? 'cancelled' : 'expired', subscriptionId]
      );

      const subRecord = await pool.query(
        'SELECT user_id FROM subscriptions WHERE razorpay_subscription_id = $1',
        [subscriptionId]
      );

      if (subRecord.rows.length) {
        await pool.query(
          `UPDATE users SET subscription_status = 'inactive' WHERE id = $1`,
          [subRecord.rows[0].user_id]
        );
      }
    }
  } catch (err) {
    console.error('Subscription webhook error:', err.message);
  }

  res.json({ status: 'ok' });
};

module.exports = { createSubscription, subscriptionWebhook };
