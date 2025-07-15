const express = require("express");
const router = express.Router();
const attendanceController = require("../../controller/private/attendanceController");
const staffAttendanceController = require("../../controller/private/staffAttendanceController");

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
