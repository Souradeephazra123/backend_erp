const { QueryTypes } = require("sequelize");
const db = require("../../config/dbConfig");

// Create Fee
const createFee = async (req, res) => {
  console.log("Request body:", req.body);

  const {
    student_id,
    amount_paid,
    discount_amount,
    discount_reason,
    fee_amount,
    fee_subcategory,
    payment,
  } = req.body;

  const sqlInsertFee = `
    INSERT INTO Fees (fee_amount, subcategory_id, student_id, payment_date,pay)
    VALUES (:FeeAmount, :subcategory_id, :studentId, :paymentDate,:remainingFee);
  `;

  const sqlInsertDiscount = `
    INSERT INTO Discounts (discount_amount, discount_reason, fee_id)
    VALUES (:discountAmount, :discountReason, :feeId);
  `;

  const sqlInsertPaymentHistory = `
    INSERT INTO PaymentHistory (student_id, fee_id, payment_amount, payment_date, payment_method)
    VALUES (:studentId, :feeId, :amountPaid, :paymentDate, :payment);
  `;

  try {
    // Validate input
    const FeeAmount = parseFloat(fee_amount);
    const Pay = parseFloat(amount_paid) || 0;
    const discountAmount = parseFloat(discount_amount) || 0;
    const studentId = parseInt(student_id);
    const subcategoryId = parseInt(fee_subcategory);
    const paymentDate = new Date().toISOString().split("T")[0]; // Current date in YYYY-MM-DD format

    // Basic validation
    if (isNaN(FeeAmount) || FeeAmount <= 0) {
      return res.status(400).json({
        message: "Invalid fee amount",
      });
    }

    if (Pay > FeeAmount) {
      return res.status(400).json({
        message: "Payment amount cannot exceed the total fee amount",
      });
    }
    const remainingFee = FeeAmount - Pay - discountAmount;

    // Begin transaction
    const transaction = await db.seqeulize.transaction();

    try {
      // Insert fee record
      const [feeResult] = await db.seqeulize.query(sqlInsertFee, {
        replacements: {
          FeeAmount,
          subcategory_id: subcategoryId,
          studentId,
          paymentDate,
          remainingFee,
        },
        type: QueryTypes.INSERT,
        transaction,
      });

      // Get the ID of the newly created fee record
      const feeId = feeResult; // Assuming the ID is returned as the first element

      // Insert payment history record if any payment is made
      if (Pay > 0) {
        await db.seqeulize.query(sqlInsertPaymentHistory, {
          replacements: {
            studentId,
            feeId,
            amountPaid: Pay,
            paymentDate,
            payment,
            month,
          },
          type: QueryTypes.INSERT,
          transaction,
        });
      }

      // Handle discount if provided
      if (discountAmount > 0) {
        const discountReason = discount_reason || null;
        await db.seqeulize.query(sqlInsertDiscount, {
          replacements: {
            discountAmount,
            discountReason,
            feeId,
          },
          type: QueryTypes.INSERT,
          transaction,
        });
      }

      // Commit transaction
      await transaction.commit();

      // Log the newly created fee entry
      console.log("Created fee:", feeId);
      res.status(201).json({ message: "Fee created successfully" });
    } catch (err) {
      // Rollback transaction if any query fails
      await transaction.rollback();
      console.error("Transaction failed:", err);
      res
        .status(500)
        .json({ message: "Error creating fee", error: err.message });
    }
  } catch (error) {
    console.error("Error creating fee:", error);
    res
      .status(500)
      .json({ message: "Error creating fee", error: error.message });
  }
};

// Update Fee
const editFee = async (req, res) => {
  console.log("Request body:", req.body);
  const { fee_id } = req.params;
  console.log(fee_id);
  const {
    student_id,
    amount_paid,
    discount_amount,
    discount_reason,
    payment,
    month,
    subcategory_id,
  } = req.body;

  const sqlInsertPaymentHistory = `
    INSERT INTO PaymentHistory (student_id, fee_id, payment_amount, payment_date, payment_method,month)
    VALUES (:studentId, :feeId, :amountPaid, :paymentDate, :payment, :month);
  `;

  const sqlInsertDiscount = `
    INSERT INTO Discounts (discount_amount, discount_reason, fee_id)
    VALUES (:discountAmount, :discountReason, :feeId);
  `;

  try {
    const existingPayment = await db.seqeulize.query(
      "SELECT * FROM PaymentHistory WHERE student_id = :student_id AND fee_id = :feeId AND month = :month",
      {
        replacements: { student_id, feeId: fee_id, month },
        type: QueryTypes.SELECT,
      }
    );

    if (existingPayment.length > 0) {
      return res.status(400).json({
        message: "Payment for this month already exists.",
      });
    }

    const check = await db.seqeulize.query(
      "SELECT monthly_fee FROM FeeSubCategories where subcategory_id=:subcategory_id",
      {
        replacements: { subcategory_id },
        type: QueryTypes.SELECT,
      }
    );
    const monthlyFee = check[0].monthly_fee;

    if (discount_amount != undefined) {
      console.log(
        amount_paid - discount_amount,
        monthlyFee,
        amount_paid + discount_amount
      );
      if (monthlyFee != amount_paid + discount_amount && amount_paid != 0) {
        return res.status(400).json({
          message: "Payment amount exceeds the monthly fee limit.",
        });
      }
    }
    const studentId = parseInt(student_id);
    const feeId = parseInt(fee_id);

    // Query the total amount paid for this fee
    const totalPaymentsResult = await db.seqeulize.query(
      `SELECT SUM(payment_amount) AS totalPaid FROM PaymentHistory WHERE fee_id = :feeId`,
      {
        replacements: { feeId },
        type: QueryTypes.SELECT,
      }
    );
    const totalPaid = totalPaymentsResult[0].totalPaid || 0;

    // Query the total discount applied for this fee
    const discountResult = await db.seqeulize.query(
      "SELECT SUM(discount_amount) AS totalDiscount FROM Discounts WHERE fee_id = :feeId",
      {
        replacements: { feeId },
        type: QueryTypes.SELECT,
      }
    );
    const totalDiscount = discountResult[0].totalDiscount || 0;

    // Get the fee amount
    const feeResult = await db.seqeulize.query(
      "SELECT fee_amount FROM Fees WHERE fee_id = :feeId",
      {
        replacements: { feeId },
        type: QueryTypes.SELECT,
      }
    );
    console.log(feeResult);
    const FeeAmount = parseFloat(feeResult[0].fee_amount);

    // Calculate remaining amount
    const remainingAmount = FeeAmount - totalPaid - totalDiscount;

    // Common validations
    if (remainingAmount <= 0) {
      return res.status(400).json({
        message: "The fee has already been fully paid.",
      });
    }

    // Handle payment only
    if (!discount_amount && amount_paid) {
      const Pay = parseFloat(amount_paid);
      const paymentDate = new Date().toISOString().split("T")[0];

      if (Pay <= 0) {
        return res.status(400).json({
          message: "Payment amount must be greater than zero.",
        });
      }

      if (Pay > remainingAmount) {
        return res.status(400).json({
          message: "Payment amount exceeds the remaining fee amount.",
        });
      }

      await db.seqeulize.query(sqlInsertPaymentHistory, {
        replacements: {
          studentId,
          feeId,
          amountPaid: Pay,
          paymentDate,
          payment,
          month,
        },
        type: QueryTypes.INSERT,
      });

      await db.seqeulize.query(
        `UPDATE Fees SET pay = :feeAmount WHERE fee_id = :feeId`,
        {
          replacements: {
            feeAmount: remainingAmount - Pay,
            feeId,
          },
          type: QueryTypes.UPDATE,
        }
      );

      return res.status(200).json({ message: "Fee updated successfully" });
    }

    // Handle discount only
    if (discount_amount && !amount_paid) {
      const DiscountAmount = parseFloat(discount_amount);
      const discountReason = discount_reason || null;

      if (DiscountAmount <= 0) {
        return res.status(400).json({
          message: "Discount amount must be greater than zero.",
        });
      }

      if (DiscountAmount > remainingAmount) {
        return res.status(400).json({
          message: "Discount amount exceeds the remaining fee amount.",
        });
      }

      const discountExists = await db.seqeulize.query(
        "SELECT * FROM Discounts WHERE fee_id = :feeId",
        {
          replacements: { feeId },
          type: QueryTypes.SELECT,
        }
      );

      if (discountExists.length > 0) {
        await db.seqeulize.query(
          "UPDATE Discounts SET discount_amount = :discountAmount, discount_reason = :discountReason WHERE fee_id = :feeId",
          {
            replacements: {
              discountAmount:
                parseFloat(DiscountAmount) + parseFloat(totalDiscount),
              discountReason,
              feeId,
            },
            type: QueryTypes.UPDATE,
          }
        );
      } else {
        await db.seqeulize.query(sqlInsertDiscount, {
          replacements: {
            discountAmount: DiscountAmount,
            discountReason,
            feeId,
          },
          type: QueryTypes.INSERT,
        });
      }

      await db.seqeulize.query(
        `UPDATE Fees SET pay = :feeAmount WHERE fee_id = :feeId`,
        {
          replacements: {
            feeAmount: remainingAmount - DiscountAmount,
            feeId,
          },
          type: QueryTypes.UPDATE,
        }
      );

      return res.status(200).json({ message: "Fee updated successfully" });
    }

    // Handle both discount and payment
    if (discount_amount && amount_paid) {
      const Pay = parseFloat(amount_paid);
      const DiscountAmount = parseFloat(discount_amount);
      const paymentDate = new Date().toISOString().split("T")[0];
      const discountReason = discount_reason || null;

      const totalCombined = Pay + DiscountAmount;
      if (totalCombined > remainingAmount) {
        return res.status(400).json({
          message:
            "Total payment and discount exceed the remaining fee amount.",
        });
      }

      if (Pay <= 0 || DiscountAmount <= 0) {
        return res.status(400).json({
          message:
            "Both payment and discount amounts must be greater than zero.",
        });
      }

      // Insert payment history
      await db.seqeulize.query(sqlInsertPaymentHistory, {
        replacements: {
          studentId,
          feeId,
          amountPaid: Pay,
          paymentDate,
          payment,
          month,
        },
        type: QueryTypes.INSERT,
      });

      // Insert or update discount
      const discountExists = await db.seqeulize.query(
        "SELECT * FROM Discounts WHERE fee_id = :feeId",
        {
          replacements: { feeId },
          type: QueryTypes.SELECT,
        }
      );

      if (discountExists.length > 0) {
        await db.seqeulize.query(
          "UPDATE Discounts SET discount_amount = :discountAmount, discount_reason = :discountReason WHERE fee_id = :feeId",
          {
            replacements: {
              discountAmount:
                parseFloat(DiscountAmount) + parseFloat(totalDiscount),
              discountReason,
              feeId,
            },
            type: QueryTypes.UPDATE,
          }
        );
      } else {
        await db.seqeulize.query(sqlInsertDiscount, {
          replacements: {
            discountAmount: DiscountAmount,
            discountReason,
            feeId,
          },
          type: QueryTypes.INSERT,
        });
      }

      // Update remaining fee amount
      await db.seqeulize.query(
        `UPDATE Fees SET pay = :feeAmount WHERE fee_id = :feeId`,
        {
          replacements: {
            feeAmount: remainingAmount - totalCombined,
            feeId,
          },
          type: QueryTypes.UPDATE,
        }
      );

      return res.status(200).json({ message: "Fee updated successfully" });
    }

    if (!discount_amount && !amount_paid) {
      return res.status(400).json({
        message: "Payment amount or discount amount must be provided.",
      });
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Error updating fee", error: err.message });
  }
};

// Get Payment History

const fullpayment = async (req, res) => {
  console.log("Request body:", req.body);

  // Destructuring `fee_id` from route parameters and request body data
  const { fee_id } = req.params;
  const { student_id, amount_paid, payment, month } = req.body;

  // Query to insert into PaymentHistory table
  const sqlInsertPaymentHistory = `
    INSERT INTO PaymentHistory (student_id, fee_id, payment_amount, payment_date, payment_method, month)
    VALUES (:student_id, :fee_id, :amount_paid, NOW(), :payment, :month);
  `;

  const sqlUpdatePay = `
    UPDATE Fees
    SET pay = 0
    WHERE fee_id=:fee_id;
  `;

  try {
    // Query to check for existing payment in the same month for the same student and fee
    const existingPayment = await db.seqeulize.query(
      `
      SELECT * 
      FROM PaymentHistory 
      WHERE student_id = :student_id 
        AND fee_id = :fee_id 
        AND month = :month
      `,
      {
        replacements: { student_id, fee_id, month },
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );

    // If a payment record exists, return an error response
    if (existingPayment.length > 0) {
      return res.status(400).json({
        message: "Payment for this month already exists.",
      });
    }

    // Insert new payment record
    await db.seqeulize.query(sqlInsertPaymentHistory, {
      replacements: {
        student_id,
        fee_id,
        amount_paid,
        payment,
        month,
      },
      type: db.Sequelize.QueryTypes.INSERT,
    });

    const result = await db.seqeulize.query(sqlUpdatePay, {
      replacements: {
        fee_id,
        amount_paid,
      },
      type: db.Sequelize.QueryTypes.UPDATE,
    });
    console.log(result);

    // Return a success response
    return res.status(200).json({ message: "Payment recorded successfully." });
  } catch (error) {
    console.error("Error processing payment:", error);

    // Return an error response
    return res.status(500).json({
      message: "An error occurred while processing payment.",
      error: error.message,
    });
  }
};

module.exports = {
  createFee,
  editFee,
  fullpayment,
};
