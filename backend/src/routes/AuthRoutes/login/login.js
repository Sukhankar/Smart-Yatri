import express from 'express';
import prisma from '../../../lib/prisma.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = express.Router();

// Log all requests to this router
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

/**
 * Login API: Accepts username & password. 
 * - On success: issues session cookie and returns user+role info.
 * - Session is single-use: removes previous sessions.
 */
router.post('/', async (req, res) => {
  console.log('Login request received:', { body: req.body });
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required.',
      });
    }

    // Find user by username
    const user = await prisma.userLogin.findUnique({
      where: { username },
      include: {
        assignedRole: true,   // include the related role
        profile: true,        // include the related profile
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials.',
      });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials.',
      });
    }

    // Update lastLogin timestamp
    await prisma.userLogin.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Clean up previous sessions (allow only one active login)
    await prisma.session.deleteMany({ where: { userId: user.id } });

    // Create secure session token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await prisma.session.create({
      data: {
        token: tokenHash,
        userId: user.id,
        // Set lastUsed/createdAt/updatedAt use defaults
      }
    });

    // Log successful login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        details: JSON.stringify({
          loginType: user.loginType,
          role: user.assignedRole?.name,
        }),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    });

    // Compose the safe user info to send in response
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      loginType: user.loginType,
      roleId: user.roleId,
      role: user.assignedRole
        ? { id: user.assignedRole.id, name: user.assignedRole.name, type: user.assignedRole.type }
        : null,
      profile: user.profile
        ? {
            fullName: user.profile.fullName,
            schoolName: user.profile.schoolName,
            roleType: user.profile.roleType,
            idNumber: user.profile.idNumber,
            classOrPosition: user.profile.classOrPosition,
            photo: user.profile.photo
          }
        : null,
      // Add additional info here if needed (e.g., permissions later)
    };

    // Issue session cookie (secure, httpOnly, 1hr expiry)
    res.cookie('sessionToken', rawToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: true,
      maxAge: 60 * 60 * 1000, // 1 hour in ms
    });

    return res.json({
      success: true,
      user: safeUser,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Login failed.',
    });
  }
});

export default router;
