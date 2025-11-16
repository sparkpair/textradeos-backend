import express from "express";
import {
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  addStock,
} from "../controllers/articleController.js";

const router = express.Router();

router.route("/")
  .get(getArticles)
  .post(createArticle);

router.route("/:id")
  .get(getArticleById)
  .put(updateArticle);

router.route("/add-stock")
  .post(addStock);

export default router;
