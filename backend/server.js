const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const votingRoutes = require('./routes/voting');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(logger);

// Routes
app.use('/api', votingRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Voting System API is running' });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`📡 Server running on http://localhost:${PORT}`);
});

module.exports = app;

