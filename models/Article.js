import mongoose from "mongoose";

const articleSchema = new mongoose.Schema(
  {
    article_no: { type: String, required: true, trim: true },
    season: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who added this article
  },
  { timestamps: true }
);

const Article = mongoose.model("Article", articleSchema);
export default Article;
