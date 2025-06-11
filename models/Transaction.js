const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['transfer', 'fund'], default: 'transfer' },
  reference: { type: String, unique: true, sparse: true }, 
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', transactionSchema);

