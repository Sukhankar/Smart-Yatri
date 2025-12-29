import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Returns or creates a PricingRule for a given ticketType using sensible defaults.
 * This allows dynamic pricing to live fully in the database while keeping
 * the backend logic simple.
 */
export async function getOrCreatePricingRule(ticketType = 'DAILY') {
  let rule = await prisma.pricingRule.findUnique({
    where: { ticketType },
  });
  if (rule) return rule;

  const defaultBase = 50;
  // Simple default discounts – admin can later adjust via a dedicated UI/API
  const defaults = {
    basePrice: defaultBase,
    studentPrice: Math.round(defaultBase * 0.7), // 30% off
    staffPrice: Math.round(defaultBase * 0.85), // 15% off
    regularPrice: defaultBase,
  };

  rule = await prisma.pricingRule.create({
    data: {
      ticketType,
      ...defaults,
    },
  });

  return rule;
}


