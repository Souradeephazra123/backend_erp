const db = require("../../config/dbConfig");
const { Op } = require("sequelize");
const moment = require("moment");
const certificatteController = require("../../controller/private/certificateController");
const log4js = require("log4js");
const logger = log4js.getLogger();

//student model
const Student = db.Student;
const Address = db.Address;
// all students
module.exports.getAllStudents = async (req, res) => {
  try {
    logger.info("getAllStudents function called");
    logger.debug("Fetching all students with address information");

    const student = await Student.findAll({
      include: [
        {
          model: Address,
          attributes: { exclude: ["id", "profile", "studentId"] },
        },
      ],
    });
    // const address = await Address.findOne();
    logger.info(`Successfully fetched ${student.length} students`);
    return res.status(200).send({ student: student });
  } catch (error) {
    logger.error("Error in getAllStudents:", error);
    console.log(error);
    return res
      .status(500)
      .send({ error: "something went wrong to fetch students" });
  }
};

// search students by student id
module.exports.getStudentById = async (req, res) => {
  try {
    const { searchdata } = req.body;
    logger.info("getStudentById function called");
    logger.debug(`Searching for student with data: ${searchdata}`);

    if (!searchdata) {
      logger.warn("getStudentById called without search data");
      return res.status(400).send({ message: "search vaue is required" });
    }

    const students = await Student.findAll({
      where: {
        // id: {
        //     [Op.like]: `${searchdata}%`,
        // },
        [Op.or]: [
          { id: { [Op.like]: `${searchdata}%` } },
          { firstName: { [Op.like]: `${searchdata}%` } },
          { mobileNo: { [Op.like]: `${searchdata}%` } },
          { alternateMobileNo: { [Op.like]: `${searchdata}%` } },
          { emailId: { [Op.like]: `${searchdata}%` } },
        ],
      },
      include: [
        {
          model: Address,
          attributes: { exclude: ["id", "profile", "studentId"] },
        },
      ],
    });

    logger.debug(`Search completed. Found ${students.length} students`);
    if (students.length === 0) {
      logger.warn(`No students found for search term: ${searchdata}`);
      return res.status(404).send({ message: "No students found" });
    }

    logger.info(
      `Successfully found ${students.length} students for search term: ${searchdata}`
    );
    return res.status(200).send({ students });
  } catch (error) {
    logger.error("Error in getStudentById:", error);
    console.error(error);
    return res
      .status(500)
      .send({ error: "An error occurred while fetching students" });
  }
};
//ID Card
module.exports.getIdCard = async (req, res) => {
  try {
    logger.info("getIdCard function called");
    const { student_id } = req.body;
    logger.debug(`Fetching ID card for student ID: ${student_id}`);

    logger.debug("Executing database query for student ID card");
    const student = await Student.findOne({
      // attributes: ['id','firstName','middleName','lastName','dob','fatherName','mobileNo','presentAddress'],
      where: {
        id: student_id,
      },
    });
    const address = await Address.findOne({
      // attributes:['pincode','taluka'],
      where: {
        id: student_id,
      },
    });
    return res.status(200).send({ student: student, address: address });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "data lost" }); // Send a response with status 500 and a message
  }
};
// bonafide Certificate
module.exports.getBonafideCertificate = async (req, res) => {
  const certificateId = certificatteController.getCertificateId();
};
