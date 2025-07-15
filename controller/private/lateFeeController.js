const LateFeeService = require("../../service/lateFeeService");

// Apply late fees to all students with outstanding amounts
exports.applyLateFees = async (req, res) => {
  try {
    const result = await LateFeeService.applyLateFees();
    
    res.status(200).json({
      success: result.success,
      message: result.message,
      data: {
        appliedCount: result.appliedCount,
        details: result.details
      }
    });
  } catch (error) {
    console.error("Error in applyLateFees controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to apply late fees",
      error: error.message
    });
  }
};

// Get students with outstanding fees
exports.getOutstandingFees = async (req, res) => {
  try {
    const outstandingFees = await LateFeeService.getStudentsWithOutstandingFees();
    
    res.status(200).json({
      success: true,
      message: "Outstanding fees retrieved successfully",
      data: outstandingFees
    });
  } catch (error) {
    console.error("Error in getOutstandingFees controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve outstanding fees",
      error: error.message
    });
  }
};

// Get late fee report for a specific month/year
exports.getLateFeeReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const report = await LateFeeService.getLateFeeReport(
      month ? parseInt(month) : null,
      year ? parseInt(year) : null
    );
    
    res.status(200).json({
      success: true,
      message: "Late fee report generated successfully",
      data: report
    });
  } catch (error) {
    console.error("Error in getLateFeeReport controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate late fee report",
      error: error.message
    });
  }
};

// Calculate late fee for a specific amount (preview)
exports.calculateLateFee = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required"
      });
    }
    
    const lateFeeAmount = LateFeeService.calculateLateFee(parseFloat(amount));
    const config = LateFeeService.getLateFeeConfig();
    
    res.status(200).json({
      success: true,
      message: "Late fee calculated successfully",
      data: {
        originalAmount: parseFloat(amount),
        lateFeeAmount: lateFeeAmount,
        totalAmount: parseFloat(amount) + lateFeeAmount,
        config: config
      }
    });
  } catch (error) {
    console.error("Error in calculateLateFee controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate late fee",
      error: error.message
    });
  }
};

// Check if late fees can be applied (after 15th of month)
exports.checkLateFeeEligibility = async (req, res) => {
  try {
    const canApply = LateFeeService.isAfter15thOfMonth();
    const currentDate = new Date();
    
    res.status(200).json({
      success: true,
      message: "Late fee eligibility checked",
      data: {
        canApplyLateFees: canApply,
        currentDate: currentDate.toISOString().split('T')[0],
        currentDay: currentDate.getDate(),
        message: canApply 
          ? "Late fees can be applied" 
          : "Late fees can only be applied after 15th of the month"
      }
    });
  } catch (error) {
    console.error("Error in checkLateFeeEligibility controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check late fee eligibility",
      error: error.message
    });
  }
};
