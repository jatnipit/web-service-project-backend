import express from "express";
import * as testController from "../controllers/testController.js";

const router = express.Router();

router.get("/api/test/users", testController.getUsers);
router.get("/api/test/verify-token", testController.verifyToken);
router.post("/api/test/login", testController.login);
router.post("/api/test/register", testController.register);

export default router;
