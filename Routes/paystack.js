const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { handlePaystackWebhook } = require('../Controllers/PaystackController');

router.post('/webhook', express.raw({ type: 'application/json' }), handlePaystackWebhook);

module.exports = router;
