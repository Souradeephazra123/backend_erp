// routes/classRoutes.js
const express = require("express");
const router = express.Router();
const classController = require("../../controller/private/classController");

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
