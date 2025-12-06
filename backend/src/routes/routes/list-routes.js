import express from 'express';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';

const router = express.Router();

/**
 * Get all routes
 * GET /api/routes/list
 */
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;

    const where = {};
    if (active !== undefined) {
      where.active = active === 'true';
    }

    const routes = await prisma.route.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return res.json({
      success: true,
      routes: routes.map((route) => ({
        id: route.id,
        name: route.name,
        stops: JSON.parse(route.stops || '[]'),
        scheduleTime: JSON.parse(route.scheduleTime || '[]'),
        active: route.active,
        createdAt: route.createdAt,
      })),
    });
  } catch (err) {
    console.error('Error listing routes:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to list routes',
    });
  }
});

/**
 * Create route (manager/admin only)
 * POST /api/routes/create
 */
router.post('/create', async (req, res) => {
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

    const { name, stops, scheduleTime } = req.body;

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

/**
 * Update route (manager/admin only)
 * PATCH /api/routes/:id
 */
router.patch('/:id', async (req, res) => {
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

    const { id } = req.params;
    const { name, stops, scheduleTime, active } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (stops) updateData.stops = JSON.stringify(stops);
    if (scheduleTime) updateData.scheduleTime = JSON.stringify(scheduleTime);
    if (active !== undefined) updateData.active = active;

    const route = await prisma.route.update({
      where: { id: parseInt(id) },
      data: updateData,
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
    console.error('Error updating route:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to update route',
    });
  }
});

export default router;
