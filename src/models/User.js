const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        approved: {
            type: Boolean,
            default: false,
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        approvalReason: {
            type: String,
            default: null,
        },
        // Language Preferences
        languagePreference: {
            userA: {
                type: String,
                enum: ['English', 'Hindi', 'Regional'],
                default: 'English',
            },
            userB: {
                type: String,
                enum: ['English', 'Hindi', 'Regional'],
                default: 'English',
            },
        },
        // Services/Accessibility Needs
        services: {
            noiseCancelledAudio: {
                type: Boolean,
                default: false,
            },
            audioTranscript: {
                type: Boolean,
                default: false,
            },
            visualAssistance: {
                type: Boolean,
                default: false,
            },
            mobilitySupport: {
                type: Boolean,
                default: false,
            },
            customServices: [
                {
                    serviceId: String,
                    serviceName: String,
                    enabled: Boolean,
                },
            ],
        },
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        console.error('Password hashing error:', error);
        throw error;
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (passwordToCheck) {
    return await bcrypt.compare(passwordToCheck, this.password);
};

// Method to return user without password
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
