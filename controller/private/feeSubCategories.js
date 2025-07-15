// controllers/feeSubCategoryController.js

const db = require("../../config/dbConfig");
const { QueryTypes } = require("sequelize");
const FeeCategory = db.FeeCategory;

const FeeSubCategory = db.FeeSubCategory;
const Student = db.Student;
const Fee = db.Fee;
// Get all Fee Subcategories
const getAllFeeSubCategories = async (req, res) => {
  try {
    const { categoryId } = req.query; // Get the categoryId from query params
    const { id } = req.params;
    // Define the query
    const query = `
      SELECT 
        fsc.subcategory_id,
        fsc.subcategory_name,
        fsc.category_id,
        fsc.fee_amount,
        fsc.monthly_fee,
        ay.year,
        fc.category_name,
        c.class_name
      FROM 
        FeeSubCategories fsc
      LEFT JOIN 
        FeeCategories fc ON fsc.category_id = fc.category_id
      LEFT JOIN 
        classes c ON fsc.class_id = c.id
      LEFT JOIN  academic_year ay ON fsc.year_session = ay.id
     
      WHERE 
        (:categoryId IS NULL OR fsc.category_id = :categoryId)   AND (c.school_id = :id);
    `;

    // Execute the query
    const subcategories = await db.seqeulize.query(query, {
      replacements: { categoryId: categoryId || null, id: id }, // Provide categoryId or null if undefined
      type: db.seqeulize.QueryTypes.SELECT, // Ensures the query returns raw data
    });

    res.status(200).json(subcategories); // Send the data as JSON response
  } catch (error) {
    console.error("Error fetching fee subcategories:", error);
    res.status(500).json({
      message: "Error fetching fee subcategories",
      error: error.message,
    });
  }
};

// Get Fee Subcategory by ID
const getFeeSubCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const subcategory = await FeeSubCategory.findByPk(id, {
      include: [
        {
          model: FeeCategory,
          attributes: ["category_name"],
        },
      ],
    });

    if (!subcategory) {
      return res.status(404).json({ message: "Fee Subcategory not found" });
    }

    res.status(200).json(subcategory);
  } catch (error) {
    res.status(500).json({ message: "Error fetching fee subcategory", error });
  }
};

// Create a new Fee Subcategory
const createFeeSubCategory = async (req, res) => {
  try {
    const {
      subcategory_name,
      category_id,
      class_id,
      fee_amount,
      year_session,
    } = req.body;
    const monthly_fee = fee_amount / 12;
    console.log(req.body);

    // Check for required fields
    if (
      !subcategory_name ||
      !category_id ||
      !class_id ||
      !fee_amount ||
      !year_session
    ) {
      return res.status(400).json({
        message:
          "Subcategory name, category_id, class_id, and fee_amount are required",
      });
    }

    // Check if the subcategory already exists
    const existingSubcategory = await FeeSubCategory.findOne({
      where: { subcategory_name, category_id, class_id, year_session },
    });

    if (existingSubcategory) {
      return res.status(400).json({
        message:
          "Fee Subcategory with the same name, category_id, and class_id already exists",
      });
    }

    // Create the new subcategory
    const newSubCategory = await FeeSubCategory.create({
      subcategory_name,
      category_id,
      class_id,
      fee_amount,
      monthly_fee,
      year_session,
    });

    // Fetch all students in the specified class using a raw SQL query
    const students = await db.seqeulize.query(
      `SELECT * FROM students WHERE class_id = :class_id`,
      {
        replacements: { class_id },
        type: QueryTypes.SELECT,
      }
    );

    if (!students || students.length === 0) {
      return res.status(200).json({
        message: "Fee subcategory created and fees assigned to students",
        subcategory: newSubCategory,
      });
    }

    // Create a fee record for each student
    const feePromises = students.map((student) => {
      const query = `
        INSERT INTO Fees (student_id, subcategory_id, fee_amount,pay,isActive)
        VALUES (:student_id, :subcategory_id, :fee_amount, :pay,1)
      `;

      return db.seqeulize.query(query, {
        replacements: {
          student_id: student.id,
          subcategory_id: newSubCategory.subcategory_id,
          fee_amount: fee_amount,
          payment_date: new Date(),
          carryForwardFee: 0,
          pay: fee_amount,
        },
      });
    });

    await Promise.all(feePromises);

    res.status(201).json({
      message: "Fee subcategory created and fees assigned to students",
      subcategory: newSubCategory,
    });
  } catch (error) {
    console.error("Error creating fee subcategory:", error);
    res.status(500).json({ message: "Error creating fee subcategory", error });
  }
};

// Update Fee Subcategory
const updateFeeSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { subcategory_name, category_id } = req.body;

    const subcategory = await FeeSubCategory.findByPk(id);
    if (!subcategory) {
      return res.status(404).json({ message: "Fee Subcategory not found" });
    }

    subcategory.subcategory_name = subcategory_name;
    subcategory.category_id = category_id;
    await subcategory.save();

    res.status(200).json(subcategory);
  } catch (error) {
    res.status(500).json({ message: "Error updating fee subcategory", error });
  }
};

// Delete Fee Subcategory
const deleteFeeSubCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const subcategory = await FeeSubCategory.findByPk(id);
    if (!subcategory) {
      return res.status(404).json({ message: "Fee Subcategory not found" });
    }

    await subcategory.destroy();
    res.status(200).json({ message: "Fee Subcategory deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting fee subcategory", error });
  }
};

module.exports = {
  getAllFeeSubCategories,
  getFeeSubCategoryById,
  createFeeSubCategory,
  updateFeeSubCategory,
  deleteFeeSubCategory,
};
