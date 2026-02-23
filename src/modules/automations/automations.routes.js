const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const { createAutomation, getAutomations, updateAutomation } = require('./automations.controller');

router.post('/', auth, createAutomation);
router.get('/', auth, getAutomations);
router.put('/:id', auth, updateAutomation);

module.exports = router;
