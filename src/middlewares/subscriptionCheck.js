const pool = require('../config/db');

const subscriptionCheck = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT subscription_status FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (result.rows[0].subscription_status !== 'active') {
      return res.status(403).json({
        error: 'Activate your Biyo subscription to publish products.',
        code: 'SUBSCRIPTION_INACTIVE',
      });
    }

    next();
  } catch (err) {
    console.error('Subscription check error:', err.message);
    res.status(500).json({ error: 'Server error during subscription check.' });
  }
};

module.exports = subscriptionCheck;
