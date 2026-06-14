require('dotenv').config();
const express = require('express');
const cors = require('cors');
const complaintsRouter  = require('./routes/complaints');
const aiRouter          = require('./routes/ai');
const alertsRouter      = require('./routes/alerts');
const verifyImageRouter = require('./routes/verifyImage');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: ['http://localhost:3000', 'https://*.vercel.app'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/complaints',   complaintsRouter);
app.use('/api/ai',           aiRouter);
app.use('/api/alerts',       alertsRouter);
app.use('/api/verify-image', verifyImageRouter);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => console.log(`🚀 Smart City Hub API running on port ${PORT}`));
