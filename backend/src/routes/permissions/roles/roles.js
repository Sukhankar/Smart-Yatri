import prisma from '../../../lib/prisma.js';

function mapRole(r) {
  return {
    id: r.id,
    name: r.name,
    isDefault: r.isDefault ?? false,
    permissions: (r.rolePermissions || []).map(p => p.permission.code),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    assignedCount: r._count?.userLogins ?? 0,
  };
}

// Express-style handler
export async function getRolesHandler(req, res) {
  try {
    const url = req.originalUrl ? new URL(req.originalUrl, 'http://localhost') : null;
    let type = null;
    if (url) {
      type = url.searchParams.get('type');
    }
    const where = type ? { type } : {};
    const roles = await prisma.Role.findMany({
      where,
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userLogins: true } },
      },
      orderBy: { id: 'asc' },
    });
    res.status(200).json({ success: true, roles: roles.map(r => ({ ...mapRole(r), type: r.type })) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

export async function postRolesHandler(req, res) {
  try {
    const body = req.body;
    const name = (body.name || '').trim();
    const cloneFromId = body.cloneFromId ?? null;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Role name is required' });
    }

    let cloneKeys = [];
    if (cloneFromId) {
      const src = await prisma.Role.findUnique({
        where: { id: Number(cloneFromId) },
        include: { rolePermissions: { include: { permission: true } } },
      });
      if (!src) {
        return res.status(404).json({ success: false, error: 'Source role not found' });
      }
      cloneKeys = (src.rolePermissions || []).map(p => p.permission.code);
    }
    const perms = await prisma.PermissionCatalog.findMany({ where: { code: { in: cloneKeys }, active: true } });

    const role = await prisma.Role.create({
      data: {
        name,
        isDefault: false,
        rolePermissions: {
          create: perms.map(pi => ({ permissionId: pi.id })),
        },
      },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userLogins: true } },
      },
    });

    res.status(201).json({ success: true, role: mapRole(role) });
  } catch (e) {
    const status = e.code === 'P2002' ? 409 : 500;
    const error = e.code === 'P2002' ? 'Role name must be unique' : e.message;
    res.status(status).json({ success: false, error });
  }
}