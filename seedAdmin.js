require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');


async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('✅ Connected to MongoDB');

        const adminEmail = 'rofeeqlawal@gmail.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            if (existingAdmin.role !== 'Admin') {
                existingAdmin.role = 'Admin';
                await existingAdmin.save();
                console.log('🔁 Updated existing user to Admin role');
            } else {
                console.log('✅ Admin user already exists');
            }
        } else {
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
            const admin = new User({
                name: 'Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'Admin',
            });

            await admin.save();
            console.log('🎉 Admin user created with email: admin@example.com and password: Admin123!');
        }
    } catch (err) {
        console.error('❌ Error seeding admin:', err.message);
    } finally {
        await mongoose.connection.close();

    }
}

seedAdmin();
