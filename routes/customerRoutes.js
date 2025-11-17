import express from "express";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  toggleCustomerStatus,
  generateStatement,
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

router.patch("/:id/statement", generateStatement);

export default router;
