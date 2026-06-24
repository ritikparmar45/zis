const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');
const verifyProxy = require('../middleware/verifyProxy');

// Route mapping with App Proxy HMAC security check
router.post('/price', verifyProxy, priceController.calculatePrice);

module.exports = router;

