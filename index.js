const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./Routes/auth');
const walletRoutes = require('./Routes/wallet');
const transactionRoutes = require('./Routes/transaction');
const paystackRoutes = require('./Routes/paystack');
const userRoutes = require('./Routes/user')

dotenv.config();
const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/paystack', paystackRoutes);
app.use('/api/user', userRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get("/", (req, res) => {
    res.status(200).json({ message: "PayFlow Is Live!!!" })
})
