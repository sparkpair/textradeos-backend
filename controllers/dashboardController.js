import Invoice from "../models/Invoice.js";
import Customer from "../models/Customer.js";
import Payment from "../models/Payment.js";
import Business from "../models/Business.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import Session from "../models/Session.js";

// 1️⃣ Stats
export const stats = async (req, res) => {
  try {
    const role = req.user.role;
    const businessId = req.user.businessId || null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // =====================================================
    //                🟢  DEVELOPER DASHBOARD
    // =====================================================
    if (role === "developer") {
      const totalBusinesses = await Business.countDocuments();
      const activeBusinesses = await Business.countDocuments({ isActive: true });

      const expiredSubscriptions = await Subscription.countDocuments({
        endDate: { $lt: new Date() }
      });

      const totalUsers = await User.countDocuments({ role: { $ne: "developer" } });

      const totalRevenueAgg = await Subscription.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$price" } } }
      ]);

      return res.json({
        role: "developer",
        totalBusinesses,
        activeBusinesses,
        expiredSubscriptions,
        totalUsers,
        totalRevenue: totalRevenueAgg[0]?.total || 0,
      });
    }

    // =====================================================
    //                🔵  ADMIN DASHBOARD
    // =====================================================
    if (role === "admin") {
      const totalSalesAgg = await Invoice.aggregate([
        { $match: { businessId } },
        { $group: { _id: null, total: { $sum: "$netAmount" } } }
      ]);

      const totalPaymentsAgg = await Payment.aggregate([
        { $match: { businessId } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);

      const todayTransactions = await Invoice.countDocuments({
        businessId,
        createdAt: { $gte: today, $lt: tomorrow },
      });

      const totalUsers = await User.countDocuments({ businessId });

      return res.json({
        role: "admin",
        totalSales: totalSalesAgg[0]?.total || 0,
        totalPayments: totalPaymentsAgg[0]?.total || 0,
        todayTransactions,
        totalUsers,
      });
    }

    // =====================================================
    //                 🟡  NORMAL USER DASHBOARD
    // =====================================================
    // Today sales
    const todaySales = await Invoice.aggregate([
      { $match: { businessId, createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: "$netAmount" } } }
    ]);

    // Monthly sales
    const monthlySales = await Invoice.aggregate([
      { $match: { businessId, createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$netAmount" } } }
    ]);

    // Today's payments
    const todayPayments = await Payment.aggregate([
      { 
        $match: { 
          businessId,
          createdAt: { $gte: today, $lt: tomorrow },
        } 
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Monthly payments
    const monthlyPayments = await Payment.aggregate([
      { $match: { businessId, createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Normal user response
    return res.json({
      role: "user",
      todaySales: todaySales[0]?.total || 0,
      monthlySales: monthlySales[0]?.total || 0,
      todayPayments: todayPayments[0]?.total || 0,
      monthlyPayments: monthlyPayments[0]?.total || 0,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 2️⃣ Sales Chart Data
export const sales = async (req, res) => {
  try {
    const role = req.user.role;
    const businessId = req.user.businessId || null;

    const { start, end } = req.query;
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    // Developer Chart = New Businesses Per Day
    if (role === "developer") {
      const result = await Business.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } }
      ]);

      return res.json(result.map(r => ({ date: r._id, amount: r.total })));
    }

    // Admin Chart = Daily Sales of Business
    if (role === "admin") {
      const result = await Invoice.aggregate([
        {
          $match: {
            businessId,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            totalAmount: { $sum: "$netAmount" }
          }
        },
        { $sort: { "_id": 1 } }
      ]);

      return res.json(result.map(r => ({
        date: r._id,
        amount: r.totalAmount
      })));
    }

    // Normal User Chart
    const result = await Invoice.aggregate([
      {
        $match: {
          businessId,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalAmount: { $sum: "$netAmount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    return res.json(result.map(r => ({
      date: r._id,
      amount: r.totalAmount
    })));

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getLogedInUsers = async (req, res) => {
  try {
    const sessions = await Session.find({ isActive: true }).populate({
      path: "userId",
      select: "name businessId role",
      populate: {
        path: "businessId",
        model: "Business",
        select: "name"
      }
    });

    const activeUsers = sessions
      .filter(s => s.userId && s.userId.role !== "developer")
      .map(s => ({
        userId: s.userId._id,
        name: s.userId.name,
        businessId: s.userId.businessId?._id || null,
        businessName: s.userId.businessId?.name || "N/A",
        loginTime: s.loginTime,
        lastActive: s.updatedAt,
        ipAddress: s.ipAddress || null,
        userAgent: s.userAgent || null
      }));

    res.json(activeUsers);

  } catch (err) {
    console.error("Error fetching active users:", err);
    res.status(500).json({ message: "Server error" });
  }
};