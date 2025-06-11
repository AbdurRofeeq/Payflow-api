const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please fill a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet'
    },
    resetToken: String,
    resetTokenExpiration: Date,

    role: {
        type: String,
        enum: ['User', 'Admin'],
        default: 'User'
    }
});

module.exports = mongoose.model('User', userSchema);
