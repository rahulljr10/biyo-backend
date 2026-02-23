const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const { getSummary, getOrders } = require('./income.controller');

router.get('/summary', auth, getSummary);
router.get('/orders', auth, getOrders);

module.exports = router;
