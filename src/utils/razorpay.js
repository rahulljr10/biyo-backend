const Razorpay = require('razorpay');

const getPlatformRazorpay = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const getCreatorRazorpay = (keyId, keySecret) => {
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

module.exports = { getPlatformRazorpay, getCreatorRazorpay };
