const db = require("../../config/dbConfig");

const FeeCategory = db.FeeCategory;

// Get all Fee Categories
const getAllFeeCategories = async (req, res) => {
  try {
    const categories = await FeeCategory.findAll();

    res.status(200).json(categories);
  } catch (error) {
    console.log("FeeCategory: " + error);
    res.status(500).json({ message: "Error fetching fee categories", error });
  }
};

// Get Fee Category by ID
const getFeeCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await FeeCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({ message: "Fee Category not found" });
    }

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: "Error fetching fee category", error });
  }
};

// Create a new Fee Category
const createFeeCategory = async (req, res) => {
  try {
    const { category_name } = req.body;
    const newCategory = await FeeCategory.create({ category_name });
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: "Error creating fee category", error });
  }
};

// Update Fee Category
const updateFeeCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name } = req.body;

    const category = await FeeCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: "Fee Category not found" });
    }

    category.category_name = category_name;
    await category.save();

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: "Error updating fee category", error });
  }
};

// Delete Fee Category
const deleteFeeCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await FeeCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: "Fee Category not found" });
    }

    await category.destroy();
    res.status(200).json({ message: "Fee Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting fee category", error });
  }
};

module.exports = {
  getAllFeeCategories,
  getFeeCategoryById,
  createFeeCategory,
  updateFeeCategory,
  deleteFeeCategory,
};
