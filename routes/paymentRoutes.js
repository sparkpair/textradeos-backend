import express from "express";
import {
  createPayment,
  getCustomerPayments,
  getAllPayments,
  deletePayment,
} from "../controllers/paymentController.js";

const router = express.Router();

// Create payment
router.route("/")
    .post(createPayment)
    .get(getAllPayments);

// Get all payments of single customer
router.get("/customer/:customerId", getCustomerPayments);

// Delete a payment
router.delete("/:id", deletePayment);

export default router;
