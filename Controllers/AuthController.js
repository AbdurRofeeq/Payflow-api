require('dotenv').config(); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const SECRET = process.env.JWT_SECRET;

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
    
      const token = jwt.sign(
          {
              userId: user._id,
              email: user.email,
              role: user.role 
          },
          SECRET,
          { expiresIn: '1h' }
      );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000; 
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
    from: `"PayFlow Support" <${process.env.EMAIL}>`,
    to: user.email,
    subject: 'Reset Your PayFlow Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #333;">Hi ${user.name || 'there'},</h2>
        <p>You recently requested to reset your password for your <strong>PayFlow</strong> account.</p>
        <p>Click the button below to reset it. This link will expire in <strong>1 hour</strong> for your security.</p>
        
        <p style="text-align: center;">
          <a href="${process.env.CLIENT_URL}/reset-password/${token}" 
            style="background-color: #007bff; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">
            Reset Password
          </a>
        </p>

        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="background: #f9f9f9; padding: 10px; border-left: 3px solid #007bff; word-wrap: break-word;">
          ${process.env.CLIENT_URL}/reset-password/${token}
        </p>

        <p>If you didn't request a password reset, you can safely ignore this email — your password will not be changed.</p>

        <p style="margin-top: 30px;">Thanks,<br><strong>The PayFlow Team</strong></p>
      </div>
    `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Check your email for a password reset link' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    const user = await User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Token is invalid or expired' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
