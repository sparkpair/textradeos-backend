// routes/export.js
import express from "express";
import ExcelJS from "exceljs";
import dayjs from "dayjs";

import Article from "../models/Article.js";
import ArticleStock from "../models/ArticleStock.js";
import Customer from "../models/Customer.js";
import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";

const router = express.Router();

// Format: 19-Nov-2025, Wed
const formatDate = (d) => (d ? dayjs(d).format("DD-MMM-YYYY, ddd") : "-");
// Safe value
const safe = (v) => (v === null || v === undefined || v === "" ? "-" : v);

/** Apply Header Styling */
const styleHeader = (row) => {
  row.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "127475" }, // header bg
    };
    cell.font = { bold: true, color: { argb: "FFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
};

/** Add Light Border */
const addBorders = (row) => {
  row.eachCell((cell) => {
    cell.border = {
      top: { style: "thin", color: { argb: "CCCCCC" } },
      left: { style: "thin", color: { argb: "CCCCCC" } },
      bottom: { style: "thin", color: { argb: "CCCCCC" } },
      right: { style: "thin", color: { argb: "CCCCCC" } },
    };
  });
};

/** Create a styled sheet */
const addSheet = (wb, title, columns, rows) => {
  const ws = wb.addWorksheet(title);

  ws.columns = columns.map((c) => ({
    header: c,
    key: c,
    width: 22,
  }));

  // Add rows
  rows.forEach((r) => ws.addRow(r));

  // Freeze Header
  ws.views = [{ state: "frozen", ySplit: 1 }];

  // Header styling
  const header = ws.getRow(1);
  styleHeader(header);
  addBorders(header);

  // Row styling + Borders
  ws.eachRow((row, rowNum) => {
    if (rowNum !== 1) {
      row.alignment = { vertical: "middle", horizontal: "center" };
      addBorders(row);
    }
  });

  return ws;
};

router.get("/", async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const wb = new ExcelJS.Workbook();

    // ========================
    // 1️⃣ ARTICLES
    // ========================
    const articles = await Article.find({ businessId }).lean();
    addSheet(
      wb,
      "Articles",
      [
        "#",
        "Article No",
        "Season",
        "Size",
        "Category",
        "Type",
        "Purchase Price",
        "Selling Price",
        "Created At",
      ],
      articles.map((a, i) => [
        i + 1,
        safe(a.article_no),
        safe(a.season),
        safe(a.size),
        safe(a.category),
        safe(a.type),
        safe(a.purchase_price),
        safe(a.selling_price),
        formatDate(a.createdAt),
      ])
    );

    // ========================
    // 2️⃣ STOCK
    // ========================
    const stocks = await ArticleStock.find({ businessId })
      .populate("articleId", "article_no")
      .lean();

    addSheet(
      wb,
      "Stock",
      ["#", "Article", "Quantity", "Movement", "Note", "Created At"],
      stocks.map((s, i) => [
        i + 1,
        safe(s.articleId?.article_no),
        safe(s.quantity),
        safe(s.type),
        safe(s.note),
        formatDate(s.createdAt),
      ])
    );

    // ========================
    // 3️⃣ CUSTOMERS
    // ========================
    const customers = await Customer.find({ businessId }).lean();

    addSheet(
      wb,
      "Customers",
      [
        "#",
        "Customer Name",
        "Person Name",
        "Phone No",
        "Address",
        "Status",
        "Created At",
      ],
      customers.map((c, i) => [
        i + 1,
        safe(c.name),
        safe(c.person_name),
        safe(c.phone_no),
        safe(c.address),
        c.isActive ? "Active" : "Inactive",
        formatDate(c.createdAt),
      ])
    );

    // ========================
    // 4️⃣ INVOICES
    // ========================
    const invoices = await Invoice.find({ businessId })
      .populate("customerId", "name")
      .lean();

    addSheet(
      wb,
      "Invoices",
      [
        "#",
        "Invoice Number",
        "Customer",
        "Gross Amount",
        "Discount %",
        "Net Amount",
        "Created At",
      ],
      invoices.map((inv, i) => [
        i + 1,
        safe(inv.invoiceNumber),
        safe(inv.customerId?.name),
        safe(inv.grossAmount),
        safe(inv.discount),
        safe(inv.netAmount),
        formatDate(inv.createdAt),
      ])
    );

    // ========================
    // 5️⃣ PAYMENTS
    // ========================
    const payments = await Payment.find({ businessId })
      .populate("customerId", "name")
      .lean();

    addSheet(
      wb,
      "Payments",
      [
        "#",
        "Customer",
        "Method",
        "Amount",
        "Remarks",
        "Date",
        "Bank",
        "Transaction ID",
        "Slip No",
        "Cheque No",
        "Created At",
      ],
      payments.map((p, i) => [
        i + 1,
        safe(p.customerId?.name),
        safe(p.method),
        safe(p.amount),
        safe(p.remarks),
        formatDate(p.date),
        safe(p.bank),
        safe(p.transaction_id),
        safe(p.slip_no),
        safe(p.cheque_no),
        formatDate(p.createdAt),
      ])
    );

    // ========================
    // SEND FILE
    // ========================
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=data-export.xlsx"
    );

    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Export failed." });
  }
});

export default router;
