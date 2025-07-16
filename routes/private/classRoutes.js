// routes/classRoutes.js
const express = require("express");
const router = express.Router();
const classController = require("../../controller/private/classController");
const log4js = require("log4js");
const logger = log4js.getLogger();

// Middleware to log all requests to this router
router.use((req, res, next) => {
  logger.info(`Class route hit: ${req.method} ${req.originalUrl}`);
  logger.debug(`Request params:`, req.params);
  logger.debug(`Request query:`, req.query);
  if (req.body && Object.keys(req.body).length > 0) {
    logger.debug(`Request body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

// Create a class
router.post("/create-class", classController.createClass);

// Get all classes
router.get("/classes/:id", classController.getAllClasses);

// Create a division
router.post("/create-division", classController.createDivision);

// Get divisions by class id
router.get("/divisions/:classId", classController.getDivisions);
router.get("/divisions", classController.getDivision);
router.get(
  "/students/:classId/:divisionId",
  classController.getStudentsByClassAndDivision
);
router.get(
  "/students/:classId/:divisionId/:filter",
  classController.getStudentsByClassAndDivisionFilter
);
router.get("/staff", classController.getSaff);

module.exports = router;
