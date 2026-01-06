const express = require('express');
const authRoutes = require('./authRoutes');

const router = express.Router();

router.use('/auth', authRoutes);

module.exports = router;


/**
 * 
 * 1. User Registration Enhancements

Capture language preferences (default English, option for translation to Indian & foreign languages).

Ask for accessibility needs (instead of disability type):

Options: Noise-cancelled audio, audio transcript.

For internal TCS: Use email/employee ID, for public: use mobile number.

Admin approval workflow for registrations (avoid free access).

2. API Usage & Deployment

Current APIs: OpenAl (paid) & Gemini (free).

Internal TCS deployment. Use OpenAl via Azure

External/public app: Provide both OpenAI & Gemini options

Hardcode API key for pilot deployment, allow dynamic API key input for future deployments.

Deployment strategy:

Develop/test on AVD.

Replicate code locally.

Deploy on Azure (OpenAl Integration available).

GitHub Copilot licenses approved for 8 developers (future ease)
 */