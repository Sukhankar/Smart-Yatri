import express from 'express';
import { validateSession } from '../../../lib/auth.js';
import prismaClientPromise from '../../../lib/prisma.js'; // Adjust import if prismaClient object differs

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Use shared auth logic
    const { user, session } = await validateSession(req);

    // Optionally update lastUsed timestamp
    if (
      session &&
      session.id &&
      session.lastUsed &&
      session.lastUsed instanceof Date &&
      session.lastUsed.getTime() !== new Date().getTime()
    ) {
      const prisma = (await prismaClientPromise).default || (await prismaClientPromise);
      await prisma.session.update({
        where: { id: session.id },
        data: { lastUsed: new Date() }
      });
    }

    const userInfo = {
      id: user.id,
      username: user.username,
      roleId: user.roleId ?? null,
      roleName: user.assignedRole ? user.assignedRole.name : null,
      loginType: user.loginType,
      warehouseId: user.warehouseId,
      warehouseName: user.warehouse ? user.warehouse.name : undefined,
      storeId: user.storeId,
      storeName: user.store ? user.store.name : undefined,
      lastLogin: user.lastLogin,
    };

    return res.json({ user: userInfo });

  } catch (err) {
    return res.status(500).json({ user: null, error: err.message || 'Failed to get session.' });
  }
});

export default router;
