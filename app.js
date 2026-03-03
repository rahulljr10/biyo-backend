require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// ============================================
// RAW BODY CAPTURE for Razorpay webhook verification
// ============================================
app.use((req, res, next) => {
  if (
    req.path === '/payments/webhook/razorpay' ||
    req.path === '/subscriptions/webhook'
  ) {
    let rawData = '';
    req.on('data', (chunk) => { rawData += chunk; });
    req.on('end', () => {
      req.rawBody = rawData;
      try { req.body = JSON.parse(rawData); } catch (e) { req.body = {}; }
      next();
    });
  } else {
    next();
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// ROUTES
// ============================================
app.use('/auth', require('./modules/auth/auth.routes'));
app.use('/store', require('./modules/store/store.routes'));
app.use('/products', require('./modules/products/products.routes'));
app.use('/payments', require('./modules/payments/payments.routes'));
app.use('/leads', require('./modules/leads/leads.routes'));
app.use('/audience', require('./modules/audience/audience.routes'));
app.use('/income', require('./modules/income/income.routes'));
app.use('/subscriptions', require('./modules/subscriptions/subscriptions.routes'));
app.use('/ai', require('./modules/ai/ai.routes'));
app.use('/automations', require('./modules/automations/automations.routes'));

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'Biyo',
    version: '1.0.0',
    database: process.env.DATABASE_URL ? 'configured' : 'not configured',
    razorpay: process.env.RAZORPAY_KEY_ID ? 'configured' : 'not configured',
    openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
  });
});

app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Biyo backend running on port ${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? '✅ configured' : '⚠️  not configured'}`);
  console.log(`💳 Razorpay: ${process.env.RAZORPAY_KEY_ID ? '✅ configured' : '⚠️  not configured - payments disabled'}`);
  console.log(`🤖 OpenAI: ${process.env.OPENAI_API_KEY ? '✅ configured' : '⚠️  not configured - AI disabled'}`);
});

module.exports = app;
