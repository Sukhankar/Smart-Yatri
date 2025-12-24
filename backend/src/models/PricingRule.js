import mongoose from 'mongoose';
import { connectMongo } from '../lib/mongoose.js';

const PricingRuleSchema = new mongoose.Schema(
  {
    ticketType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      unique: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    studentPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    staffPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    regularPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

/**
 * Returns or creates a PricingRule for a given ticketType using sensible defaults.
 * This allows dynamic pricing to live fully in the database while keeping
 * the backend logic simple.
 */
export async function getOrCreatePricingRule(ticketType = 'DAILY') {
  await connectMongo();
  const PricingRule =
    mongoose.models.PricingRule || mongoose.model('PricingRule', PricingRuleSchema);

  let rule = await PricingRule.findOne({ ticketType }).lean();
  if (rule) return rule;

  const defaultBase = 50;
  // Simple default discounts – admin can later adjust via a dedicated UI/API
  const defaults = {
    basePrice: defaultBase,
    studentPrice: Math.round(defaultBase * 0.7), // 30% off
    staffPrice: Math.round(defaultBase * 0.85), // 15% off
    regularPrice: defaultBase,
  };

  rule = await PricingRule.create({
    ticketType,
    ...defaults,
  });

  return rule.toObject();
}


