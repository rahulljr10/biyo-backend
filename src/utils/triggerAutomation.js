const pool = require('../config/db');

/**
 * Trigger matching automations after an event.
 * Phase 1: logs triggered automations to console.
 * Phase 2: integrate email/DM sending.
 *
 * @param {string} trigger_type - 'purchase' | 'free_download' | 'comment' | 'dm'
 * @param {string} creator_id   - UUID of the creator
 * @param {string} customer_email
 * @param {object} meta         - optional extra info (product_id, etc.)
 */
const triggerAutomation = async (trigger_type, creator_id, customer_email, meta = {}) => {
  try {
    const result = await pool.query(
      `SELECT * FROM automations
       WHERE user_id = $1
         AND trigger_type = $2
         AND status = 'active'`,
      [creator_id, trigger_type]
    );

    if (!result.rows.length) return;

    for (const automation of result.rows) {
      console.log(`🤖 [AUTOMATION TRIGGERED]`);
      console.log(`   Name: ${automation.name}`);
      console.log(`   Trigger: ${trigger_type}`);
      console.log(`   Customer: ${customer_email}`);
      console.log(`   Message: ${automation.message_text}`);
      console.log(`   Destination: ${automation.destination_type} → ${automation.destination_url}`);
      console.log(`   Meta:`, meta);

      // Phase 2: Send actual email/DM here
      // await emailService.send({ to: customer_email, message: automation.message_text, ... })
    }
  } catch (err) {
    console.error('❌ Automation trigger error:', err.message);
  }
};

module.exports = triggerAutomation;
