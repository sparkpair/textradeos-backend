import Invoice from "../models/Invoice.js";
import Article from "../models/Article.js";
import { getCurrentStock } from "./articleController.js";

const generateInvoiceNumber = async (businessId) => {
  const year = new Date().getFullYear().toString().slice(-2); // "25"

  // Find latest invoice for this business for this year
  const lastInvoice = await Invoice.findOne({
    businessId,
    invoiceNumber: { $regex: `^INV-${year}` },
  }).sort({ createdAt: -1 });

  let nextSerial = 1;

  if (lastInvoice) {
    const lastSerial = parseInt(lastInvoice.invoiceNumber.slice(6)); // "INV-25" => start at index 6
    nextSerial = lastSerial + 1;
  }

  const padded = String(nextSerial).padStart(3, "0");

  return `INV-${year}${padded}`;
};

export const createInvoice = async (req, res) => {
  try {
    const userId = req.user._id;
    const businessId = req.user.businessId;

    // 1. req.body se 'date' ko nikaalein (Jo humne frontend se payload mein bheji hai)
    const { customerId, items, discount = 0, grossAmount, netAmount, date } = req.body;

    const isWalkIn = !customerId;

    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "Invoice must contain items" });

    const itemsWithSnapshot = [];
    for (const item of items) {
      const article = await Article.findById(item.articleId);
      if (!article) return res.status(400).json({ message: "Invalid article ID" });

      if (item.quantity > article.stock) {
        return res.status(400).json({
          message: `Not enough stock for ${article.article_no}. Available: ${article.stock}`,
        });
      }

      itemsWithSnapshot.push({
        articleId: item.articleId,
        quantity: item.quantity,
        selling_price_snapshot: article.selling_price,
      });

      // 🔥 Zaroori: Article ka stock bhi update karein (minus quantity)
      article.stock -= item.quantity;
      await article.save();
    }

    const invoiceNumber = await generateInvoiceNumber(businessId);

    // 2. Invoice create karte waqt 'invoiceDate' field set karein
    const invoice = await Invoice.create({
      invoiceNumber,
      invoiceDate: date || new Date(), // User ki select ki hui date
      customerId: customerId || null,
      isWalkIn, 
      items: itemsWithSnapshot,
      discount,
      grossAmount,
      netAmount,
      userId,
      businessId,
    });

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate({ path: "customerId", select: "_id name phone_no" })
      .populate({ path: "items.articleId", select: "_id article_no" });

    res.status(201).json(populatedInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const businessId = req.user.businessId;

    const invoices = await Invoice.find({ businessId })
      .populate("customerId", "name phone_no")
      .populate("items.articleId", "article_no")
      .sort({ createdAt: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("customerId", "name person_name phone_no address")
      .populate("items.articleId", "article_no selling_price");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ message: error.message });
  }
};
