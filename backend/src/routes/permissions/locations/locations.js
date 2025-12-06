import prisma from '../../../lib/prisma.js';
import { Router } from 'express';

const router = Router();

// Unified list of locations for filtering users
router.get('/', async (req, res) => {
  try {
    // Fetch warehouses and stores
    const [warehouses, stores] = await Promise.all([
      prisma.warehouse.findMany({ select: { id: true, name: true }, orderBy: { id: 'asc' } }),
      prisma.store.findMany({ select: { id: true, name: true }, orderBy: { id: 'asc' } }),
    ]);
    const locations = [
      ...warehouses.map(w => ({ id: `w:${w.id}`, type: 'warehouse', refId: w.id, name: w.name })),
      ...stores.map(s => ({ id: `s:${s.id}`, type: 'store', refId: s.id, name: s.name })),
    ];
    res.json({ success: true, locations });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;