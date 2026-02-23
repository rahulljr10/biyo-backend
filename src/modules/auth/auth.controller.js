const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');

// POST /auth/register
const register = async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username.toLowerCase()]
    );

    if (existing.rows.length) {
      return res.status(409).json({ error: 'Email or username already taken.' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, username)
       VALUES ($1, $2, $3)
       RETURNING id, email, username, subscription_status, created_at`,
      [email.toLowerCase(), password_hash, username.toLowerCase()]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

// POST /auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

    if (!result.rows.length) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    const { password_hash, razorpay_key_secret, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error during login.' });
  }
};

// GET /auth/me
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, username, store_name, bio, profile_image,
              social_links, razorpay_key_id, subscription_status, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('GetMe error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

// PUT /auth/profile
const updateProfile = async (req, res) => {
  const { store_name, bio, profile_image, social_links, razorpay_key_id, razorpay_key_secret } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users
       SET store_name = COALESCE($1, store_name),
           bio = COALESCE($2, bio),
           profile_image = COALESCE($3, profile_image),
           social_links = COALESCE($4, social_links),
           razorpay_key_id = COALESCE($5, razorpay_key_id),
           razorpay_key_secret = COALESCE($6, razorpay_key_secret),
           updated_at = NOW()
       WHERE id = $7
       RETURNING id, email, username, store_name, bio, profile_image,
                 social_links, razorpay_key_id, subscription_status`,
      [store_name, bio, profile_image, social_links ? JSON.stringify(social_links) : null,
       razorpay_key_id, razorpay_key_secret, req.user.id]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('UpdateProfile error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { register, login, getMe, updateProfile };
