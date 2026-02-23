const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const subscriptionCheck = require('../../middlewares/subscriptionCheck');
const { createProduct, getProducts, updateProduct, deleteProduct } = require('./products.controller');

router.post('/', auth, subscriptionCheck, createProduct);
router.get('/', auth, getProducts);
router.put('/:id', auth, updateProduct);
router.delete('/:id', auth, deleteProduct);

module.exports = router;
