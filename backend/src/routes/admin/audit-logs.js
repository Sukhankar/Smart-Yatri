import express from 'express';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';

const router = express.Router();

/**
 * Get audit logs (admin only)
 * GET /api/admin/audit-logs
 */
const getAuditLogsHandler = async (req, res) => {
  try {
    const { user } = await validateSession(req);

    const isAdmin = user.assignedRole?.name === 'ADMIN' || user.loginType === 'ADMIN';
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const {
      page = 1,
      limit = 50,
      userId,
      action,
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (userId) where.userId = parseInt(userId, 10);
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.json({
      success: true,
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Create audit log entry
 * POST /api/admin/audit-logs
 */
const createAuditLogHandler = async (req, res) => {
  try {
    const { user } = await validateSession(req);
    const { action, details, ipAddress, userAgent } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action is required',
      });
    }

    const log = await prisma.auditLog.create({
      data: {
        userId: user.id,
        action,
        details: details ? JSON.stringify(details) : null,
        ipAddress: ipAddress || req.ip,
        userAgent: userAgent || req.get('User-Agent'),
      },
    });

    return res.json({
      success: true,
      log,
    });
  } catch (err) {
    console.error('Error creating audit log:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

router.get('/', getAuditLogsHandler);
router.post('/', createAuditLogHandler);

export default router;