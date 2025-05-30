const Transaction = require('../models/Transaction');
const User = require('../models/User');

exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const transactions = await Transaction.find({
      $or: [{ sender: userId }, { receiver: userId }]
    }).sort({ timestamp: -1 });

    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
