const User = require('../models/User');
const { generateToken } = require('../config/jwt');

const authController = {
    register: async (req, res) => {
        try {
            const {
                username,
                email,
                password,
                confirmPassword,
                role = 'user',
                languagePreference,
                services,
            } = req.body;

            // Validation
            if (!username || !email || !password || !confirmPassword) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({ error: 'Passwords do not match' });
            }

            if (password.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters' });
            }

            // Validate role
            if (!['user', 'admin'].includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ username }, { email }],
            });

            if (existingUser) {
                return res.status(400).json({ error: 'Username or email already exists' });
            }

            // If registering as admin, check if there's an existing admin
            if (role === 'admin') {
                const adminExists = await User.findOne({ role: 'admin' });
                if (adminExists) {
                    return res.status(403).json({
                        error: 'Admin already exists. Contact existing admin for approval.',
                    });
                }
                // First admin auto-approved
                var newUser = new User({
                    username,
                    email,
                    password,
                    role: 'admin',
                    approved: true,
                    languagePreference: languagePreference || {
                        userA: 'English',
                        userB: 'English',
                    },
                    services: services || {},
                });
            } else {
                // Regular user registration - needs approval
                newUser = new User({
                    username,
                    email,
                    password,
                    role: 'user',
                    approved: false,
                    languagePreference: languagePreference || {
                        userA: 'English',
                        userB: 'English',
                    },
                    services: services || {},
                });
            }

            await newUser.save();

            // Generate token
            const token = generateToken(newUser._id, newUser.username, newUser.role);

            res.status(201).json({
                message:
                    role === 'user'
                        ? 'Registration successful. Awaiting admin approval.'
                        : 'Admin registered successfully',
                token,
                user: newUser.toJSON(),
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    },

    login: async (req, res) => {
        try {
            const { username, password } = req.body;

            // Validation
            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password are required' });
            }

            // Find user
            const user = await User.findOne({ username });

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Check password
            const isPasswordValid = await user.comparePassword(password);

            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Check approval status for non-admin users
            if (user.role === 'user' && !user.approved) {
                return res.status(403).json({
                    error: 'Your account is pending admin approval. Please contact support.',
                });
            }

            // Generate token
            const token = generateToken(user._id, user.username, user.role);

            res.status(200).json({
                message: 'Login successful',
                token,
                user: user.toJSON(),
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user.userId).populate('approvedBy', 'username email');

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.status(200).json({
                message: 'Profile retrieved',
                user: user.toJSON(),
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Admin only: Get all pending approvals
    getPendingApprovals: async (req, res) => {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admins can access this' });
            }

            const pendingUsers = await User.find({ approved: false }).select('-password');

            res.status(200).json({
                message: 'Pending approvals retrieved',
                count: pendingUsers.length,
                users: pendingUsers,
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Admin only: Approve a user
    approveUser: async (req, res) => {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admins can approve users' });
            }

            const { userId, reason } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            if (user.approved) {
                return res.status(400).json({ error: 'User is already approved' });
            }

            user.approved = true;
            user.approvedBy = req.user.userId;
            user.approvalReason = reason || 'Approved by admin';

            await user.save();

            res.status(200).json({
                message: 'User approved successfully',
                user: user.toJSON(),
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Admin only: Reject a user
    rejectUser: async (req, res) => {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admins can reject users' });
            }

            const { userId, reason } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            const user = await User.findByIdAndDelete(userId);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.status(200).json({
                message: 'User rejected and removed',
                reason: reason || 'No reason provided',
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // User: Update own services/preferences
    updateProfile: async (req, res) => {
        try {
            const { languagePreference, services } = req.body;
            const user = await User.findById(req.user.userId);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            if (languagePreference) {
                user.languagePreference = { ...user.languagePreference, ...languagePreference };
            }

            if (services) {
                user.services = { ...user.services, ...services };
            }

            await user.save();

            res.status(200).json({
                message: 'Profile updated successfully',
                user: user.toJSON(),
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
};

module.exports = authController;
