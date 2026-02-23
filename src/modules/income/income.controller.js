const pool = require('../../config/db');

// GET /income/summary
const getSummary = async (req, res) => {
  const creatorId = req.user.id;

  try {
    // Total earnings
    const totalResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_earnings, COUNT(*) as total_orders
       FROM orders WHERE creator_id = $1 AND status = 'paid'`,
      [creatorId]
    );

    // Monthly earnings (current month)
    const monthlyResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as monthly_earnings
       FROM orders
       WHERE creator_id = $1
         AND status = 'paid'
         AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())`,
      [creatorId]
    );

    // Today's earnings
    const todayResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as today_earnings
       FROM orders
       WHERE creator_id = $1
         AND status = 'paid'
         AND DATE_TRUNC('day', created_at) = DATE_TRUNC('day', NOW())`,
      [creatorId]
    );

    res.json({
      total_earnings: parseFloat(totalResult.rows[0].total_earnings),
      monthly_earnings: parseFloat(monthlyResult.rows[0].monthly_earnings),
      today_earnings: parseFloat(todayResult.rows[0].today_earnings),
      total_orders: parseInt(totalResult.rows[0].total_orders),
    });
  } catch (err) {
    console.error('GetSummary error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /income/orders
const getOrders = async (req, res) => {
  const creatorId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT o.id, o.customer_email, o.amount, o.status,
              o.razorpay_payment_id, o.created_at,
              p.title as product_title, p.type as product_type
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       WHERE o.creator_id = $1
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [creatorId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM orders WHERE creator_id = $1',
      [creatorId]
    );

    res.json({
      orders: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (err) {
    console.error('GetOrders error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { getSummary, getOrders };
