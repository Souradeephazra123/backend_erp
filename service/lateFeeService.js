const { QueryTypes } = require("sequelize");
const db = require("../config/dbConfig");
const moment = require("moment");

// Late Fee Service for handling late fee additions after 15th of month
class LateFeeService {
  
  // Check if current date is after 15th of the month
  static isAfter15thOfMonth() {
    const currentDate = moment();
    return currentDate.date() > 15;
  }

  // Get late fee percentage/amount from configuration (you can store this in database)
  static getLateFeeConfig() {
    return {
      percentage: 5, // 5% late fee
      fixedAmount: 50, // or fixed amount of 50
      usePercentage: true, // set to false to use fixed amount
      graceThreshold: 100 // minimum fee amount to apply late fee
    };
  }

  // Calculate late fee based on outstanding amount
  static calculateLateFee(outstandingAmount) {
    const config = this.getLateFeeConfig();
    
    if (outstandingAmount < config.graceThreshold) {
      return 0; // No late fee for small amounts
    }

    if (config.usePercentage) {
      return Math.round((outstandingAmount * config.percentage) / 100);
    } else {
      return config.fixedAmount;
    }
  }

  // Get students with outstanding fees
  static async getStudentsWithOutstandingFees() {
    try {
      const query = `
        SELECT 
          f.student_id,
          f.fee_id,
          f.fee_amount,
          f.pay as amount_paid,
          (f.fee_amount - f.pay) as outstanding_amount,
          s.firstName,
          s.lastName,
          s.class_id,
          s.division_id,
          sc.subcategory_name,
          f.payment_date,
          f.isActive
        FROM Fees f
        JOIN students s ON f.student_id = s.id
        JOIN FeeSubCategories sc ON f.subcategory_id = sc.subcategory_id
        WHERE (f.fee_amount - f.pay) > 0 
        AND f.isActive = 1
        AND f.payment_date < CURDATE()
        ORDER BY f.student_id, f.payment_date
      `;

      const outstandingFees = await db.seqeulize.query(query, {
        type: QueryTypes.SELECT,
      });

      return outstandingFees;
    } catch (error) {
      console.error("Error fetching outstanding fees:", error);
      throw error;
    }
  }

  // Apply late fees to students with outstanding amounts
  static async applyLateFees() {
    try {
      if (!this.isAfter15thOfMonth()) {
        return {
          success: false,
          message: "Late fees can only be applied after 15th of the month",
          appliedCount: 0
        };
      }

      const outstandingFees = await this.getStudentsWithOutstandingFees();
      let appliedCount = 0;
      const results = [];

      for (const feeRecord of outstandingFees) {
        const lateFeeAmount = this.calculateLateFee(feeRecord.outstanding_amount);
        
        if (lateFeeAmount > 0) {
          // Check if late fee already applied this month
          const existingLateFee = await this.checkExistingLateFee(
            feeRecord.student_id, 
            feeRecord.fee_id
          );

          if (!existingLateFee) {
            await this.createLateFeeRecord(feeRecord, lateFeeAmount);
            appliedCount++;
            
            results.push({
              student_id: feeRecord.student_id,
              student_name: `${feeRecord.firstName} ${feeRecord.lastName}`,
              outstanding_amount: feeRecord.outstanding_amount,
              late_fee_applied: lateFeeAmount,
              subcategory: feeRecord.subcategory_name
            });
          }
        }
      }

      return {
        success: true,
        message: `Late fees applied to ${appliedCount} students`,
        appliedCount: appliedCount,
        details: results
      };

    } catch (error) {
      console.error("Error applying late fees:", error);
      throw error;
    }
  }

  // Check if late fee already applied this month for this student and fee
  static async checkExistingLateFee(studentId, originalFeeId) {
    try {
      const currentMonth = moment().format('YYYY-MM');
      
      const query = `
        SELECT COUNT(*) as count 
        FROM Fees 
        WHERE student_id = :studentId 
        AND subcategory_id = (
          SELECT subcategory_id FROM FeeSubCategories 
          WHERE subcategory_name = 'Late Fee'
        )
        AND DATE_FORMAT(payment_date, '%Y-%m') = :currentMonth
        AND JSON_EXTRACT(metadata, '$.original_fee_id') = :originalFeeId
      `;

      const result = await db.seqeulize.query(query, {
        type: QueryTypes.SELECT,
        replacements: {
          studentId: studentId,
          currentMonth: currentMonth,
          originalFeeId: originalFeeId
        }
      });

      return result[0].count > 0;
    } catch (error) {
      console.error("Error checking existing late fee:", error);
      return false;
    }
  }

  // Create late fee record
  static async createLateFeeRecord(originalFeeRecord, lateFeeAmount) {
    try {
      // First, ensure we have a "Late Fee" subcategory
      const lateFeeSubcategoryId = await this.ensureLateFeeSubcategory();

      const insertQuery = `
        INSERT INTO Fees (
          fee_amount, 
          subcategory_id, 
          student_id, 
          payment_date, 
          pay, 
          isActive,
          metadata
        ) VALUES (
          :lateFeeAmount,
          :subcategoryId,
          :studentId,
          CURDATE(),
          0,
          1,
          :metadata
        )
      `;

      const metadata = JSON.stringify({
        type: 'late_fee',
        original_fee_id: originalFeeRecord.fee_id,
        applied_date: moment().format('YYYY-MM-DD'),
        original_outstanding: originalFeeRecord.outstanding_amount
      });

      await db.seqeulize.query(insertQuery, {
        type: QueryTypes.INSERT,
        replacements: {
          lateFeeAmount: lateFeeAmount,
          subcategoryId: lateFeeSubcategoryId,
          studentId: originalFeeRecord.student_id,
          metadata: metadata
        }
      });

    } catch (error) {
      console.error("Error creating late fee record:", error);
      throw error;
    }
  }

  // Ensure Late Fee subcategory exists
  static async ensureLateFeeSubcategory() {
    try {
      // Check if Late Fee subcategory exists
      const checkQuery = `
        SELECT subcategory_id 
        FROM FeeSubCategories 
        WHERE subcategory_name = 'Late Fee'
      `;

      const existing = await db.seqeulize.query(checkQuery, {
        type: QueryTypes.SELECT,
      });

      if (existing.length > 0) {
        return existing[0].subcategory_id;
      }

      // Create Late Fee subcategory if it doesn't exist
      const insertQuery = `
        INSERT INTO FeeSubCategories (subcategory_name, category_id, isActive)
        VALUES ('Late Fee', 1, 1)
      `;

      const result = await db.seqeulize.query(insertQuery, {
        type: QueryTypes.INSERT,
      });

      return result[0]; // Return the inserted ID
    } catch (error) {
      console.error("Error ensuring late fee subcategory:", error);
      throw error;
    }
  }

  // Get late fee report for a specific month
  static async getLateFeeReport(month = null, year = null) {
    try {
      const targetMonth = month || moment().month() + 1;
      const targetYear = year || moment().year();

      const query = `
        SELECT 
          s.id as student_id,
          CONCAT(s.firstName, ' ', s.lastName) as student_name,
          s.class_id,
          s.division_id,
          f.fee_amount as late_fee_amount,
          f.pay as late_fee_paid,
          (f.fee_amount - f.pay) as late_fee_outstanding,
          f.payment_date as late_fee_applied_date,
          JSON_EXTRACT(f.metadata, '$.original_outstanding') as original_outstanding
        FROM Fees f
        JOIN students s ON f.student_id = s.id
        JOIN FeeSubCategories sc ON f.subcategory_id = sc.subcategory_id
        WHERE sc.subcategory_name = 'Late Fee'
        AND MONTH(f.payment_date) = :month
        AND YEAR(f.payment_date) = :year
        ORDER BY s.class_id, s.division_id, s.firstName
      `;

      const report = await db.seqeulize.query(query, {
        type: QueryTypes.SELECT,
        replacements: {
          month: targetMonth,
          year: targetYear
        }
      });

      return {
        month: targetMonth,
        year: targetYear,
        total_students: report.length,
        total_late_fees: report.reduce((sum, record) => sum + parseFloat(record.late_fee_amount), 0),
        total_outstanding: report.reduce((sum, record) => sum + parseFloat(record.late_fee_outstanding), 0),
        details: report
      };

    } catch (error) {
      console.error("Error generating late fee report:", error);
      throw error;
    }
  }
}

module.exports = LateFeeService;
