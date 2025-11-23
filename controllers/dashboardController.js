import Invoice from "../models/Invoice.js";
import Customer from "../models/Customer.js";
import Payment from "../models/Payment.js";

// 1️⃣ Stats
export const stats = async (req, res) => {
  try {
    const businessId = req.user.businessId; // Logged-in user's business
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of next day
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today sales for this business
    const todaySales = await Invoice.aggregate([
      { $match: { createdAt: { $gte: today }, businessId } },
      { $group: { _id: null, total: { $sum: "$netAmount" } } }
    ]);

    // Monthly sales for this business
    const monthlySales = await Invoice.aggregate([
      { $match: { createdAt: { $gte: monthStart }, businessId } },
      { $group: { _id: null, total: { $sum: "$netAmount" } } }
    ]);

    // **Today’s payments for this business**
    const todayPayments = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
          businessId
        }
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Total customers for this business
    const customers = await Customer.countDocuments({ businessId });

    res.json({
      todaySales: todaySales[0]?.total || 0,
      monthlySales: monthlySales[0]?.total || 0,
      todayPayments: todayPayments[0]?.total || 0,
      customers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 2️⃣ Sales Chart Data
export const sales = async (req, res) => {
  try {
    const businessId = req.user.businessId; // Filter by business
    const { start, end } = req.query;

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    // Use MongoDB aggregation to sum netAmount per day
    const sales = await Invoice.aggregate([
      { 
        $match: { 
          businessId,
          createdAt: { $gte: startDate, $lte: endDate }
        } 
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } // group by day
          },
          totalAmount: { $sum: "$netAmount" }
        }
      },
      { $sort: { "_id": 1 } } // sort by date ascending
    ]);

    // Map to frontend format
    const data = sales.map(s => ({
      date: s._id,
      amount: s.totalAmount
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
