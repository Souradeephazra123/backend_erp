const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const db = require("../config/dbConfig");
const app = express();
const multer = require("multer");

// cors middleware
app.use(cors());
const authenticate = require("../middleware/authMiddleware");
const feeCategoryRoutes = require("./private/feeCategorieRoute");
const feeSubcategoryRoutes = require("./private/feeSubCategorieRoute");
const feeRoutes = require("./private/feeRoutes");
const lateFeeRoutes = require("./private/lateFeeRoutes");
const uploadsRoute = require("./private/upload");
app.use(express.json());
app.use(bodyParser.json());

app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads/images"))
);

// app.use(authenticate)

// auth routes
const authRoutes = require("./public/authRoute");
// student routes
const studentRoutes = require("./private/studentRoute");

// certificate routes
const certificateRoutes = require("./private/certificateRoute");
const book = require("./private/bookRoute");
const studentBook = require("./private/StudentBook");
const Expenditure = require("./private/expenditureRouter");
const classRoutes = require("./private/classRoutes");
const subjectRoutes = require("./private/subjectRoutes");
const periodRoutes = require("./private/periodRoutes");
const attendanceRoutes = require("./private/attendanceRoutes");
const busRoutes = require("./private/busRoutes");
const {
  add,
  editFee,
  getPaymentApprovalsByStudent,
  getPaymentApprovalsByFeeId,
} = require("../controller/private/paymentApproval");
const {
  addCertificateRequest,
  getCertificateRequests,
} = require("../controller/private/certiRequest");
const { promoteStudent } = require("../controller/private/promote");
const { massUploadStudents } = require("../controller/private/massUpload");

//auth middleware
app.use(authRoutes);
// private routes
app.use(studentRoutes);
app.use(certificateRoutes);
app.use("/api", busRoutes);
app.use("/api/fee-categories", feeCategoryRoutes);
app.use("/api/fee-subcategories", feeSubcategoryRoutes);
app.use("/api/payment", feeRoutes);
app.use("/api/late-fees", lateFeeRoutes);
app.use("/api/book", book);
app.use("/api/studentbook", studentBook);
app.use("/api/expenditure", Expenditure);
app.use("/api/class", classRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api", uploadsRoute);
app.post("/api/paymentapproval", add);
app.post("/api/paymentapproval/:id", editFee);
app.get("/api/paymentapproval", getPaymentApprovalsByStudent);
app.get("/api/paymentapproval/:fee_id", getPaymentApprovalsByFeeId);
app.post("/api/certificates", addCertificateRequest);

app.get("/api/certificates", getCertificateRequests);

app.post("/api/promote", promoteStudent);
const upload = multer({
  dest: "uploads/", // Temporary directory for storing uploaded files
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB file size limit
});

const FeeSubCategory = db.FeeSubCategory;
const getFeeSubCategoriesByClass = async (req, res) => {
  const { classId } = req.params;

  if (!classId) {
    return res.status(400).json({ error: "Class ID is required" });
  }

  try {
    // Fetch subcategories with a Sequelize query
    const subcategories = await db.seqeulize.query(
      `SELECT 
          fsc.subcategory_id, 
          fsc.subcategory_name, 
          fsc.category_id, 
          fsc.fee_amount, 
          fsc.monthly_fee, 
          fsc.year_session, 
          ay.year 
       FROM FeeSubCategories fsc
       LEFT JOIN academic_year ay ON fsc.year_session = ay.id
       WHERE fsc.class_id = :classId
       ORDER BY fsc.subcategory_name ASC`,
      {
        replacements: { classId },
        type: db.seqeulize.QueryTypes.SELECT,
      }
    );

    res.json(subcategories);
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the data" });
  }
};

app.get("/feesubcategories/:classId", getFeeSubCategoriesByClass);

app.post("/api/payCarryForwardFee", async (req, res) => {
  const { studentId, paymentAmount } = req.body;

  if (!studentId || !paymentAmount) {
    return res
      .status(400)
      .json({ message: "Student ID and payment amount are required." });
  }

  try {
    // Start a transaction
    const transaction = await db.seqeulize.transaction();

    // Fetch current carryForwardFee
    const [student] = await db.seqeulize.query(
      "SELECT carryForwardFee FROM students WHERE id = :studentId",
      { replacements: { studentId }, type: db.seqeulize.QueryTypes.SELECT }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const currentFee = student.carryForwardFee;

    if (paymentAmount > currentFee) {
      return res
        .status(400)
        .json({ message: "Payment amount exceeds the carry forward fee." });
    }

    // Deduct fee from the student record
    await db.seqeulize.query(
      "UPDATE students SET carryForwardFee = carryForwardFee - :paymentAmount WHERE id = :studentId",
      { replacements: { paymentAmount, studentId }, transaction }
    );

    // Insert into the payments table
    const [payment] = await db.seqeulize.query(
      "INSERT INTO payments (student_id, paymentAmount) VALUES (:studentId, :paymentAmount)",
      { replacements: { studentId, paymentAmount }, transaction }
    );

    const paymentId = payment;

    // Update the student's carryForwardFee_id
    await db.seqeulize.query(
      "UPDATE students SET carryForwardFee_id = :paymentId WHERE id = :studentId",
      { replacements: { paymentId, studentId }, transaction }
    );

    // Commit the transaction
    await transaction.commit();

    return res.status(200).json({
      message: "Payment successful.",
      paymentId,
      remainingFee: currentFee - paymentAmount,
    });
  } catch (err) {
    console.error("Transaction error:", err);
    return res
      .status(500)
      .json({ message: "An error occurred during payment.", error: err });
  }
});

app.get("/api/payment/carry/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
    SELECT 
    *
    FROM payments
    WHERE id =:id
`;

    // Execute the SQL query
    const studentFeesDetails = await db.seqeulize.query(query, {
      type: db.seqeulize.QueryTypes.SELECT,
      replacements: { id },
    });

    // Check if the student has fees details
    if (studentFeesDetails.length === 0) {
      return res
        .status(404)
        .json({ message: "No fee details found for the student." });
    }

    // Respond with the fetched student fees details
    res.json(studentFeesDetails[0]);
  } catch (error) {
    console.error("Error fetching student fees details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/students/mass-upload", upload.single("file"), massUploadStudents);

const getAllSchool = async (req, res) => {
  try {
    const sql = "SELECT * FROM Schools";
    const data = await db.seqeulize.query(sql, {
      type: db.Sequelize.QueryTypes.SELECT,
    });
    console.log(data);
    res.status(200).json(data);
  } catch (err) {
    console.error("Failed to retrieve School:", err);
    res.status(500).json({ message: "Failed to retrieve school" });
  }
};
app.get("/api/school", getAllSchool);
module.exports = app;
