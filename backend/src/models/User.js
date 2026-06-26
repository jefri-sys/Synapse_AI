const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      minlength: 8,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    college: {
      type: String,
      default: '',
    },
    course: {
      type: String,
      default: '',
    },
    semester: {
      type: Number,
      default: null,
    },
    year: {
      type: Number,
    },
    targetCGPA: {
      type: Number,
      default: 8.0,
    },
    monthlyBudget: {
      type: Number,
      default: 5000,
    },
    onboardingDone: {
      type: Boolean,
      default: false,
    },
    universityType: {
      type: String,
      enum: ['10_point', 'grade_letter'],
      default: '10_point',
    },
    avatar: {
      type: String,
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
    notificationPreferences: {
      type: Map,
      of: Boolean,
      default: {},
    },
    verificationToken: {
      type: String,
    },
    verificationTokenExpiry: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpiry: {
      type: Date,
    },
    vaultPasswordHash: {
      type: String,
      default: null,
    },
    vaultPasswordResetToken: {
      type: String,
      default: null,
    },
    vaultPasswordResetExpires: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    role: {
      type: String,
      default: 'student',
    },
    aiTokensUsed: {
      type: Number,
      default: 0,
    },
    aiTokenLimit: {
      type: Number,
      default: 500000,
    },
    resourceSearchHistory: [{
      query: String,
      timestamp: { type: Date, default: Date.now }
    }],
    aiPreferences: {
      global: {
        raw: { type: String, default: '', maxlength: 1000 },
        normalized: { type: String, default: '' },
        updatedAt: { type: Date }
      },
      notebook: {
        raw: { type: String, default: '', maxlength: 1000 },
        normalized: { type: String, default: '' },
        updatedAt: { type: Date }
      },
      planner: {
        raw: { type: String, default: '', maxlength: 1000 },
        normalized: { type: String, default: '' },
        updatedAt: { type: Date }
      },
      resourceExplorer: {
        raw: { type: String, default: '', maxlength: 1000 },
        normalized: { type: String, default: '' },
        updatedAt: { type: Date }
      }
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
