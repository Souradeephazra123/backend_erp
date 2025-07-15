// routes/feeCategoryRoutes.js

const express = require("express");
const {
  getAllFeeCategories,
  getFeeCategoryById,
  createFeeCategory,
  updateFeeCategory,
  deleteFeeCategory,
} = require("../../controller/private/feeCategories");

const router = express.Router();

router.get("/", getAllFeeCategories);
router.get("/:id", getFeeCategoryById);
router.post("/", createFeeCategory);
router.put("/:id", updateFeeCategory);
router.delete("/:id", deleteFeeCategory);

module.exports = router;
