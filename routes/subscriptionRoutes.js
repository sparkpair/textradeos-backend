import express from "express";
import {
  createSubscription,
  getSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
  getMySubscriptionStatus,
} from "../controllers/subscriptionController.js";

const router = express.Router();

router.route('/my-status').get(getMySubscriptionStatus);

router.route("/")
  .get(getSubscriptions)
  .post(createSubscription);

router.route("/:id")
  .get(getSubscriptionById)
  .put(updateSubscription)
  .delete(deleteSubscription);

export default router;
