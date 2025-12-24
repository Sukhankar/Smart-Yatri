import express from 'express';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';

const router = express.Router();

/**
 * Create route (manager/admin only)
 * POST /api/routes-management/add
 */
router.post('/', async (req, res) => {
  try {
    const { user } = await validateSession(req);

    if (
      user.assignedRole?.name !== 'MANAGER' &&
      user.assignedRole?.name !== 'ADMIN' &&
      user.loginType !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { name, stops, scheduleTime, busType, totalSeats } = req.body;

    if (!name || !stops || !scheduleTime) {
      return res.status(400).json({
        success: false,
        error: 'Name, stops, and scheduleTime are required',
      });
    }

    const route = await prisma.route.create({
      data: {
        name,
        stops: JSON.stringify(stops),
        scheduleTime: JSON.stringify(scheduleTime),
        active: true,
      },
    });

    return res.json({
      success: true,
      route: {
        id: route.id,
        name: route.name,
        stops: JSON.parse(route.stops),
        scheduleTime: JSON.parse(route.scheduleTime),
        active: route.active,
      },
    });
  } catch (err) {
    console.error('Error creating route:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to create route',
    });
  }
});

export default router;

