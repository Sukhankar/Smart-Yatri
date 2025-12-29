// src/utils/seedData.js
import prisma from '../lib/prisma.js';

let hasSeeded = false;

export async function seedRoleData() {
  // ENSURE THIS FUNCTION ONLY EVER SUCCEEDS ONCE PER DATABASE
  if (hasSeeded) return;

  // Only seed if no ADMIN role AND no main permission in DB (idempotent)
  const alreadySeeded = await prisma.role.findFirst({
    where: { name: "ADMIN" }
  });
  const alreadyPermission = await prisma.permissionCatalog.findFirst({
    where: { code: "PERM_MANAGE_USERS" }
  });

  if (alreadySeeded && alreadyPermission) {
    hasSeeded = true;
    return;
  }

  // Seed only once, do not attempt more than once per process start
  hasSeeded = true;

  // --- PERMISSIONS (SAFE INSERT) ---
  const permissionsData = [
    {
      code: 'PERM_MANAGE_USERS',
      title: 'Manage Users',
      category: 'User Management',
      type: 'CORE',
      route: '/admin/users',
      active: true,
    },
    {
      code: 'PERM_VIEW_REPORTS',
      title: 'View Reports',
      category: 'Reporting',
      type: 'CORE',
      route: '/admin/reports',
      active: true,
    },
    {
      code: 'PERM_BOOK_PASS',
      title: 'Book Pass',
      category: 'Pass',
      type: 'USER',
      route: '/booking/pass',
      active: true,
    },
    {
      code: 'PERM_MANAGE_PASSES',
      title: 'Manage Passes',
      category: 'Pass',
      type: 'ADMIN',
      route: '/admin/passes',
      active: true,
    }
  ];

  await prisma.permissionCatalog.createMany({
    data: permissionsData,
    skipDuplicates: true,
  });

  // --- ROLES (SAFE INSERT) ---
  const rolesData = [
    { name: "ADMIN", description: "System Administrator", isDefault: false, type: "admin" },
    { name: "STAFF", description: "School or Bus Staff", isDefault: false, type: "staff" },
    { name: "STUDENT", description: "Student User", isDefault: true, type: "student" },
    { name: "MANAGER", description: "MANAGER/Checker", isDefault: false, type: "MANAGER" },
    { name: "CONDUCTOR", description: "Conductor", isDefault: false, type: "conductor" },
  ];

  await prisma.role.createMany({
    data: rolesData,
    skipDuplicates: true,
  });

  // --- FETCH CURRENT ROLES & PERMISSIONS ---
  const roles = await prisma.role.findMany();
  const permissions = await prisma.permissionCatalog.findMany();

  // MAP roleName → permissionCodes
  const rolePermissionMap = {
    ADMIN: ['PERM_MANAGE_USERS', 'PERM_VIEW_REPORTS', 'PERM_MANAGE_PASSES', 'PERM_BOOK_PASS'],
    STAFF: ['PERM_VIEW_REPORTS', 'PERM_MANAGE_PASSES'],
    STUDENT: ['PERM_BOOK_PASS'],
    MANAGER: [],
    CONDUCTOR: [],
  };

  // Build list of missing role-permission pairs
  const rolePermissionInsert = [];

  for (const role of roles) {
    const allowedCodes = rolePermissionMap[role.name] || [];
    for (const code of allowedCodes) {
      const perm = permissions.find(p => p.code === code);
      if (!perm) continue;

      // Check if relation already exists
      const exists = await prisma.rolePermission.findFirst({
        where: {
          roleId: role.id,
          permissionId: perm.id,
        }
      });

      if (!exists) {
        rolePermissionInsert.push({
          roleId: role.id,
          permissionId: perm.id,
        });
      }
    }
  }

  if (rolePermissionInsert.length > 0) {
    await prisma.rolePermission.createMany({
      data: rolePermissionInsert,
      skipDuplicates: true,
    });
  }

  console.log("✅ Roles & Permissions seeded safely (only ONCE per db, no duplicates)");
}

export async function seedSystemSettings() {
  const settingsData = [
    {
      key: 'APP_NAME',
      value: 'Bus Ticket Booking System',
      description: 'Application name displayed throughout the system',
      type: 'string',
      category: 'GENERAL',
    },
    {
      key: 'APP_VERSION',
      value: '1.0.0',
      description: 'Current application version',
      type: 'string',
      category: 'GENERAL',
    },
    {
      key: 'MAINTENANCE_MODE',
      value: 'false',
      description: 'Enable maintenance mode to disable user access',
      type: 'boolean',
      category: 'GENERAL',
    },
    {
      key: 'DEFAULT_TIMEZONE',
      value: 'Asia/Kolkata',
      description: 'Default timezone for the application',
      type: 'string',
      category: 'GENERAL',
    },
    {
      key: 'SESSION_TIMEOUT',
      value: '60',
      description: 'Session timeout in minutes',
      type: 'number',
      category: 'SECURITY',
    },
    {
      key: 'PASSWORD_MIN_LENGTH',
      value: '8',
      description: 'Minimum password length requirement',
      type: 'number',
      category: 'SECURITY',
    },
    {
      key: 'MAX_LOGIN_ATTEMPTS',
      value: '5',
      description: 'Maximum failed login attempts before lockout',
      type: 'number',
      category: 'SECURITY',
    },
    {
      key: 'ENABLE_2FA',
      value: 'false',
      description: 'Enable two-factor authentication',
      type: 'boolean',
      category: 'SECURITY',
    },
    {
      key: 'PAYMENT_GATEWAY',
      value: 'RAZORPAY',
      description: 'Payment gateway provider',
      type: 'string',
      category: 'PAYMENT',
    },
    {
      key: 'CURRENCY',
      value: 'INR',
      description: 'Default currency for transactions',
      type: 'string',
      category: 'PAYMENT',
    },
    {
      key: 'TAX_RATE',
      value: '18',
      description: 'Tax rate percentage for payments',
      type: 'number',
      category: 'PAYMENT',
    },
    {
      key: 'EMAIL_ENABLED',
      value: 'true',
      description: 'Enable email notifications',
      type: 'boolean',
      category: 'NOTIFICATION',
    },
    {
      key: 'SMS_ENABLED',
      value: 'false',
      description: 'Enable SMS notifications',
      type: 'boolean',
      category: 'NOTIFICATION',
    },
    {
      key: 'PUSH_ENABLED',
      value: 'true',
      description: 'Enable push notifications',
      type: 'boolean',
      category: 'NOTIFICATION',
    },
    {
      key: 'NOTIFICATION_FROM_EMAIL',
      value: 'noreply@busticket.com',
      description: 'Sender email address for notifications',
      type: 'string',
      category: 'NOTIFICATION',
    },
  ];

  for (const setting of settingsData) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting,
    });
  }

  console.log("✅ System settings seeded");
}
