import prisma from '../../../../lib/prisma.js';

// PATCH handler for /permissions/users/:id
export async function PATCH(req, res, next, params) {
  try {
    const id = Number.parseInt(params.id, 10);
    const body = req.body;
    const custom = Array.isArray(body.custom) ? body.custom : null;

    const user = await prisma.UserLogin.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (custom) {
      const codes = [...new Set(custom.map(String))];
      const perms = await prisma.PermissionCatalog.findMany({
        where: { code: { in: codes }, active: true },
        select: { id: true },
      });
      const permIds = perms.map(p => p.id);

      await prisma.$transaction([
        prisma.UserCustomPermission.deleteMany({ where: { userId: id } }),
        ...permIds.map(pid => prisma.UserCustomPermission.create({ data: { userId: id, permissionId: pid } })),
      ]);
    }

    const updated = await prisma.UserLogin.findUnique({
      where: { id },
      include: {
        assignedRole: true,
        customPermissions: { include: { permission: true } }
      },
    });

    return res.json({
      success: true,
      user: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        roleId: updated.roleId,
        roleName: updated.assignedRole?.name ?? null,
        customPermissions: (updated.customPermissions || []).map(c => c.permission.code),
      },
    });
  } catch (e) {
    const status = 500;
    const error = e.message || 'An unknown error occurred';
    return res.status(status).json({ success: false, error });
  }
}