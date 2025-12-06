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
    { name: "OFFICER", description: "Officer/Checker", isDefault: false, type: "officer" },
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
    OFFICER: [],
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
