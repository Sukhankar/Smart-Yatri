import prisma from '../../../../lib/prisma.js';

function toInt(v) { return Number.parseInt(v, 10); }

// Modern Node/Express-style route handlers
export async function PATCH(req, res, next, params) {
  try {
    const id = toInt(params.id);
    const body = req.body;
    const rename = body.name?.trim();
    const permissions = Array.isArray(body.permissions) ? body.permissions : null;

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) return res.status(404).json({ success: false, error: 'Role not found' });

    if (permissions && role.name === 'Admin') {
      return res.status(400).json({ success: false, error: 'Admin must retain full access' });
    }

    if (rename) {
      await prisma.role.update({ where: { id }, data: { name: rename } });
    }

    if (permissions) {
      const keys = [...new Set(permissions.map(String))];
      const perms = await prisma.permissionCatalog.findMany({
        where: { code: { in: keys }, active: true },
        select: { id: true },
      });
      const permIds = perms.map(p => p.id);

      await prisma.$transaction([
        prisma.rolePermission.deleteMany({ where: { roleId: id } }),
        ...permIds.map(pid => prisma.rolePermission.create({ data: { roleId: id, permissionId: pid } })),
      ]);
    }

    const updated = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userLogins: true } },
      },
    });

    return res.json({
      success: true,
      role: {
        id: updated.id,
        name: updated.name,
        isDefault: updated.isDefault,
        permissions: (updated.rolePermissions || []).map(p => p.permission.code),
        assignedCount: updated._count.userLogins,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (e) {
    const status = e.code === 'P2002' ? 409 : 500;
    const error = e.code === 'P2002' ? 'Role name must be unique' : e.message;
    return res.status(status).json({ success: false, error });
  }
}

export async function DELETE(req, res, next, params) {
  try {
    const id = Number(params.id);
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) return res.status(404).json({ success: false, error: 'Role not found' });
    if (role.isDefault) return res.status(400).json({ success: false, error: 'Cannot delete default role' });

    const fallback = await prisma.role.findFirst({
      where: { id: { not: id }, name: 'Cashier' },
    }) || await prisma.role.findFirst({
      where: { id: { not: id } },
      orderBy: { id: 'asc' },
    });

    await prisma.userLogin.updateMany({
      where: { roleId: id },
      data: { roleId: fallback ? fallback.id : null },
    });

    await prisma.role.delete({ where: { id } });
    return res.json({ success: true, reassignedToRoleId: fallback?.id ?? null });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
}