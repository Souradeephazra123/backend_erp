// routes/feeRoutes.js

const express = require("express");
const {
  createFee,
  editFee,
  fullpayment,
} = require("../../controller/private/feeController");

const router = express.Router();

router.post("/", createFee);
router.put("/:fee_id", editFee);
router.post("/fullpayment/:fee_id", fullpayment);

module.exports = router;
