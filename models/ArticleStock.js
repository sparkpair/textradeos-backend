import mongoose from "mongoose";

const articleStockSchema = new mongoose.Schema(
  {
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: "Article", required: true },
    quantity: { type: Number, required: true }, // +ve for addition, -ve for removal
    type: { type: String, enum: ["in", "out"], default: "in" }, // optional
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who added this stock entry
    note: { type: String }, // optional, e.g., "Received shipment" or "Sold"
  },
  { timestamps: true }
);

const ArticleStock = mongoose.model("ArticleStock", articleStockSchema);
export default ArticleStock;
