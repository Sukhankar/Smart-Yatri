import express from 'express';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';

const router = express.Router();

/**
 * Get user notifications
 * GET /api/notifications/list or GET /api/notifications
 * Query: ?role=broadcastRole (optional, for managers)
 */
const listNotificationsHandler = async (req, res) => {
  try {
    const { user } = await validateSession(req);
    const { role } = req.query;

    let notifications = [];

    if (role && (user.assignedRole?.name === 'MANAGER' || user.assignedRole?.name === 'ADMIN')) {
      // Get broadcast notifications for role
      notifications = await prisma.notification.findMany({
        where: {
          broadcastRole: role,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } else {
      // Get user-specific notifications
      notifications = await prisma.notification.findMany({
        where: {
          userId: user.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    }

    return res.json({
      success: true,
      notifications: notifications.map((notif) => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        isRead: notif.isRead,
        createdAt: notif.createdAt,
      })),
      unreadCount: notifications.filter((n) => !n.isRead).length,
    });
  } catch (err) {
    console.error('Error listing notifications:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to list notifications',
    });
  }
};

router.get('/', listNotificationsHandler);
router.get('/list', listNotificationsHandler);

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const { user } = await validateSession(req);
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }

    if (notification.userId && notification.userId !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true },
    });

    return res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to mark notification as read',
    });
  }
});

/**
 * Create notification (for managers/admins)
 * POST /api/notifications/create
 */
router.post('/create', async (req, res) => {
  try {
    const { user } = await validateSession(req);
    const { userId, broadcastRole, title, message, type = 'INFO' } = req.body;

    // Check if user has permission to create notifications
    if (
      user.assignedRole?.name !== 'MANAGER' &&
      user.assignedRole?.name !== 'ADMIN' &&
      user.loginType !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to create notifications',
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Title and message are required',
      });
    }

    if (!userId && !broadcastRole) {
      return res.status(400).json({
        success: false,
        error: 'Either userId or broadcastRole is required',
      });
    }

    const notification = await prisma.notification.create({
      data: {
        userId: userId ? parseInt(userId) : null,
        broadcastRole: broadcastRole || null,
        title,
        message,
        type,
      },
    });

    return res.json({
      success: true,
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt,
      },
    });
  } catch (err) {
    console.error('Error creating notification:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to create notification',
    });
  }
});

export default router;
