const CareerDocument = require('../models/CareerDocument');
const cloudinary = require('../config/cloudinary');
const { queueExtraction } = require('../services/extractionQueue');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Semester = require('../models/Semester');

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
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
    from: process.env.NODEMAILER_FROM || process.env.NODEMAILER_USER || 'noreply@synapse.local',
    to,
    subject,
    text,
    html,
  });
};

const sendVaultResetEmail = async (user, rawToken) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://synapsecloud.vercel.app';
  const resetLink = `${frontendUrl}/career/reset-vault-password?token=${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Reset your Career Vault password',
    text: `Hi ${user.name}, reset your Career Vault password: ${resetLink}`,
    html: `
      <p>Hi ${user.name},</p>
      <p>Use the link below to reset your Career Vault password. This is specific to your Vault and will not change your main Synapse account password.</p>
      <p><a href="${resetLink}">Reset Vault password</a></p>
      <p>This link expires in 1 hour.</p>
    `,
  });
};

const validatePasswordStrength = (password) => {
  if (!password || !/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
    return 'Password must be at least 8 characters and include 1 uppercase letter and 1 number';
  }
  return null;
};

const setupPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and confirm password are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const validationError = validatePasswordStrength(password);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.vaultPasswordHash) {
      return res.status(400).json({ success: false, message: 'Vault password is already set up' });
    }

    user.vaultPasswordHash = await bcrypt.hash(password, 12);
    await user.save();

    res.cookie('vaultUnlocked', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
    });

    res.status(201).json({ success: true, unlocked: true });
  } catch (error) {
    console.error('Setup vault password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyAccess = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!user.vaultPasswordHash) {
      return res.status(200).json({ success: true, vaultSetupRequired: true });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const passwordMatches = await bcrypt.compare(password, user.vaultPasswordHash);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    res.cookie('vaultUnlocked', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
    });

    res.status(200).json({ success: true, unlocked: true });
  } catch (error) {
    console.error('Verify vault access error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { category, semesterId } = req.body;
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploadCareerDocToCloudinary(
      req.file.buffer, 
      req.file.originalname, 
      req.file.mimetype
    );

    // Queue extraction
    const extraction = await queueExtraction(req.file.buffer, req.file.mimetype, category);

    // Prepare document payload
    let documentPayload = {
      userId: req.user.id,
      category,
      fileUrl: uploadResult.cloudinaryUrl,
      cloudinaryPublicId: uploadResult.publicId,
      fileType,
      semesterId: semesterId || undefined
    };

    if (extraction.success && extraction.fields) {
      documentPayload = {
        ...documentPayload,
        title: extraction.fields.title,
        issuer: extraction.fields.issuer || undefined,
        dateEarned: extraction.fields.dateEarned ? new Date(extraction.fields.dateEarned) : undefined,
        skillsTags: Array.isArray(extraction.fields.skillsTags) ? extraction.fields.skillsTags : [],
        extractedFields: extraction.fields,
        extractionStatus: 'success'
      };
    } else {
      documentPayload = {
        ...documentPayload,
        title: `Untitled ${category.charAt(0).toUpperCase() + category.slice(1)}`,
        extractionStatus: 'failed',
        extractedFields: { rawResponse: extraction.rawResponse }
      };
    }

    const careerDocument = await CareerDocument.create(documentPayload);

    res.status(201).json({ success: true, careerDocument });
  } catch (error) {
    console.error('Upload career document error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDocuments = async (req, res) => {
  try {
    const { category, semesterId } = req.query;
    let query = { userId: req.user.id };
    
    if (category) query.category = category;
    if (semesterId) query.semesterId = semesterId;

    let documents = await CareerDocument.find(query).lean();
    
    // Sort by dateEarned descending (nulls last), then createdAt descending
    documents.sort((a, b) => {
      if (a.dateEarned && b.dateEarned) {
        return new Date(b.dateEarned) - new Date(a.dateEarned);
      }
      if (a.dateEarned) return -1;
      if (b.dateEarned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({ success: true, documents });
  } catch (error) {
    console.error('Get career documents error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDocument = async (req, res) => {
  try {
    const document = await CareerDocument.findOne({ _id: req.params.id, userId: req.user.id });
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

    res.json({ success: true, document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDocument = async (req, res) => {
  try {
    const { title, issuer, dateEarned, skillsTags, category, semesterId } = req.body;
    
    // Only pick allowed fields to update
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (issuer !== undefined) updates.issuer = issuer;
    if (dateEarned !== undefined) updates.dateEarned = dateEarned;
    if (skillsTags !== undefined) updates.skillsTags = skillsTags;
    if (category !== undefined) updates.category = category;
    if (semesterId !== undefined) updates.semesterId = semesterId;

    const document = await CareerDocument.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

    res.json({ success: true, document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const document = await CareerDocument.findOne({ _id: req.params.id, userId: req.user.id });
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

    // Cloudinary defaults resource_type to 'image' for pdfs uploaded directly unless explicitly 'raw'
    // but destroying works fine without resource_type if they are in standard storage format
    await cloudinary.uploader.destroy(document.cloudinaryPublicId);
    
    await CareerDocument.findByIdAndDelete(document._id);

    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user && user.vaultPasswordHash) {
      const rawToken = createRawToken();
      user.vaultPasswordResetToken = hashToken(rawToken);
      user.vaultPasswordResetExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
      await user.save();
      await sendVaultResetEmail(user, rawToken);
    }
  } catch (error) {
    console.error('Vault forgot password error:', error);
  }
  return res.status(200).json({ message: 'Reset link sent to your email' });
};

const resetVaultPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' });
    }

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const validationError = validatePasswordStrength(newPassword);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const vaultPasswordResetToken = hashToken(token);
    const user = await User.findOne({
      vaultPasswordResetToken,
      vaultPasswordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired' });
    }

    user.vaultPasswordHash = await bcrypt.hash(newPassword, 12);
    user.vaultPasswordResetToken = undefined;
    user.vaultPasswordResetExpires = undefined;
    await user.save();

    return res.status(200).json({ message: 'Vault password updated successfully' });
  } catch (error) {
    console.error('Vault reset password error:', error);
    return res.status(500).json({ message: 'Password reset failed' });
  }
};

const getTimeline = async (req, res) => {
  try {
    const { category, year, semesterId } = req.query;
    
    let careerDocsQuery = { userId: req.user.id };
    if (semesterId) careerDocsQuery.semesterId = semesterId;
    if (category && category !== 'semester-completion' && category !== 'academic') {
      careerDocsQuery.category = category;
    }
    const careerDocs = await CareerDocument.find(careerDocsQuery).lean();

    let semesterQuery = { userId: req.user.id };
    if (semesterId) semesterQuery._id = semesterId;
    const semesters = await Semester.find(semesterQuery).lean();

    let timeline = [];

    careerDocs.forEach(doc => {
      if (category === 'semester-completion') return;

      timeline.push({
        type: 'career',
        category: doc.category,
        title: doc.title || `Career Document (${doc.category})`,
        date: doc.dateEarned || doc.createdAt,
        sourceId: doc._id,
        details: {
          skillsTags: doc.skillsTags || [],
          issuer: doc.issuer,
          extractionStatus: doc.extractionStatus
        }
      });
    });

    semesters.forEach(sem => {
      if (category && category !== 'semester-completion' && category !== 'academic') return;

      timeline.push({
        type: 'academic',
        category: 'semester-completion',
        title: `Semester ${sem.semesterNumber}`,
        date: sem.endDate || sem.createdAt,
        sourceId: sem._id,
        details: {
          academicYear: sem.academicYear,
          isCompleted: sem.isCompleted,
          isActive: sem.isActive
        }
      });
    });

    if (year) {
      const yearNum = parseInt(year, 10);
      timeline = timeline.filter(item => {
        if (!item.date) return false;
        return new Date(item.date).getFullYear() === yearNum;
      });
    }

    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({ timeline });
  } catch (error) {
    console.error('Timeline error:', error);
    return res.status(500).json({ message: error.message });
  }
};



module.exports = {
  verifyAccess,
  setupPassword,
  forgotPassword,
  resetVaultPassword,
  uploadDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  getTimeline
};
