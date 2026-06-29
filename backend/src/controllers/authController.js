const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const normalizeEmail = (email) => email?.trim().toLowerCase();

const createRawToken = () => crypto.randomBytes(32).toString('hex');

const createTransporter = () => {
  const port = Number(process.env.NODEMAILER_PORT);

  if (process.env.NODEMAILER_HOST) {
    return nodemailer.createTransport({
      host: process.env.NODEMAILER_HOST,
      port: port || 587,
      secure: process.env.NODEMAILER_SECURE === 'true' || port === 465,
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    service: process.env.NODEMAILER_SERVICE || 'gmail',
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from:
      process.env.NODEMAILER_FROM ||
      process.env.NODEMAILER_USER ||
      'noreply@synapse.local',
    to,
    subject,
    text,
    html,
  });
};

const sendVerificationEmail = async (user, rawToken) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://synapsecloud.vercel.app';
  const verificationLink = `${frontendUrl}/verify-email?token=${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Verify your Synapse account',
    text: `Hi ${user.name}, verify your Synapse account: ${verificationLink}`,
    html: `
      <p>Hi ${user.name},</p>
      <p>Please verify your Synapse account using the link below:</p>
      <p><a href="${verificationLink}">Verify email</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });
};

const sendResetPasswordEmail = async (user, rawToken) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://synapsecloud.vercel.app';
  const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Reset your Synapse password',
    text: `Hi ${user.name}, reset your Synapse password: ${resetLink}`,
    html: `
      <p>Hi ${user.name},</p>
      <p>Use the link below to reset your Synapse password:</p>
      <p><a href="${resetLink}">Reset password</a></p>
      <p>This link expires in 1 hour.</p>
    `,
  });
};

const buildUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  college: user.college,
  course: user.course,
  semester: user.semester,
  targetCGPA: user.targetCGPA,
  monthlyBudget: user.monthlyBudget,
  onboardingDone: user.onboardingDone,
  theme: user.theme,
  avatar: user.avatar,
  emailVerified: user.emailVerified,
  aiTokensUsed: user.aiTokensUsed || 0,
  aiTokenLimit: user.aiTokenLimit || 500000,
});


const validateRegisterInput = ({
  name,
  email,
  password,
}) => {
  if (!name || !email || !password) {
    return 'Name, email, and password are required';
  }

  if (String(name).trim().length < 2 || String(name).trim().length > 50) {
    return 'Name must be between 2 and 50 characters';
  }

  if (!/^\S+@\S+\.\S+$/.test(String(email))) {
    return 'Please provide a valid email address';
  }

  if (String(password).length < 8) {
    return 'Password must be at least 8 characters';
  }

  return null;
};

const validateResetPassword = (password) => {
  if (!password || !/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
    return 'Password must be at least 8 characters and include 1 uppercase letter and 1 number';
  }

  return null;
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const validationError = validateRegisterInput(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const rawToken = createRawToken();
    const verificationToken = hashToken(rawToken);
    const verificationTokenExpiry = new Date(
      Date.now() + VERIFICATION_TOKEN_EXPIRY_MS
    );

    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry,
    });

    const Semester = require('../models/Semester');
    await Semester.create({
      userId: user._id,
      semesterNumber: 1,
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      isActive: true
    });

    await sendVerificationEmail(user, rawToken);

    return res.status(201).json({
      success: true,
      message: 'Check your email to verify your account.',
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Registration failed',
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification link is invalid or has expired',
      });
    }

    const verificationToken = hashToken(token);
    const user = await User.findOne({
      verificationToken,
      verificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Verification link is invalid or has expired',
      });
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email verified. Please log in.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Email verification failed',
    });
  }
};

const resendVerification = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
    }

    const rawToken = createRawToken();
    user.verificationToken = hashToken(rawToken);
    user.verificationTokenExpiry = new Date(
      Date.now() + VERIFICATION_TOKEN_EXPIRY_MS
    );
    await user.save();

    await sendVerificationEmail(user, rawToken);

    return res.status(200).json({
      success: true,
      message: 'Verification email sent.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not resend verification email',
    });
  }
};

const login = async (req, res) => {
  try {
    const { password, rememberMe } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({
        success: false,
        message: 'Account is locked. Please try again later.',
        unlockTime: user.lockUntil,
      });
    }

    if (user.lockUntil && user.lockUntil <= Date.now()) {
      user.lockUntil = undefined;
      user.loginAttempts = 0;
      await user.save();
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first.',
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        await user.save();

        return res.status(403).json({
          success: false,
          message: 'Too many failed login attempts. Account locked.',
          unlockTime: user.lockUntil,
        });
      }

      await user.save();

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed: ' + error.message,
    });
  }
};

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  });

  res.clearCookie('vaultUnlocked', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = email ? await User.findOne({ email }) : null;

    if (user) {
      const rawToken = createRawToken();
      user.resetPasswordToken = hashToken(rawToken);
      user.resetPasswordExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
      await user.save();

      await sendResetPasswordEmail(user, rawToken);
    }
  } catch (error) {
    console.error('Forgot password failed:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'If an account exists, a password reset link has been sent.',
  });
};

const resetPassword = async (req, res) => {
  try {
    const token = req.body.token || req.query.token;
    const { password } = req.body;

    const validationError = validateResetPassword(password);
    if (!token || validationError) {
      return res.status(400).json({
        success: false,
        message: validationError || 'Reset token is required',
      });
    }

    const resetPasswordToken = hashToken(token);
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired',
      });
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. Please log in.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Password reset failed',
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user: buildUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not fetch user profile',
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
};
