const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Security headers — fixes Cross-Origin-Opener-Policy (COOP) console warnings
// Setting to 'same-origin-allow-popups' allows Google OAuth & popup flows to work
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
const casesRouter = require('./routes/cases');
app.use('/api/cases', casesRouter);
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/petition', require('./routes/petition'));
app.use('/api/holidays', require('./routes/holidays'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/message-requests', require('./routes/messageRequests'));
app.use('/api/upload', require('./routes/upload'));

// Admin Seeding — only creates the record once, never overwrites the password hash
const seedAdmin = async () => {
  try {
    const adminEmail = 'n.j.logesh06@gmail.com';
    const adminPassword = 'Leo@1905';

    // Check if admin already exists in the 'admin' collection
    const existing = await Admin.findOne({ email: adminEmail });
    if (existing) {
      console.log('👑 Admin account already exists in "admin" collection.');
      return;
    }

    // First-time setup: hash and store
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await Admin.create({
      name: 'Administrator',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
    });
    console.log('👑 Admin account created in "admin" collection.');
  } catch (err) {
    console.error('❌ Failed to seed admin account:', err.message);
  }
};

// Health check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: dbStatus === 1 ? 'ok' : 'error',
    message: 'Justexa API',
    database: dbStates[dbStatus] || 'unknown',
    mongodb_uri: process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***@') || 'not set'
  });
});

// Connect to MongoDB
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/justexa';

console.log(`🔗 Connecting to MongoDB: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
})
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully!');
    console.log(`📦 Database: justexa`);

    // Seed admin
    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`🚀 Justexa server running on http://localhost:${PORT}`);
      console.log(`📋 Collections: users, advocates, cases, petitions, casenotifications`);
    });

    // ── Daily hearing-reminder cron job — runs every day at 8:00 AM ──
    cron.schedule('0 8 * * *', async () => {
      console.log('⏰ [CRON] Running daily hearing notification job...');
      await casesRouter.sendPendingHearingNotifications();
    }, { timezone: 'Asia/Kolkata' });
    console.log('✅ Hearing-reminder cron job scheduled (daily 8:00 AM IST)');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed!');
    console.error('   Error:', err.message);
    console.error('');
    console.error('🔧 SOLUTION: Set up MongoDB using one of these options:');
    console.error('');
    console.error('   Option 1 - MongoDB Atlas (FREE, no install):');
    console.error('   1. Go to https://cloud.mongodb.com');
    console.error('   2. Sign up free → Create M0 cluster');
    console.error('   3. Click Connect → Drivers → Copy URI');
    console.error('   4. Update .env: MONGODB_URI=mongodb+srv://...');
    console.error('');
    console.error('   Option 2 - Install MongoDB locally:');
    console.error('   Download from https://www.mongodb.com/try/download/community');
    console.error('');
    process.exit(1);
  });

module.exports = app;
