const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const { createOrder, razorpayWebhook } = require('./payments.controller');

router.post('/create-order', auth, createOrder);
router.post('/webhook/razorpay', razorpayWebhook); // No auth — verified via signature

module.exports = router;
