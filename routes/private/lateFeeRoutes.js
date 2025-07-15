const express = require("express");
const router = express.Router();
const lateFeeController = require("../../controller/private/lateFeeController");

// Apply late fees to all students with outstanding amounts
router.post("/apply", lateFeeController.applyLateFees);

// Get students with outstanding fees
router.get("/outstanding", lateFeeController.getOutstandingFees);

// Get late fee report for a specific month/year
router.get("/report", lateFeeController.getLateFeeReport);

// Calculate late fee for a specific amount (preview)
router.post("/calculate", lateFeeController.calculateLateFee);

// Check if late fees can be applied (after 15th of month)
router.get("/eligibility", lateFeeController.checkLateFeeEligibility);

module.exports = router;
