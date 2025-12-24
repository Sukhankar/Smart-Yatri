import express from 'express';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';

const router = express.Router();

/**
 * List all users (manager/admin only)
 * GET /api/users/list or GET /api/users
 */
const listUsersHandler = async (req, res) => {
  try {
    const { user } = await validateSession(req);

    const isManager = user.assignedRole?.name === 'MANAGER' || user.loginType === 'MANAGER';
    const isAdmin = user.assignedRole?.name === 'ADMIN' || user.loginType === 'ADMIN';
    
    if (!isManager && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { role, loginType, search } = req.query;

    const where = {};
    if (role) {
      where.assignedRole = { name: role };
    }
    if (loginType) {
      where.loginType = loginType;
    }
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        { profile: { fullName: { contains: search } } },
        { profile: { idNumber: { contains: search } } },
      ];
    }

    const users = await prisma.userLogin.findMany({
      where,
      include: {
        profile: true,
        assignedRole: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        loginType: u.loginType,
        role: u.assignedRole
          ? {
              id: u.assignedRole.id,
              name: u.assignedRole.name,
            }
          : null,
        profile: u.profile
          ? {
              fullName: u.profile.fullName,
              schoolName: u.profile.schoolName,
              roleType: u.profile.roleType,
              idNumber: u.profile.idNumber,
              classOrPosition: u.profile.classOrPosition,
              photo: u.profile.photo,
              qrId: u.profile.qrId,
            }
          : null,
        lastLogin: u.lastLogin,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    console.error('Error listing users:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to list users',
    });
  }
};

router.get('/', listUsersHandler);
router.get('/list', listUsersHandler);

/**
 * Get user by ID (manager/admin only)
 * GET /api/users/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { user } = await validateSession(req);

    const isManager = user.assignedRole?.name === 'MANAGER' || user.loginType === 'MANAGER';
    const isAdmin = user.assignedRole?.name === 'ADMIN' || user.loginType === 'ADMIN';
    
    if (!isManager && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { id } = req.params;

    const foundUser = await prisma.userLogin.findUnique({
      where: { id: parseInt(id) },
      include: {
        profile: true,
        assignedRole: true,
        passes: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        tickets: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.json({
      success: true,
      user: {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        loginType: foundUser.loginType,
        role: foundUser.assignedRole
          ? {
              id: foundUser.assignedRole.id,
              name: foundUser.assignedRole.name,
            }
          : null,
        profile: foundUser.profile
          ? {
              fullName: foundUser.profile.fullName,
              schoolName: foundUser.profile.schoolName,
              roleType: foundUser.profile.roleType,
              idNumber: foundUser.profile.idNumber,
              classOrPosition: foundUser.profile.classOrPosition,
              photo: foundUser.profile.photo,
              qrId: foundUser.profile.qrId,
            }
          : null,
        lastLogin: foundUser.lastLogin,
        passes: foundUser.passes,
        tickets: foundUser.tickets,
        createdAt: foundUser.createdAt,
      },
    });
  } catch (err) {
    console.error('Error getting user:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to get user',
    });
  }
});

export default router;

