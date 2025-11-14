import Payment from "../models/Payment.js";
import Customer from "../models/Customer.js";

export const createPayment = async (req, res) => {
  try {
    const userId = req.user._id;         // from auth middleware
    const businessId = req.user.businessId;

    const newPayment = await Payment.create({
      ...req.body,
      userId,
      businessId,
    });

    return res.status(201).json({
      message: "Payment added successfully",
      data: newPayment,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to add payment",
      error: err.message,
    });
  }
};

export const getCustomerPayments = async (req, res) => {
  try {
    const { customerId } = req.params;

    const payments = await Payment.find({ customerId }).sort({ createdAt: -1 });

    return res.status(200).json(payments);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch customer payments",
      error: err.message,
    });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const businessId = req.user.businessId;

    const payments = await Payment.find({ businessId })
      .populate("customerId", "name phone_no")
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch all payments",
      error: err.message,
    });
  }
};

export const deletePayment = async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Payment deleted" });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete payment",
      error: err.message,
    });
  }
};
