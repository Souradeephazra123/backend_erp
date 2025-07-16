const express = require("express");
const authController = require("../../controller/public/authController");
const log4js = require("log4js");
const logger = log4js.getLogger();

const router = express.Router();
const prefix = "/api/auth";

// Middleware to log all requests to this router
router.use((req, res, next) => {
  logger.info(`Auth route hit: ${req.method} ${req.originalUrl}`);
  logger.debug(`Request params:`, req.params);
  logger.debug(`Request query:`, req.query);
  if (req.body && Object.keys(req.body).length > 0) {
    logger.debug(`Request body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

router.post(`${prefix}/register`, authController.register);
router.post(`${prefix}/login`, authController.login);
router.post(`${prefix}/refresh-token`, authController.refreshToken);

module.exports = router;
