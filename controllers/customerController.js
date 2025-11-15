import Customer from "../models/Customer.js";
import User from "../models/User.js";

// 🔹 Create Customer
export const createCustomer = async (req, res) => {
  try {
    const userId = req.user._id; // <- logged-in user's business ID
    const businessId = req.user.businessId; // <- logged-in user's business ID

    const { name, person_name, phone_no, address } = req.body;

    // Create Customer
    const customer = await Customer.create({
      name,
      person_name,
      phone_no,
      address,
      userId,
      businessId,
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(400).json({ message: error.message });
  }
};


// 🔹 Get All Customers with Balance
export const getCustomers = async (req, res) => {
  try {
    const businessId = req.user.businessId;

    const customers = await Customer.aggregate([
      { $match: { businessId } },

      // ---- Invoices Total ----
      {
        $lookup: {
          from: "invoices",
          localField: "_id",
          foreignField: "customerId",
          as: "invoices",
        },
      },
      {
        $addFields: {
          totalInvoices: { $sum: "$invoices.netAmount" }
        }
      },

      // ---- Payments Total ----
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "customerId",
          as: "payments",
        },
      },
      {
        $addFields: {
          totalPayments: { $sum: "$payments.amount" }
        }
      },

      // ---- Final Balance ----
      {
        $addFields: {
          balance: {
            $subtract: ["$totalInvoices", "$totalPayments"]
          }
        }
      },

      // ---- Clean extra arrays ----
      {
        $project: {
          invoices: 0,
          payments: 0
        }
      }
    ]);

    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Get Single Customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Update Customer (optionally update linked user)
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    // Update linked user if username or password provided
    if (req.body.username || req.body.password) {
      const user = await User.findById(customer.userId);
      if (req.body.username) user.username = req.body.username;
      if (req.body.password) user.password = req.body.password;
      await user.save();
    }

    Object.assign(customer, req.body);
    await customer.save();

    res.status(200).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 🔹 Delete Customer + linked user
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    await User.findByIdAndDelete(customer.userId); // remove linked user
    await customer.remove();

    res.status(200).json({ message: "Customer and linked user deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Toggle Active Status
export const toggleCustomerStatus = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    customer.isActive = !customer.isActive;
    await customer.save();

    res.status(200).json({
      message: `Customer is now ${customer.isActive ? "Active" : "Inactive"}`,
      customer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
