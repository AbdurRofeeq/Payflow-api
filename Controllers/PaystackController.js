const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const User = require('../models/User');

exports.handlePaystackWebhook = async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  const hash = require('crypto')
    .createHmac('sha512', secret)
    .update(req.body)
    .digest('hex');

  const paystackSignature = req.headers['x-paystack-signature'];

  if (hash !== paystackSignature) {
    return res.status(401).send('Unauthorized');
  }

  const event = JSON.parse(req.body);

  if (event.event === 'charge.success') {
    const { reference, amount, customer } = event.data;
    const email = customer.email;

    try {
      const user = await User.findOne({ email }).populate('wallet');
      if (!user || !user.wallet) return res.status(404).send('User not found');

      // Avoid duplicate funding using reference
      const existingTx = await Transaction.findOne({ reference });
      if (existingTx) return res.status(200).send('Already processed');

      user.wallet.balance += amount / 100;
      await user.wallet.save();

      await Transaction.create({
        sender: user._id,
        receiver: user._id,
        amount: amount / 100,
        type: 'fund',
        reference,
      });

      return res.status(200).send('Wallet funded and transaction recorded');
    } catch (err) {
      console.error(err);
      return res.status(500).send('Server error');
    }
  }

  res.status(200).send('OK');
};
