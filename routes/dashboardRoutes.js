import express from "express";
import {
  stats,
  sales,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get('/stats', stats);
router.get('/sales', sales);

export default router;
