const { QueryTypes } = require("sequelize");
const db = require("../../config/dbConfig");

const getStudentFeesDetails = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { year } = req.query;

    console.log(year);
    // Define the SQL query with necessary joins and calculations
    const query = `
    SELECT 
    s.id AS student_id,
    CONCAT(s.firstName, ' ', IFNULL(s.middleName, ''), ' ', s.lastName) AS student_name,
    s.class_id AS student_class,
    s.carryForwardFee as carryForwardFee,
    s.carryForwardFee_id AS carryForwardFee_id,
    d.division_name AS student_division, -- Fetch division_name instead of division_id
    
    f.fee_id AS fee_id,
    f.fee_amount AS fee_amount,
    COALESCE(SUM(ph.payment_amount), 0) AS amount_paid,
    
    fc.category_name AS fee_category,
    fsc.subcategory_name AS fee_subcategory,
    fsc.subcategory_id AS fee_subcategory_id,
    
    f.pay AS amount_due_after_discount,
    dsc.discount_amount AS discount_amount,
    MAX(IFNULL(dsc.discount_reason, '')) AS discount_reason

FROM 
    students s
LEFT JOIN 
    Fees f ON s.id = f.student_id AND f.isActive=1
LEFT JOIN 
    FeeSubCategories fsc ON f.subcategory_id = fsc.subcategory_id 
LEFT JOIN 
    FeeCategories fc ON fsc.category_id = fc.category_id
LEFT JOIN 
    Discounts dsc ON f.fee_id = dsc.fee_id
LEFT JOIN 
    PaymentHistory ph ON f.fee_id = ph.fee_id
LEFT JOIN 
    divisions d ON s.division_id = d.id -- Join with divisions to get division_name
JOIN
    academic_year ay ON fsc.year_session= ay.id
WHERE 
    s.id = :studentId and 
    ay.year=:year

GROUP BY 
    s.id, s.firstName, s.middleName, s.lastName, s.class_id, d.division_name, -- Group by division_name
    f.fee_id, fc.category_name, fsc.subcategory_name, dsc.discount_amount;
`;

    // Execute the SQL query
    const studentFeesDetails = await db.seqeulize.query(query, {
      type: QueryTypes.SELECT,
      replacements: { studentId, year },
    });

    // Check if the student has fees details
    if (studentFeesDetails.length === 0) {
      return res
        .status(200)
        .json({ message: "No fee details found for the student.", data: [] });
    }

    // Respond with the fetched student fees details
    res.json({ message: "Success", data: studentFeesDetails });
  } catch (error) {
    console.error("Error fetching student fees details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT payment_id, fee_id, payment_amount, payment_date, payment_method, month
      FROM PaymentHistory
      WHERE fee_id = :id
    `;

    const paymentHistory = await db.seqeulize.query(query, {
      type: QueryTypes.SELECT,
      replacements: { id },
    });

    if (paymentHistory.length === 0) {
      return res
        .status(404)
        .json({ message: "No payment history found for the student." });
    }

    res.json(paymentHistory);
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getStudentFeesDetails,
  getPaymentHistory,
};
