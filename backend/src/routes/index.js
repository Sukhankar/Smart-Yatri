import express from "express";
import signupRoute from "./AuthRoutes/signup/signup.js";
import loginRoute from "./AuthRoutes/login/login.js";
import sessionRoute from "./AuthRoutes/session/session.js";
import checkRoute from "./AuthRoutes/check/check.js";
import forgotPasswordRoute from "./AuthRoutes/forgot-password/forgot-password.js";
import resetPasswordRoute from "./AuthRoutes/reset-password/reset-password.js";
import changePasswordRoute from "./AuthRoutes/change-password/change-password.js";
import { logoutHandler } from "./AuthRoutes/Logout/Logout.js";

// Permissions system routes
import locationsRoute from "./permissions/locations/locations.js";
import catalogRoute from "./permissions/catalog/catalog.js";

// Route handlers for permissions/roles
import {
  getRolesHandler,
  postRolesHandler,
} from "./permissions/roles/roles.js";
import * as rolesIdHandlers from "./permissions/roles/[id]/route.js";

// PATCH handler for /permissions/users/:id
import { PATCH as patchUserPermissions } from "./permissions/users/[id]/route.js";

// Directly include the relevant user handlers
import { getUsers } from "./permissions/users/users.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Backend with Prisma & MySQL is running!" });
});

// Auth routes
router.use("/auth/signup", signupRoute);
router.use("/auth/login", loginRoute);
router.post("/auth/logout", logoutHandler);
router.use("/auth/session", sessionRoute);
router.use("/auth/check", checkRoute);
router.use("/auth/forgot-password", forgotPasswordRoute);
router.use("/auth/reset-password", resetPasswordRoute);
router.use("/auth/change-password", changePasswordRoute);

// Permissions: /roles - GET, POST
router.get("/permissions/roles", getRolesHandler);
router.post("/permissions/roles", postRolesHandler);

// Custom PATCH and DELETE for roles/:id
router.patch("/permissions/roles/:id", (req, res, next) => {
  rolesIdHandlers.PATCH(req, res, next, { id: req.params.id });
});
router.delete("/permissions/roles/:id", (req, res, next) => {
  rolesIdHandlers.DELETE(req, res, next, { id: req.params.id });
});

// Permissions: /users - GET users
router.get("/permissions/users", getUsers);
// Add more user routes here as needed

router.patch("/permissions/users/:id", (req, res, next) => {
  patchUserPermissions(req, res, next, { id: req.params.id });
});

router.use("/permissions/locations", locationsRoute);
router.use("/permissions/catalog", catalogRoute);

// QR Code routes
import generateQRRoute from "./qr/generate-qr.js";
import verifyQRRoute from "./qr/verify-qr.js";
router.use("/qr/generate", generateQRRoute);
router.use("/qr/verify", verifyQRRoute);

// Ticket routes
import createTicketRoute from "./tickets/create-ticket.js";
import listTicketsRoute from "./tickets/list-tickets.js";
router.use("/tickets/create", createTicketRoute);
router.use("/tickets/list", listTicketsRoute);

// Pass routes
import createPassRoute from "./passes/create-pass.js";
import userPassRoute from "./passes/user-pass.js";
import approvePassRoute from "./passes/approve-pass.js";
router.use("/passes/create", createPassRoute);
router.use("/passes/user", userPassRoute);
router.use("/passes", approvePassRoute);

// Notification routes
import notificationsRoute from "./notifications/list-notifications.js";
router.use("/notifications", notificationsRoute);

// Route management
import routesManagementRoute from "./routes/list-routes.js";
router.use("/routes", routesManagementRoute);

// Routes management (alternative endpoints)
import routesManagementListRoute from "./routes-management/get-routes.js";
import routesManagementAddRoute from "./routes-management/add-route.js";
router.use("/routes-management/list", routesManagementListRoute);
router.use("/routes-management/add", routesManagementAddRoute);

// Travel history
import travelHistoryRoute from "./travel-history/list.js";
router.use("/travel-history", travelHistoryRoute);

// Bus management routes
import busesRoute from "./buses/list-buses.js";
router.use("/buses", busesRoute);

// Payment verification routes
import paymentsRoute from "./payments/verify-payment.js";
import upiQrRoute from "./payments/upi-qr.js";
router.use("/payments", paymentsRoute);
router.use("/payments", upiQrRoute);

// User management routes
import usersRoute from "./users/list-users.js";
router.use("/users", usersRoute);

// Reports/Dashboard stats routes
import reportsRoute from "./reports/dashboard-stats.js";
router.use("/reports", reportsRoute);

// Profile management routes
import profileRoute from "./profile/update-profile.js";
router.use("/profile", profileRoute);

export default router;
