import express from "express";
import prisma from "../../../lib/prisma.js";
import { validateSession } from "../../../lib/auth.js";

const router = express.Router();

// Normalize a route for consistent comparison
const normalizePath = (path) => {
  if (!path) return "/";
  let p = path.split("?")[0].replace(/\/+$/, "").toLowerCase();
  if (p === "") p = "/";
  return p.startsWith("/") ? p : "/" + p;
};

// GET /api/auth/check?path=...
router.get("/", async (req, res) => {
  try {
    // 1️⃣ Validate session (using cookie or headers as needed)
    const { user } = await validateSession(req);

    // 2️⃣ Determine loginType
    let loginType = null;
    if (user.warehouseId && !user.storeId) {
      loginType = "warehouse";
    } else if (user.storeId && !user.warehouseId) {
      loginType = "store";
    } else if (user.storeId && user.warehouseId) {
      loginType = "store";
    }

    // 3️⃣ Collect permissions from roles + user custom permissions
    const [rolePerms, customPerms] = await Promise.all([
      prisma.rolePermission.findMany({
        where: { roleId: user.roleId },
        include: { permission: true },
      }),
      prisma.userCustomPermission.findMany({
        where: { userId: user.id },
        include: { permission: true },
      }),
    ]);

    const allPerms = [
      ...rolePerms.map((r) => r.permission),
      ...customPerms.map((u) => u.permission),
    ].filter((p) => !!p && p.active);

    // 4️⃣ Filter by type (warehouse/store/global)
    const allowedRoutes = allPerms
      .filter((p) => {
        if (!p.type) return true;
        return p.type.toLowerCase() === loginType;
      })
      .map((p) => normalizePath(p.route));

    // 5️⃣ Strict match check
    const reqPath = normalizePath(req.query.path);
    const hasAccess = allowedRoutes.includes(reqPath);

    // 6️⃣ Safe user data
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      warehouseId: user.warehouseId,
      storeId: user.storeId,
    };

    res.status(200).json({
      success: true,
      user: safeUser,
      loginType,
      allowedRoutes,
      hasAccess,
    });
  } catch {
    res.status(401).json({ success: false, error: "Unauthorized" });
  }
});

export default router;
