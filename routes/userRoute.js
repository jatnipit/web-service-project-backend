import express from "express";

import * as userController from "../controllers/userController.js";

const router = express.Router();
router.post("/register", userController.register);
router.post("/admin/register", userController.adminRegister);
router.post("/login", userController.login);
router.post("/login/admin", userController.adminLogin);
router.post("/logout", userController.logout);
router.get("/session/user", userController.getUserSession);
router.get("/session/admin", userController.getAdminSession);
// router.get("/verify-token", userController.verifyToken);

export default router;