import prisma from '../../../lib/prisma.js';

function mapUser(u) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    roleId: u.roleId,
    roleName: u.assignedRole?.name ?? null,
    customPermissions: u.customPermissions.map(c => c.permission.code),
  };
}

export async function getUsers(req, res) {
  try {
    const users = await prisma.UserLogin.findMany({
      include: {
        assignedRole: true,
        customPermissions: { include: { permission: true } },
      },
      orderBy: { id: 'asc' },
    });
    res.json({ success: true, users: users.map(mapUser) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}