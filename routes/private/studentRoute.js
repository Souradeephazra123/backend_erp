const express = require("express");
const router = express.Router();
const upload = require("../../config/multerConfig");
const newStudentController = require("../../controller/private/newStudentController");
const studentController = require("../../controller/private/studentController");
const {
  getStudentFeesDetails,
  getPaymentHistory,
} = require("../../controller/private/getfee");
// new student
router.post(
  "/newstudent",
  upload.single("file"),
  newStudentController.addStudent
);
router.get("/bus-route", newStudentController.getBusRoute);
router.get("/academic-year", newStudentController.getAcadmeicYear);
router.post("/student/login", newStudentController.login);
router.get("/newstudent/:id", newStudentController.getStudentById);
router.get("/newstudents", newStudentController.getStudentsByQuery);
router.post("/updateStudent", newStudentController.updateStudentDetails);
router.get(
  "/count/student/gender/:classid/:divisionid",
  newStudentController.getGenderCounts
);
router.get(
  "/count/student/hostel/:classid/:divisionid",
  newStudentController.getHostelTypeCounts
);
// all students
router.get(
  "/count/student/category/:classid/:divisionid",
  newStudentController.getCategoryCounts
);
router.get("/allstudents", studentController.getAllStudents);
// search students
router.get("/search", studentController.getStudentById);
// ID card
router.get("/idcard", studentController.getIdCard);

// fee

router.get("/fee/:id", getStudentFeesDetails);
router.get("/feeHistory/:id", getPaymentHistory);

module.exports = router;
