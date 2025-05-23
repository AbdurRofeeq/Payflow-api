const Wallet = require('../models/Wallet');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

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

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    const user = await User.findById(userId).populate('wallet');
    if (!user || !user.wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    user.wallet.balance += amount;
    await user.wallet.save();

    res.json({ message: 'Wallet funded successfully', newBalance: user.wallet.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
