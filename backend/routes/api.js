const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');

// Route mapping
router.post('/price', priceController.calculatePrice);

module.exports = router;
