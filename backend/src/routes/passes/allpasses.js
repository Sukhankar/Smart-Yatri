import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/passes/all
router.get('/', async (req, res) => {
  try {
    // Get all Passes for manager view: include user and profile info
    const passes = await prisma.pass.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                fullName: true,
                idNumber: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Return passes with needed fields
    const result = passes.map(p => ({
      id: p.id,
      passCode: p.passCode,
      type: p.type,
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate,
      createdAt: p.createdAt,
      user: p.user
        ? {
            id: p.user.id,
            username: p.user.username,
            profile: p.user.profile
              ? {
                  fullName: p.user.profile.fullName,
                  idNumber: p.user.profile.idNumber
                }
              : null
          }
        : null,
      // Manager list UIs often want a fallback name string for easy display
      userName: p.user?.profile?.fullName || p.user?.username || ''
    }));

    res.json({ passes: result });
  } catch (err) {
    console.error('Error fetching passes:', err);
    res.status(500).json({ error: 'Failed to fetch passes' });
  }
});

export default router;
