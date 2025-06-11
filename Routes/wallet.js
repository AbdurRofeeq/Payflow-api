const express = require('express');
const router = express.Router();
const { transferMoney, getWalletBalance, fundWallet, verifyPayment } = require('../Controllers/WalletController');
const auth = require('../Middleware/Auth');

router.post('/transfer', auth, transferMoney);
router.get('/balance', auth, getWalletBalance);
router.post('/fund', auth, fundWallet)
router.post('/verifypayment', auth, verifyPayment)
module.exports = router;
 