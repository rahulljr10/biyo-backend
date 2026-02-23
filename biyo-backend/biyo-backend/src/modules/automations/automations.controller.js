const pool = require('../../config/db');

// POST /automations
const createAutomation = async (req, res) => {
  const { name, flow_type, trigger_type, trigger_value, message_text, destination_type, destination_url } = req.body;

  if (!name || !flow_type || !trigger_type || !message_text) {
    return res.status(400).json({ error: 'name, flow_type, trigger_type, and message_text are required.' });
  }

  const validFlowTypes = ['template', 'custom'];
  const validTriggerTypes = ['comment', 'dm', 'free_download', 'purchase'];

  if (!validFlowTypes.includes(flow_type)) {
    return res.status(400).json({ error: 'flow_type must be template or custom.' });
  }

  if (!validTriggerTypes.includes(trigger_type)) {
    return res.status(400).json({ error: 'trigger_type must be comment, dm, free_download, or purchase.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO automations
         (user_id, name, flow_type, trigger_type, trigger_value, message_text, destination_type, destination_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.id, name, flow_type, trigger_type, trigger_value, message_text, destination_type, destination_url]
    );

    res.status(201).json({ automation: result.rows[0] });
  } catch (err) {
    console.error('CreateAutomation error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /automations
const getAutomations = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM automations WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ automations: result.rows });
  } catch (err) {
    console.error('GetAutomations error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

// PUT /automations/:id
const updateAutomation = async (req, res) => {
  const { id } = req.params;
  const { name, trigger_value, message_text, destination_type, destination_url, status } = req.body;

  try {
    const existing = await pool.query(
      'SELECT id FROM automations WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Automation not found or access denied.' });
    }

    const result = await pool.query(
      `UPDATE automations
       SET name = COALESCE($1, name),
           trigger_value = COALESCE($2, trigger_value),
           message_text = COALESCE($3, message_text),
           destination_type = COALESCE($4, destination_type),
           destination_url = COALESCE($5, destination_url),
           status = COALESCE($6, status),
           updated_at = NOW()
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [name, trigger_value, message_text, destination_type, destination_url, status, id, req.user.id]
    );

    res.json({ automation: result.rows[0] });
  } catch (err) {
    console.error('UpdateAutomation error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { createAutomation, getAutomations, updateAutomation };
