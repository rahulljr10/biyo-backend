const Razorpay = require('razorpay');

// Platform Razorpay instance (for Biyo subscriptions)
const platformRazorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Get creator-specific Razorpay instance (for product payments)
const getCreatorRazorpay = (keyId, keySecret) => {
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

module.exports = { platformRazorpay, getCreatorRazorpay };
