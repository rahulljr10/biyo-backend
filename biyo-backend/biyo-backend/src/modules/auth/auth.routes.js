const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const { register, login, getMe, updateProfile } = require('./auth.controller');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);

module.exports = router;
