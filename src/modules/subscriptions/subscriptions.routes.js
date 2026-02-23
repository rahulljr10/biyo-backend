const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const { createSubscription, subscriptionWebhook } = require('./subscriptions.controller');

router.post('/create', auth, createSubscription);
router.post('/webhook', subscriptionWebhook); // No auth — verified via signature

module.exports = router;
