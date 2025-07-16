const express = require("express");
const router = express.Router();
const attendanceController = require("../../controller/private/attendanceController");
const staffAttendanceController = require("../../controller/private/staffAttendanceController");
const log4js = require("log4js");
const logger = log4js.getLogger();

// Middleware to log all requests to this router
router.use((req, res, next) => {
  logger.info(`Attendance route hit: ${req.method} ${req.originalUrl}`);
  logger.debug(`Request params:`, req.params);
  logger.debug(`Request query:`, req.query);
  if (req.body && Object.keys(req.body).length > 0) {
    logger.debug(`Request body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

// Route for marking attendance (Students)
router.post("/markattendance", attendanceController.markAttendance);
router.post("/markattendance/student", attendanceController.getStudentList);

// Route for getting EPF details for a staff member
router.post("/staff", attendanceController.getStaffAttendance);

// Route for getting attendance for a specific date (Staff)
router.post("/markstaffattendance", attendanceController.markStaffAttendance);
router.get("/getattendance/:id", attendanceController.getStudentDetails);

router.get(
  "/getmonthlystaffattendance",
  staffAttendanceController.getMonthlyStaffAttendance
);

// Route for getting staff list
router.get("/stafflist", staffAttendanceController.getStaffList);

// Route to add single staff member
router.post("/addsinglestaff", staffAttendanceController.addSingleStaff);

// Route to bulk add staff members
router.post("/addbulkstaff", staffAttendanceController.addBulkStaff);

module.exports = router;
