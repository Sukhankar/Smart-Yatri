import express from 'express';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';

const router = express.Router();

/**
 * Get all system settings (admin only)
 * GET /api/admin/system-settings
 */
const getSystemSettingsHandler = async (req, res) => {
  try {
    const { user } = await validateSession(req);

    const isAdmin = user.assignedRole?.name === 'ADMIN' || user.loginType === 'ADMIN';
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { category } = req.query;

    const where = {};
    if (category) where.category = category;

    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { key: 'asc' },
      ],
    });

    return res.json({
      success: true,
      settings,
    });
  } catch (err) {
    console.error('Error fetching system settings:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Update system setting (admin only)
 * PUT /api/admin/system-settings/:key
 */
const updateSystemSettingHandler = async (req, res) => {
  try {
    const { user } = await validateSession(req);
    const { key } = req.params;
    const { value } = req.body;

    const isAdmin = user.assignedRole?.name === 'ADMIN' || user.loginType === 'ADMIN';
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!value) {
      return res.status(400).json({
        success: false,
        error: 'Value is required',
      });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return res.json({
      success: true,
      setting,
    });
  } catch (err) {
    console.error('Error updating system setting:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Delete system setting (admin only)
 * DELETE /api/admin/system-settings/:key
 */
const deleteSystemSettingHandler = async (req, res) => {
  try {
    const { user } = await validateSession(req);
    const { key } = req.params;

    const isAdmin = user.assignedRole?.name === 'ADMIN' || user.loginType === 'ADMIN';
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    await prisma.systemSetting.delete({
      where: { key },
    });

    return res.json({
      success: true,
      message: 'Setting deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting system setting:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Setting not found',
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

router.get('/', getSystemSettingsHandler);
router.put('/:key', updateSystemSettingHandler);
router.delete('/:key', deleteSystemSettingHandler);

export default router;