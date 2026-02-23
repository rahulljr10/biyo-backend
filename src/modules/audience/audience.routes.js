const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const { getAudience } = require('./audience.controller');

router.get('/', auth, getAudience);

module.exports = router;
