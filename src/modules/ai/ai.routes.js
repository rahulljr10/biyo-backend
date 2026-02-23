const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const { productBuilder, automationBuilder } = require('./ai.controller');

router.post('/product-builder', auth, productBuilder);
router.post('/automation-builder', auth, automationBuilder);

module.exports = router;
