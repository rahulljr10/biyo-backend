const express = require('express');
const router = express.Router();
const { freeDownload } = require('./leads.controller');

router.post('/free-download', freeDownload); // No auth — public

module.exports = router;
