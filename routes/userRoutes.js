import express from "express";
import { getUser, loginUser, logoutUser } from "../controllers/userController.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/user/:id", getUser);

export default router;
