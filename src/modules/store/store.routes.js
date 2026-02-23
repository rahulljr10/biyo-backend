const express = require('express');
const router = express.Router();
const { getStore } = require('./store.controller');

router.get('/:username', getStore);

module.exports = router;
