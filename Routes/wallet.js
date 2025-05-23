const express = require('express');
const router = express.Router();
const { transferMoney, getWalletBalance, fundWallet } = require('../Controllers/WalletController');
const auth = require('../middleware/auth');

router.post('/transfer', auth, transferMoney);
router.get('/balance', auth, getWalletBalance);
router.post('/fund', auth, fundWallet)
module.exports = router;
