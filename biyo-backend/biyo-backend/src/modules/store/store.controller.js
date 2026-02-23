const pool = require('../../config/db');

// GET /store/:username - Public, no auth needed
const getStore = async (req, res) => {
  const { username } = req.params;

  try {
    const userResult = await pool.query(
      `SELECT id, username, store_name, bio, profile_image, social_links, subscription_status
       FROM users WHERE username = $1`,
      [username.toLowerCase()]
    );

    if (!userResult.rows.length) {
      return res.status(404).json({ error: 'Store not found.' });
    }

    const creator = userResult.rows[0];

    if (creator.subscription_status !== 'active') {
      return res.status(403).json({ error: 'This store is currently inactive.' });
    }

    const productsResult = await pool.query(
      `SELECT id, title, description, price, type, image_url, slug
       FROM products
       WHERE user_id = $1 AND is_published = true
       ORDER BY created_at DESC`,
      [creator.id]
    );

    const { id, ...publicCreator } = creator;

    res.json({
      creator: publicCreator,
      products: productsResult.rows,
    });
  } catch (err) {
    console.error('GetStore error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { getStore };
