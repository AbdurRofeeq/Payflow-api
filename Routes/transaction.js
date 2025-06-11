const express = require('express');
const router = express.Router();
const { getTransactionHistory } = require('../Controllers/TransactionController');
const auth = require('../Middleware/Auth');

router.get('/transactions', auth, getTransactionHistory);

module.exports = router;
