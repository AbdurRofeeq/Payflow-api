const express = require('express');
const router = express.Router();
const { getTransactionHistory } = require('../Controllers/TransactionController');
const auth = require('../middleware/auth');

router.get('/transactions', auth, getTransactionHistory);

module.exports = router;
