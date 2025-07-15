const db = require("../../config/dbConfig");
const { QueryTypes } = require("sequelize");
const PaymentApproval = db.PaymentApproval;

const add = async (req, res) => {
  const {
    student_id,
    fee_id,
    payment_amount,
    payment_method,
    month,
    status = "Pending",
  } = req.body;

  try {
    // Check if the payment is already approved
    const existingPayment = await PaymentApproval.findOne({
      where: { student_id, fee_id, payment_method, month, status },
    });

    if (existingPayment) {
      return res.status(400).json({
        message:
          "Payment for this student, fee, payment method, month, and status already exists",
      });
    }

    // Create a new payment with the current date and default status
    const newPayment = await PaymentApproval.create({
      student_id,
      fee_id,
      payment_amount,
      payment_method,
      month,
      status,
      payment_date: new Date(), // Set payment_date to today's date
    });

    res.status(201).json(newPayment);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while adding the payment" });
  }
};

const edit = async (
  fee_id,
  student_id,
  amount_paid,
  discount_amount,
  discount_reason,
  payment,
  month,
  subcategory_id
) => {
  console.log(
    fee_id,
    student_id,
    amount_paid,
    discount_amount,
    discount_reason,
    subcategory_id
  );
  const sqlInsertPaymentHistory = `
          INSERT INTO PaymentHistory (student_id, fee_id, payment_amount, payment_date, payment_method, month)
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
      return { status: 400, message: "Payment for this month already exists." };
    }

    const check = await db.seqeulize.query(
      "SELECT monthly_fee FROM FeeSubCategories WHERE subcategory_id = :subcategory_id",
      {
        replacements: { subcategory_id },
        type: QueryTypes.SELECT,
      }
    );
    const monthlyFee = check[0].monthly_fee;
    const totalAmount = parseFloat(amount_paid) + parseFloat(discount_amount);
    console.log(monthlyFee >= totalAmount.toFixed(2));
    if (monthlyFee < totalAmount.toFixed(2)) {
      return {
        status: 400,
        message: "Payment amount exceeds the monthly fee limit.",
      };
    }

    const studentId = parseInt(student_id);
    const feeId = parseInt(fee_id);

    const totalPaymentsResult = await db.seqeulize.query(
      `SELECT SUM(payment_amount) AS totalPaid FROM PaymentHistory WHERE fee_id = :feeId`,
      {
        replacements: { feeId },
        type: QueryTypes.SELECT,
      }
    );
    const totalPaid = totalPaymentsResult[0].totalPaid || 0;

    const discountResult = await db.seqeulize.query(
      "SELECT SUM(discount_amount) AS totalDiscount FROM Discounts WHERE fee_id = :feeId",
      {
        replacements: { feeId },
        type: QueryTypes.SELECT,
      }
    );
    const totalDiscount = discountResult[0].totalDiscount || 0;

    const feeResult = await db.seqeulize.query(
      "SELECT fee_amount FROM Fees WHERE fee_id = :feeId",
      {
        replacements: { feeId },
        type: QueryTypes.SELECT,
      }
    );
    const FeeAmount = parseFloat(feeResult[0].fee_amount);

    const remainingAmount = FeeAmount - totalPaid - totalDiscount;

    if (remainingAmount <= 0) {
      return { status: 400, message: "The fee has already been fully paid." };
    }

    if (!discount_amount && amount_paid) {
      const Pay = parseFloat(amount_paid);
      const paymentDate = new Date().toISOString().split("T")[0];

      if (Pay <= 0) {
        return {
          status: 400,
          message: "Payment amount must be greater than zero.",
        };
      }

      if (Pay > remainingAmount) {
        return {
          status: 400,
          message: "Payment amount exceeds the remaining fee amount.",
        };
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
      console.log("yash varshney");
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

      return { status: 200, message: "Fee updated successfully" };
    }

    if (discount_amount && !amount_paid) {
      const DiscountAmount = parseFloat(discount_amount);
      const discountReason = discount_reason || null;

      if (DiscountAmount <= 0) {
        return {
          status: 400,
          message: "Discount amount must be greater than zero.",
        };
      }

      if (DiscountAmount > remainingAmount) {
        return {
          status: 400,
          message: "Discount amount exceeds the remaining fee amount.",
        };
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

      return { status: 200, message: "Fee updated successfully" };
    }

    if (discount_amount && amount_paid) {
      const Pay = parseFloat(amount_paid);
      const DiscountAmount = parseFloat(discount_amount);
      const paymentDate = new Date().toISOString().split("T")[0];
      const discountReason = discount_reason || null;

      const totalCombined = Pay + DiscountAmount;
      if (totalCombined > remainingAmount) {
        return {
          status: 400,
          message:
            "Total payment and discount exceed the remaining fee amount.",
        };
      }

      if (Pay <= 0 || DiscountAmount <= 0) {
        return {
          status: 400,
          message:
            "Both payment and discount amounts must be greater than zero.",
        };
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
            feeAmount: remainingAmount - totalCombined,
            feeId,
          },
          type: QueryTypes.UPDATE,
        }
      );

      return { status: 200, message: "Fee updated successfully" };
    }

    return {
      status: 400,
      message: "Payment amount or discount amount must be provided.",
    };
  } catch (err) {
    console.error("Error:", err);
    return { status: 500, message: "Error updating fee", error: err.message };
  }
};

const editFee = async (req, res) => {
  const { id } = req.params;
  const { status, subcategory_id } = req.body;
  console.log(id, status);

  try {
    const payment = await PaymentApproval.findOne({
      where: { PaymentApproval_id: id },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    if (status === "Rejected") {
      await payment.destroy();
      return res.status(200).json({
        message: "Payment approval rejected and removed successfully",
      });
    }

    if (status === "Approved") {
      const { fee_id, student_id, payment_amount, payment_method, month } =
        payment;

      // Call the `edit` function and capture the response

      const editResponse = await edit(
        fee_id,
        student_id,
        payment_amount,
        0,
        null,
        payment_method,
        month,
        subcategory_id
      );
      await payment.destroy();
      return res
        .status(editResponse.status)
        .json({ message: editResponse.message });
    }
  } catch (error) {
    console.error("Error during fee editing:", error);
    return res.status(500).json({
      message: "An error occurred while editing the fee.",
      error: error.message,
    });
  }
};

const getPaymentApprovalsByStudent = async (req, res) => {
  try {
    // Define the SQL query with necessary joins
    const query = `
    SELECT 
      pa.PaymentApproval_id AS payment_approval_id,
      pa.payment_amount AS payment_amount,
      pa.payment_date AS payment_date,
      pa.payment_method AS payment_method,
      pa.month AS payment_month,
      pa.status AS payment_status,
      
      f.fee_id AS fee_id,
      f.fee_amount AS fee_amount,
      f.pay AS amount_due,
      f.modeOfPayment AS mode_of_payment,
      f.discount_id AS discount_id,
      f.carryForwardFee AS carry_forward_fee,
      f.subcategory_id AS sub_id,
      
      s.id AS student_id,
      CONCAT(s.firstName, ' ', IFNULL(s.middleName, ''), ' ', s.lastName) AS student_name
      
    FROM 
      PaymentApprovals pa
    LEFT JOIN 
      Fees f ON pa.fee_id = f.fee_id
    LEFT JOIN 
      students s ON f.student_id = s.id
  `;

    // Execute the SQL query
    const paymentApprovalDetails = await db.seqeulize.query(query, {
      type: QueryTypes.SELECT,
    });

    // Check if payment approval details exist
    if (paymentApprovalDetails.length === 0) {
      return res.status(200).json({
        message: "No payment approval details found for the student.",
      });
    }

    // Respond with the fetched payment approval details
    res.json(paymentApprovalDetails);
  } catch (error) {
    console.error("Error fetching payment approval details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getPaymentApprovalsByFeeId = async (req, res) => {
  try {
    const { fee_id } = req.params; // Get the fee_id from the request parameters

    // Define the SQL query to fetch payment approvals for the given fee_id
    const query = `
      SELECT 
        pa.PaymentApproval_id AS payment_approval_id,
        pa.payment_amount AS payment_amount,
        pa.payment_date AS payment_date,
        pa.payment_method AS payment_method,
        pa.month AS payment_month,
        pa.status AS payment_status,
        
        f.fee_id AS fee_id,
        f.fee_amount AS fee_amount,
        
        s.id AS student_id,
        CONCAT(s.firstName, ' ', IFNULL(s.middleName, ''), ' ', s.lastName) AS student_name
        
      FROM 
        PaymentApprovals pa
      LEFT JOIN 
        Fees f ON pa.fee_id = f.fee_id
      LEFT JOIN 
        students s ON f.student_id = s.id
      WHERE 
        f.fee_id = :feeId
    `;

    // Execute the SQL query
    const paymentApprovals = await db.seqeulize.query(query, {
      type: QueryTypes.SELECT,
      replacements: { feeId: fee_id }, // Replace the placeholder with actual fee_id
    });

    // Check if there are any payment approvals
    if (paymentApprovals.length === 0) {
      return res
        .status(404)
        .json({ message: "No payment approvals found for the given fee ID." });
    }

    // Respond with the fetched payment approvals
    res.json(paymentApprovals);
  } catch (error) {
    console.error("Error fetching payment approvals:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
module.exports = {
  add,
  editFee,
  getPaymentApprovalsByStudent,
  getPaymentApprovalsByFeeId,
};
