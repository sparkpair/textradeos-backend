import Article from "../models/Article.js";
import ArticleStock from "../models/ArticleStock.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// 🔹 Helper: Get current stock of an article
const getCurrentStock = async (articleId) => {
  const result = await ArticleStock.aggregate([
    { $match: { articleId: new mongoose.Types.ObjectId(articleId) } },
    { $group: { _id: "$articleId", totalQuantity: { $sum: "$quantity" } } },
  ]);
  return result[0]?.totalQuantity || 0;
};

// 🔹 Create Article with optional initial stock
export const createArticle = async (req, res) => {
  try {
    const userId = req.user._id; // <- logged-in user's business ID
    const businessId = req.user.businessId; // <- logged-in user's business ID

    const {
      article_no,
      season,
      size,
      category,
      type,
      initial_stock,
      purchase_price,
      selling_price,
    } = req.body;

    // Check if article_no already exists for the same business
    const existingArticle = await Article.findOne({ article_no, businessId });
    if (existingArticle) {
      return res
        .status(400)
        .json({ message: "Article number already exists for this business" });
    }

    // Create Article
    const article = await Article.create({
      article_no,
      season,
      size,
      category,
      type,
      purchase_price,
      selling_price,
      businessId,
      userId,
    });

    // Add initial stock if provided
    if (initial_stock && initial_stock > 0) {
      await ArticleStock.create({
        articleId: article._id,
        quantity: initial_stock,
        type: "in",
        businessId,
        userId,
        note: "Initial stock",
      });
    }

    // Return article with current stock
    const stock = await getCurrentStock(article._id);
    res.status(201).json({ ...article.toObject(), stock });
  } catch (error) {
    console.error("Error creating article:", error);
    res.status(400).json({ message: error.message });
  }
};

// 🔹 Get All Articles with current stock
export const getArticles = async (req, res) => {
  try {
    const businessId = req.user.businessId; // <- logged-in user's business ID

    // Fetch articles belonging to this business
    const articles = await Article.find({ businessId });

    // Add current stock for each article
    const articlesWithStock = await Promise.all(
      articles.map(async (article) => {
        const stock = await getCurrentStock(article._id);
        return { ...article.toObject(), stock };
      })
    );

    res.status(200).json(articlesWithStock);
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Get Single Article by ID with stock
export const getArticleById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid article ID" });
    }

    const article = await Article.findById(req.params.id).populate(
      "userId",
      "username email"
    );
    if (!article) return res.status(404).json({ message: "Article not found" });

    const stock = await getCurrentStock(article._id);
    res.status(200).json({ ...article.toObject(), stock });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Update Article and optionally add stock
export const updateArticle = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid article ID" });
    }

    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });

    // Update linked user if userId provided
    if (req.body.userId) {
      const user = await User.findById(req.body.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      article.userId = req.body.userId;
    }

    // Update article fields
    const fieldsToUpdate = [
      "article_no",
      "season",
      "size",
      "category",
      "businessId",
    ];
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        article[field] = req.body[field];
      }
    });

    await article.save();

    // Add stock if provided
    if (req.body.stockChange && req.body.stockChange !== 0) {
      await ArticleStock.create({
        articleId: article._id,
        quantity: req.body.stockChange, // positive for addition, negative for removal
        type: req.body.stockChange > 0 ? "in" : "out",
        businessId: article.businessId,
        userId: req.body.userId || article.userId,
        note: req.body.stockNote || "Stock update",
      });
    }

    const stock = await getCurrentStock(article._id);
    res.status(200).json({ ...article.toObject(), stock });
  } catch (error) {
    console.error("Error updating article:", error);
    res.status(400).json({ message: error.message });
  }
};
