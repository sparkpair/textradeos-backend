import express from "express";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  toggleCustomerStatus,
} from "../controllers/customerController.js";

const router = express.Router();

router.route("/")
  .get(getCustomers)
  .post(createCustomer);

router.route("/:id")
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

router.patch("/:id/toggle", toggleCustomerStatus);

export default router;
