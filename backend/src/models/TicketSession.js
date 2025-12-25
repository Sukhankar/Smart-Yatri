import mongoose from 'mongoose';
import { connectMongo } from '../lib/mongoose.js';

const TicketSessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    routeInfo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    // When this trip starts
    departureTime: {
      type: Date,
      required: true,
    },
    totalSeats: {
      type: Number,
      required: true,
      min: 1,
      max: 500,
    },
    availableSeats: {
      type: Number,
      required: true,
      min: 0,
      max: 500,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    // User-type based pricing (stored, never trusted from client)
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
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

TicketSessionSchema.index({ departureTime: 1, status: 1 });
TicketSessionSchema.index({ routeInfo: 1, status: 1 });
TicketSessionSchema.index({ status: 1, departureTime: -1 });

/**
 * Helper to get a compiled model with an ensured Mongo connection.
 */
export async function getTicketSessionModel() {
  await connectMongo();
  return mongoose.models.TicketSession || mongoose.model('TicketSession', TicketSessionSchema);
}


