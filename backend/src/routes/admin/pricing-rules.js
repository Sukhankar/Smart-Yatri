import express from 'express';
import logger from '../../utils/logger.js';
import { validateSession } from '../../lib/auth.js';
import prisma from '../../lib/prisma.js';
import { getOrCreatePricingRule } from '../../models/PricingRule.js';

const router = express.Router();

function ensureAdmin(user) {
  const role = user.assignedRole?.name || user.loginType;
  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER';

  if (!isAdmin && !isManager) {
    const err = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }
}

function parseNumber(value, field, min = 0) {
  if (value === undefined || value === null || value === '') {
    const err = new Error(`${field} is required`);
    err.status = 400;
    throw err;
  }
  const num = Number(value);
  if (Number.isNaN(num) || num < min) {
    const err = new Error(`${field} must be a number >= ${min}`);
    err.status = 400;
    throw err;
  }
  return num;
}

/**
 * List pricing rules
 * GET /api/admin/pricing-rules
 */
router.get('/', async (req, res) => {
  try {
    const { user } = await validateSession(req);
    ensureAdmin(user);

    // For now, only DAILY exists, but can be extended
    const rule = await getOrCreatePricingRule('DAILY');

    return res.json({
      success: true,
      rules: [rule],
    });
  } catch (err) {
    logger.error('Error listing pricing rules:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to list pricing rules',
    });
  }
});

/**
 * Update pricing rule
 * PUT /api/admin/pricing-rules/:ticketType
 */
router.put('/:ticketType', async (req, res) => {
  try {
    const { user } = await validateSession(req);
    ensureAdmin(user);

    const { ticketType } = req.params;
    const { basePrice, studentPrice, staffPrice, regularPrice } = req.body;

    const base = parseNumber(basePrice, 'basePrice', 0);
    const student = parseNumber(studentPrice, 'studentPrice', 0);
    const staff = parseNumber(staffPrice, 'staffPrice', 0);
    const regular = parseNumber(regularPrice, 'regularPrice', 0);

    // Update the rule in DB
    const updated = await prisma.pricingRule.upsert({
      where: { ticketType },
      update: { basePrice: base, studentPrice: student, staffPrice: staff, regularPrice: regular },
      create: { ticketType, basePrice: base, studentPrice: student, staffPrice: staff, regularPrice: regular },
    });

    return res.json({
      success: true,
      rule: updated,
    });
  } catch (err) {
    logger.error('Error updating pricing rule:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to update pricing rule',
    });
  }
});

export default router;