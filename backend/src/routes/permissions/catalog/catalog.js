import express from 'express';
import prisma from '../../../lib/prisma.js';

const router = express.Router();

// GET /api/permissions/catalog
router.get('/', async (req, res) => {
  try {
    const type = req.query.type || null;
    const where = { active: true };
    if (type) where.type = type;
    const items = await prisma.PermissionCatalog.findMany({
      where,
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
    });
    return res.json({
      success: true,
      permissions: items.map(i => ({
        key: i.code,
        title: i.title,
        category: i.category,
        route: i.route,
        active: i.active,
        type: i.type,
      })),
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/permissions/catalog (optional: seed/update catalog in bulk)
router.post('/', async (req, res) => {
  try {
    const { permissions } = req.body; // [{ key|code, title, category, route, active? }]
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ success: false, error: 'permissions must be an array' });
    }
    const ops = permissions.map(p => prisma.PermissionCatalog.upsert({
      where: { code: p.code ?? p.key },
      update: {
        title: p.title,
        category: p.category,
        route: p.route,
        active: p.active ?? true,
      },
      create: {
        code: p.code ?? p.key,
        title: p.title,
        category: p.category,
        route: p.route,
        active: p.active ?? true,
      },
    }));
    await prisma.$transaction(ops);
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

export default router;