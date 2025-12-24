import express from 'express';
import prisma from '../../lib/prisma.js';

const router = express.Router();

/**
 * Get all routes
 * GET /api/routes-management/list
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

export default router;

