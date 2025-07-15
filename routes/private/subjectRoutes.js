// routes/subjectRoutes.js
const express = require("express");
const router = express.Router();
const subjectController = require("../../controller/private/subjectController");

// Create a subject
router.post("/create-subject", subjectController.createSubject);

// Get all subjects
router.get("/subjects", subjectController.getAllSubjects);

module.exports = router;
