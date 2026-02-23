const pool = require('../../config/db');
const triggerAutomation = require('../../utils/triggerAutomation');

// POST /leads/free-download
const freeDownload = async (req, res) => {
  const { product_id, email } = req.body;

  if (!product_id || !email) {
    return res.status(400).json({ error: 'product_id and email are required.' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    // Fetch product
    const productResult = await pool.query(
      `SELECT p.*, u.id as creator_id
       FROM products p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1 AND p.is_published = true AND p.type = 'free'`,
      [product_id]
    );

    if (!productResult.rows.length) {
      return res.status(404).json({ error: 'Free product not found.' });
    }

    const product = productResult.rows[0];

    // Save lead (ignore duplicate)
    await pool.query(
      `INSERT INTO leads (creator_id, product_id, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (creator_id, product_id, email) DO NOTHING`,
      [product.creator_id, product.id, email.toLowerCase()]
    );

    // Trigger automation
    await triggerAutomation('free_download', product.creator_id, email, {
      product_id: product.id,
    });

    res.json({
      message: 'Success! Your download is ready.',
      file_url: product.file_url,
      product: {
        title: product.title,
        description: product.description,
      },
    });
  } catch (err) {
    console.error('FreeDownload error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { freeDownload };
