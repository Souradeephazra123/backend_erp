// routes/feeCategoryRoutes.js

const express = require("express");
const {
  getBooks,
  addBook,
  editBook,
  deleteBook,
  getBook,
} = require("../../controller/private/bookController");

const router = express.Router();

router.get("/", getBooks);
router.get("/book", getBook);
router.post("/", addBook);
router.put("/:id", editBook);
router.delete("/:id", deleteBook);

module.exports = router;
