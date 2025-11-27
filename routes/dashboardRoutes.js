import express from "express";
import {
  stats,
  sales,
  getLogedInUsers,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get('/stats', stats);
router.get('/sales', sales);
router.get('/getlogedinusers', getLogedInUsers);

export default router;
