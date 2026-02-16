const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const routes = require('./routes');
const path = require('path');
const process = require('process');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

app.use("/public", express.static(path.join(process.cwd(), "public")));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
