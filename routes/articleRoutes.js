import express from "express";
import {
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
} from "../controllers/articleController.js";

const router = express.Router();

router.route("/")
  .get(getArticles)
  .post(createArticle);

router.route("/:id")
  .get(getArticleById)
  .put(updateArticle);

export default router;
