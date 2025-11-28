import express from "express";
import {
  stats,
  sales,
  getLoggedInUsers ,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get('/stats', stats);
router.get('/sales', sales);
router.get('/getloggedinusers', getLoggedInUsers);

export default router;
