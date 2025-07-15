// routes/feeSubCategoryRoutes.js

const express = require("express");
const {
  getAllFeeSubCategories,
  getFeeSubCategoryById,
  createFeeSubCategory,
  updateFeeSubCategory,

  deleteFeeSubCategory,
} = require("../../controller/private/feeSubCategories");

const router = express.Router();

router.get("/school/:id", getAllFeeSubCategories);
router.get("/:id", getFeeSubCategoryById);
router.post("/", createFeeSubCategory);
router.put("/:id", updateFeeSubCategory);
router.delete("/:id", deleteFeeSubCategory);

module.exports = router;
