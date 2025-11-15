import Invoice from "../models/Invoice.js";
import Article from "../models/Article.js";

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

    const {
      customerId,
      items,
      discount = 0,
      grossAmount,
      netAmount,
    } = req.body;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invoice must contain items" });
    }

    // Validate item structure
    for (const item of items) {
      if (!item.articleId || !item.quantity) {
        return res
          .status(400)
          .json({ message: "Each item must include articleId and quantity" });
      }
    }

    // Fetch price snapshots
    const articlePrices = {};
    for (const item of items) {
      const article = await Article.findById(item.articleId);
      if (!article)
        return res.status(400).json({ message: "Invalid article ID provided" });
      articlePrices[item.articleId] = article.selling_price;
    }

    const itemsWithSnapshot = items.map((item) => ({
      ...item,
      selling_price_snapshot: articlePrices[item.articleId],
    }));

    // 🔥 Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(businessId);

    // Create Invoice
    const invoice = await Invoice.create({
      invoiceNumber,
      customerId,
      items: itemsWithSnapshot,
      discount,
      grossAmount,
      netAmount,
      userId,
      businessId,
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error("Error creating invoice:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate invoice number. Please try again.",
      });
    }

    res.status(500).json({ message: error.message });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const businessId = req.user.businessId;

    const invoices = await Invoice.find({ businessId })
      .populate("customerId", "name")
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
