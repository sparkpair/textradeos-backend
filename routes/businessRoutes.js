import express from "express";
import {
  createBusiness,
  getBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
  toggleBusinessStatus,
} from "../controllers/businessController.js";

const router = express.Router();

router.route("/")
  .get(getBusinesses)
  .post(createBusiness);

router.route("/:id")
  .get(getBusinessById)
  .put(updateBusiness)
  .delete(deleteBusiness);

router.patch("/:id/toggle", toggleBusinessStatus);

export default router;
