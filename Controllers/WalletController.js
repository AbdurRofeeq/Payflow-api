const Wallet = require('../models/Wallet');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const axios = require('axios');


exports.transferMoney = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiverEmail, amount } = req.body;

    const receiver = await User.findOne({ email: receiverEmail }).populate('wallet');
    const sender = await User.findById(senderId).populate('wallet');

    if (!receiver || !receiver.wallet) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    if (sender.wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Transfer funds
    sender.wallet.balance -= amount;
    receiver.wallet.balance += amount;

    await sender.wallet.save();
    await receiver.wallet.save();

    // Log transaction
    const transaction = new Transaction({
      sender: senderId,
      receiver: receiver._id,
      amount,
    });

    await transaction.save();

    res.status(200).json({ message: 'Transfer successful', transaction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate('wallet');

    if (!user || !user.wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    res.json({
      balance: user.wallet.balance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.fundWallet = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Call Paystack to initialize transaction
    const paystackResponse = await axios.post('https://api.paystack.co/transaction/initialize', {
      email: user.email,
      amount: amount * 100  // Paystack uses kobo (smallest unit)
    }, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const { authorization_url, reference } = paystackResponse.data.data;

    // Optionally: Save reference to a local DB to track pending payments

    res.status(200).json({
      message: 'Payment initialized. Open the URL to complete payment',
      authorization_url,
      reference
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({ message: 'Reference is required' });
    }

    const verifyResponse = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    const data = verifyResponse.data.data;

    if (data.status === 'success') {
      // Update wallet and transaction if not already done
      const user = await User.findOne({ email: data.customer.email }).populate('wallet');
      if (!user || !user.wallet) return res.status(404).json({ message: 'User or wallet not found' });

      // Check if transaction already recorded
      const existingTx = await Transaction.findOne({ reference });
      if (!existingTx) {
        user.wallet.balance += data.amount / 100;
        await user.wallet.save();

        await Transaction.create({
          sender: user._id,
          receiver: user._id,
          amount: data.amount / 100,
          type: 'fund',
          reference,
        });
      }

      return res.status(200).json({ message: 'Payment verified and wallet funded', data });
    } else {
      return res.status(400).json({ message: 'Payment not successful yet' });
    }
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};
