// routes/feeRoutes.js

const express = require("express");
const {
  createFee,
  editFee,
  fullpayment,
} = require("../../controller/private/feeController");
const log4js = require("log4js");
const logger = log4js.getLogger();

const router = express.Router();

// Middleware to log all requests to this router
router.use((req, res, next) => {
  logger.info(`Fee route hit: ${req.method} ${req.originalUrl}`);
  logger.debug(`Request params:`, req.params);
  logger.debug(`Request query:`, req.query);
  if (req.body && Object.keys(req.body).length > 0) {
    logger.debug(`Request body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

router.post("/", createFee);
router.put("/:fee_id", editFee);
router.post("/fullpayment/:fee_id", fullpayment);

module.exports = router;
