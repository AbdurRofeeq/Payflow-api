require('dotenv').config(); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

const SECRET = process.env.JWT_SECRET;

// exports.register = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({ name, email, password: hashedPassword });
//     const savedUser = await user.save();

//     const wallet = new Wallet({ user: savedUser._id });
//     await wallet.save();

//     savedUser.wallet = wallet._id;
//     await savedUser.save();

//     res.status(201).json({ message: 'Registration successful' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate input presence
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // 3. Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // 4. Check for duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // 5. Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    const savedUser = await user.save();

    // 6. Create and link wallet
    const wallet = new Wallet({ user: savedUser._id });
    await wallet.save();

    savedUser.wallet = wallet._id;
    await savedUser.save();

    res.status(201).json({ message: 'Registration successful' });

  } catch (err) {
    // 7. Handle duplicate key errors gracefully
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ userId: user._id }, SECRET, { expiresIn: '1d' });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
