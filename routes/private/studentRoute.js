const express = require("express");
const router = express.Router();
const upload = require("../../config/multerConfig");
const newStudentController = require("../../controller/private/newStudentController");
const studentController = require("../../controller/private/studentController");
const {
  getStudentFeesDetails,
  getPaymentHistory,
} = require("../../controller/private/getfee");
const log4js = require("log4js");
const logger = log4js.getLogger();

// Middleware to log all requests to this router
router.use((req, res, next) => {
  logger.info(`Student route hit: ${req.method} ${req.originalUrl}`);
  logger.debug(`Request params:`, req.params);
  logger.debug(`Request query:`, req.query);
  if (req.body && Object.keys(req.body).length > 0) {
    logger.debug(`Request body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

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
