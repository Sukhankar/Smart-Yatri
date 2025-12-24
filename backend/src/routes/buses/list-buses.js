import express from 'express';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';

const router = express.Router();

/**
 * Get all buses
 * GET /api/buses/list or GET /api/buses
 */
const listBusesHandler = async (req, res) => {
  try {
    const { active } = req.query;

    const where = {};
    if (active !== undefined) {
      where.active = active === 'true';
    }

    const buses = await prisma.bus.findMany({
      where,
      include: {
        conductor: {
          include: {
            profile: true,
          },
        },
        route: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      buses: buses.map((bus) => ({
        id: bus.id,
        numberPlate: bus.numberPlate,
        from: bus.from,
        to: bus.to,
        departureTime: bus.departureTime,
        arrivalTime: bus.arrivalTime,
        totalSeats: bus.totalSeats,
        active: bus.active,
        conductorId: bus.conductorId,
        conductor: bus.conductor
          ? {
              id: bus.conductor.id,
              username: bus.conductor.username,
              fullName: bus.conductor.profile?.fullName || bus.conductor.username,
            }
          : null,
        routeId: bus.routeId,
        route: bus.route
          ? {
              id: bus.route.id,
              name: bus.route.name,
            }
          : null,
        createdAt: bus.createdAt,
      })),
    });
  } catch (err) {
    console.error('Error listing buses:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to list buses',
    });
  }
};

router.get('/', listBusesHandler);
router.get('/list', listBusesHandler);

/**
 * Create bus (manager/admin only)
 * POST /api/buses/create
 */
router.post('/create', async (req, res) => {
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

    const { numberPlate, from, to, departureTime, arrivalTime, totalSeats, routeId, conductorId } =
      req.body;

    if (!numberPlate || !from || !to || !departureTime || !arrivalTime || !totalSeats) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required',
      });
    }

    // Check if bus with this number plate already exists
    const existingBus = await prisma.bus.findUnique({
      where: { numberPlate },
    });

    if (existingBus) {
      return res.status(409).json({
        success: false,
        error: 'Bus with this number plate already exists',
      });
    }

    // Verify conductor exists if provided
    if (conductorId) {
      const conductor = await prisma.userLogin.findUnique({
        where: { id: parseInt(conductorId) },
      });
      if (!conductor || (conductor.loginType !== 'CONDUCTOR' && conductor.assignedRole?.name !== 'CONDUCTOR')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid conductor ID',
        });
      }
    }

    const bus = await prisma.bus.create({
      data: {
        numberPlate,
        from,
        to,
        departureTime: new Date(departureTime),
        arrivalTime: new Date(arrivalTime),
        totalSeats: parseInt(totalSeats),
        routeId: routeId ? parseInt(routeId) : null,
        conductorId: conductorId ? parseInt(conductorId) : null,
        active: true,
      },
      include: {
        conductor: {
          include: {
            profile: true,
          },
        },
        route: true,
      },
    });

    return res.json({
      success: true,
      bus: {
        id: bus.id,
        numberPlate: bus.numberPlate,
        from: bus.from,
        to: bus.to,
        departureTime: bus.departureTime,
        arrivalTime: bus.arrivalTime,
        totalSeats: bus.totalSeats,
        active: bus.active,
        conductorId: bus.conductorId,
        conductor: bus.conductor
          ? {
              id: bus.conductor.id,
              username: bus.conductor.username,
              fullName: bus.conductor.profile?.fullName || bus.conductor.username,
            }
          : null,
        routeId: bus.routeId,
        route: bus.route
          ? {
              id: bus.route.id,
              name: bus.route.name,
            }
          : null,
      },
    });
  } catch (err) {
    console.error('Error creating bus:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to create bus',
    });
  }
});

/**
 * Update bus (manager/admin only)
 * PATCH /api/buses/:id
 */
router.patch('/:id', async (req, res) => {
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
    const {
      numberPlate,
      from,
      to,
      departureTime,
      arrivalTime,
      totalSeats,
      active,
      routeId,
      conductorId,
    } = req.body;

    const updateData = {};
    if (numberPlate) updateData.numberPlate = numberPlate;
    if (from) updateData.from = from;
    if (to) updateData.to = to;
    if (departureTime) updateData.departureTime = new Date(departureTime);
    if (arrivalTime) updateData.arrivalTime = new Date(arrivalTime);
    if (totalSeats) updateData.totalSeats = parseInt(totalSeats);
    if (active !== undefined) updateData.active = active;
    if (routeId !== undefined) updateData.routeId = routeId ? parseInt(routeId) : null;
    if (conductorId !== undefined) {
      if (conductorId) {
        const conductor = await prisma.userLogin.findUnique({
          where: { id: parseInt(conductorId) },
        });
        if (!conductor || (conductor.loginType !== 'CONDUCTOR' && conductor.assignedRole?.name !== 'CONDUCTOR')) {
          return res.status(400).json({
            success: false,
            error: 'Invalid conductor ID',
          });
        }
        updateData.conductorId = parseInt(conductorId);
      } else {
        updateData.conductorId = null;
      }
    }

    const bus = await prisma.bus.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        conductor: {
          include: {
            profile: true,
          },
        },
        route: true,
      },
    });

    return res.json({
      success: true,
      bus: {
        id: bus.id,
        numberPlate: bus.numberPlate,
        from: bus.from,
        to: bus.to,
        departureTime: bus.departureTime,
        arrivalTime: bus.arrivalTime,
        totalSeats: bus.totalSeats,
        active: bus.active,
        conductorId: bus.conductorId,
        conductor: bus.conductor
          ? {
              id: bus.conductor.id,
              username: bus.conductor.username,
              fullName: bus.conductor.profile?.fullName || bus.conductor.username,
            }
          : null,
        routeId: bus.routeId,
        route: bus.route
          ? {
              id: bus.route.id,
              name: bus.route.name,
            }
          : null,
      },
    });
  } catch (err) {
    console.error('Error updating bus:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to update bus',
    });
  }
});

/**
 * Delete bus (manager/admin only)
 * DELETE /api/buses/:id
 */
router.delete('/:id', async (req, res) => {
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

    await prisma.bus.delete({
      where: { id: parseInt(id) },
    });

    return res.json({
      success: true,
      message: 'Bus deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting bus:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to delete bus',
    });
  }
});

export default router;

