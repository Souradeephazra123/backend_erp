// routes/feeCategoryRoutes.js

const express = require("express");
const {
  getStudentBooks,
  issueBook,
  returnBook,
} = require("../../controller/private/studentBookContoller");

const router = express.Router();

router.get("/", getStudentBooks);
router.post("/issue", issueBook);
router.post("/return", returnBook);

module.exports = router;
