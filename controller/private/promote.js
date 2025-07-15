const { Sequelize } = require("sequelize");
// const dbName = "bikashvi_apierp";
// const dbUser = "bikashvi_usererp";
// const dbPassword = "yashvarshney";
const dbName = "bikashvi_mcs_erp";
// const dbUser = "bikashvi_mcs_user";
const dbUser = "root";
const dbPassword = "Souradeep@599";
// const dbPassword = "yashvarshney";
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: "localhost",
  port: "3306",
  dialect: "mysql", // or "postgres", "sqlite", etc.
  dialectOptions: {
    connectTimeout: 600000, // 60 seconds
  },
  pool: {
    max: 5, // Maximum number of connections in the pool
    min: 0, // Minimum number of connections in the pool
    acquire: 600000, // Maximum time (in ms) to acquire a connection before throwing an error
    idle: 100000, // Maximum time (in ms) that a connection can be idle before being released
  },
  query: {
    timeout: 600000, // 60 seconds
  },
});

// Test connection
sequelize
  .authenticate()
  .then(() => console.log("Database connected."))
  .catch((err) => console.error("Unable to connect to the database:", err));

const promoteStudent = async (req, res) => {
  const { newClassId, studentIds, fees, newDivisionId } = req.body;

  if (
    !newClassId ||
    !Array.isArray(studentIds) ||
    studentIds.length === 0 ||
    !Array.isArray(fees) ||
    fees.length === 0
  ) {
    return res.status(400).json({
      message:
        "Invalid input: Provide newClassId, an array of studentIds, and fee details.",
    });
  }

  const transaction = await sequelize.transaction();
  try {
    const placeholders = studentIds.map(() => "?").join(", ");

    // Step 1: Fetch carryForwardFee for each student
    const fetchCarryForwardFeeQuery = `
        SELECT student_id, SUM(pay) AS carryForwardFee
        FROM Fees
        WHERE isActive = 1 AND student_id IN (${placeholders})
        GROUP BY student_id;
      `;
    const [carryForwardFees] = await sequelize.query(
      fetchCarryForwardFeeQuery,
      {
        replacements: [...studentIds],
        transaction,
      }
    );

    // Step 2: Update `students` table with new class_id and carryForwardFee
    for (const { student_id, carryForwardFee } of carryForwardFees) {
      const updateStudentQuery = `
          UPDATE students
          SET class_id = ?, carryForwardFee = ?, division_id = ?,studentType=?
          WHERE id = ?;
        `;
      await sequelize.query(updateStudentQuery, {
        replacements: [
          newClassId,
          carryForwardFee,
          newDivisionId,
          "old",
          student_id,
        ],
        transaction,
      });
    }

    // Step 3: Deactivate previous `Fees` and `PaymentHistory`
    const deactivateFeesQuery = `
        UPDATE Fees
        SET isActive = 0
        WHERE student_id IN (${placeholders});
      `;
    await sequelize.query(deactivateFeesQuery, {
      replacements: [...studentIds],
      transaction,
    });

    const deactivatePaymentHistoryQuery = `
        UPDATE PaymentHistory
        SET isActive = 0
        WHERE student_id IN (${placeholders});
      `;
    await sequelize.query(deactivatePaymentHistoryQuery, {
      replacements: [...studentIds],
      transaction,
    });

    // Step 4: Insert new fee entries into `Fees` table with `pay` equal to `fee_amount`
    const insertFeesQuery = `
        INSERT INTO Fees (student_id, subcategory_id, fee_amount, pay, isActive)
        VALUES ${studentIds
          .map(() => fees.map(() => "(?, ?, ?, ?, 1)").join(", "))
          .join(", ")};
      `;
    const insertFeesReplacements = [];
    studentIds.forEach((id) => {
      fees.forEach(({ subcategory_id, fee_amount }) => {
        insertFeesReplacements.push(id, subcategory_id, fee_amount, fee_amount);
      });
    });
    await sequelize.query(insertFeesQuery, {
      replacements: insertFeesReplacements,
      transaction,
    });

    await transaction.commit();
    return res.status(200).json({
      message: `Successfully promoted students to class ID ${newClassId}, updated fees, and deactivated related records.`,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("Error promoting students:", err.message);
    return res.status(500).json({
      message:
        "Failed to promote students, update fees, and deactivate records.",
      error: err.message,
    });
  }
};

module.exports = {
  promoteStudent,
};
