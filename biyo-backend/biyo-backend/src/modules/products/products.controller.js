const pool = require('../../config/db');

// POST /products
const createProduct = async (req, res) => {
  const { title, description, price, type, file_url, image_url, slug } = req.body;

  if (!title || !type || !slug) {
    return res.status(400).json({ error: 'Title, type, and slug are required.' });
  }

  if (!['free', 'paid'].includes(type)) {
    return res.status(400).json({ error: 'Type must be free or paid.' });
  }

  if (type === 'paid' && (!price || price <= 0)) {
    return res.status(400).json({ error: 'Paid products require a price greater than 0.' });
  }

  try {
    // Check slug uniqueness
    const slugCheck = await pool.query('SELECT id FROM products WHERE slug = $1', [slug]);
    if (slugCheck.rows.length) {
      return res.status(409).json({ error: 'Slug already taken. Choose a different one.' });
    }

    const result = await pool.query(
      `INSERT INTO products (user_id, title, description, price, type, file_url, image_url, slug, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [req.user.id, title, description, price || 0, type, file_url, image_url, slug]
    );

    res.status(201).json({ product: result.rows[0] });
  } catch (err) {
    console.error('CreateProduct error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /products
const getProducts = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ products: result.rows });
  } catch (err) {
    console.error('GetProducts error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

// PUT /products/:id
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, type, file_url, image_url, slug, is_published } = req.body;

  try {
    const existing = await pool.query(
      'SELECT id FROM products WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Product not found or access denied.' });
    }

    const result = await pool.query(
      `UPDATE products
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           type = COALESCE($4, type),
           file_url = COALESCE($5, file_url),
           image_url = COALESCE($6, image_url),
           slug = COALESCE($7, slug),
           is_published = COALESCE($8, is_published),
           updated_at = NOW()
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [title, description, price, type, file_url, image_url, slug, is_published, id, req.user.id]
    );

    res.json({ product: result.rows[0] });
  } catch (err) {
    console.error('UpdateProduct error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

// DELETE /products/:id
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Product not found or access denied.' });
    }

    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('DeleteProduct error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { createProduct, getProducts, updateProduct, deleteProduct };
