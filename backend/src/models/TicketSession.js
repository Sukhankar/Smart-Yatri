import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to get TicketSession model
export async function getTicketSessionModel() {
  return prisma.ticketSession;
}


