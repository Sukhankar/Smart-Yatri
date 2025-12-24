import express from 'express';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';

const router = express.Router();

/**
 * Get dashboard statistics (manager/admin only)
 * GET /api/reports/dashboard-stats or GET /api/reports
 */
const dashboardStatsHandler = async (req, res) => {
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

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    // Total active students/staff
    const totalActiveUsers = await prisma.userLogin.count({
      where: {
        loginType: { in: ['STUDENT', 'STAFF'] },
        profile: { isNot: null },
      },
    });

    // Valid passes
    const validPasses = await prisma.pass.count({
      where: {
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    // Expired passes
    const expiredPasses = await prisma.pass.count({
      where: {
        status: { in: ['ACTIVE', 'EXPIRED'] },
        endDate: { lt: now },
      },
    });

    // Pending payment verifications
    const pendingPayments = await prisma.payment.count({
      where: { status: 'PENDING' },
    });

    // Daily scans (today)
    const dailyScans = await prisma.travelHistory.count({
      where: {
        travelDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // Total active routes
    const activeRoutes = await prisma.route.count({
      where: { active: true },
    });

    // Total active buses
    const activeBuses = await prisma.bus.count({
      where: { active: true },
    });

    // Recent activity (last 10 scans)
    const recentActivity = await prisma.travelHistory.findMany({
      take: 10,
      orderBy: { travelDate: 'desc' },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        route: true,
      },
    });

    // Pass purchase statistics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPasses = await prisma.pass.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    return res.json({
      success: true,
      stats: {
        totalActiveUsers,
        validPasses,
        expiredPasses,
        pendingPayments,
        dailyScans,
        activeRoutes,
        activeBuses,
        recentPasses,
      },
      recentActivity: recentActivity.map((activity) => ({
        id: activity.id,
        userName: activity.user.profile?.fullName || activity.user.username,
        routeName: activity.route.name,
        travelDate: activity.travelDate,
        ticketType: activity.ticketType,
        validatedAt: activity.validatedAt,
      })),
    });
  } catch (err) {
    console.error('Error getting dashboard stats:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to get dashboard stats',
    });
  }
};

router.get('/', dashboardStatsHandler);
router.get('/dashboard-stats', dashboardStatsHandler);

export default router;

