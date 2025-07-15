const express = require("express");
const router = express.Router();
const {
  getExpenditures,
  addExpenditure,
  editExpenditure,
  deleteExpenditure,
} = require("../../controller/private/expenditureController"); // Assuming this file is in controllers folder

// Routes
router.get("/", getExpenditures);
router.post("/", addExpenditure);
router.put("/:id", editExpenditure);
router.delete("/:id", deleteExpenditure);

module.exports = router;
