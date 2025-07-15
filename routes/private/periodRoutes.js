const express = require("express");
const router = express.Router();
const periodController = require("../../controller/private/periodController");

// Route for creating a period
router.post("/create-period", periodController.createPeriod);

// Route for getting all periods
router.get("/getperiods", periodController.getAllPeriods);

module.exports = router;
