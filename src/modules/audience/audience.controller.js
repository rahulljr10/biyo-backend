const pool = require('../../config/db');

// GET /audience
const getAudience = async (req, res) => {
  const { filter, search } = req.query;
  const creatorId = req.user.id;

  try {
    let audience = [];

    // Fetch leads
    if (!filter || filter === 'lead') {
      let query = `
        SELECT l.id, l.email, 'lead' as type, p.title as product_title, l.created_at
        FROM leads l
        LEFT JOIN products p ON l.product_id = p.id
        WHERE l.creator_id = $1
      `;
      const params = [creatorId];

      if (search) {
        query += ` AND l.email ILIKE $2`;
        params.push(`%${search}%`);
      }

      query += ' ORDER BY l.created_at DESC';
      const leads = await pool.query(query, params);
      audience = [...audience, ...leads.rows];
    }

    // Fetch buyers
    if (!filter || filter === 'buyer') {
      let query = `
        SELECT o.id, o.customer_email as email, 'buyer' as type,
               p.title as product_title, o.amount, o.created_at
        FROM orders o
        LEFT JOIN products p ON o.product_id = p.id
        WHERE o.creator_id = $1 AND o.status = 'paid'
      `;
      const params = [creatorId];

      if (search) {
        query += ` AND o.customer_email ILIKE $2`;
        params.push(`%${search}%`);
      }

      query += ' ORDER BY o.created_at DESC';
      const buyers = await pool.query(query, params);
      audience = [...audience, ...buyers.rows];
    }

    // Sort combined results by date
    audience.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      total: audience.length,
      audience,
    });
  } catch (err) {
    console.error('GetAudience error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { getAudience };
