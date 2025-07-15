const db = require('../../config/dbConfig');
const { Op } = require("sequelize");
const moment = require('moment');
const certificatteController = require('../../controller/private/certificateController');
//student model
const Student = db.Student;
const Address = db.Address;
// all students
module.exports.getAllStudents = async (req, res) => {
    try {
        const student = await Student.findAll({
            include: [{
                model: Address,
                attributes: { exclude: ['id', 'profile', 'studentId'] }
            }]
        });
        // const address = await Address.findOne();
        return res.status(200).send({ student: student });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'something went wrong to fetch students' });
    }

};

// search students by student id
module.exports.getStudentById = async (req, res) => {
    try {
        const { searchdata } = req.body;

        if (!searchdata) {
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
            include: [{
                model: Address,
                attributes: { exclude: ['id', 'profile', 'studentId'] }
            }]
        });

        if (students.length === 0) {
            return res.status(404).send({ message: "No students found" });
        }

        return res.status(200).send({ students });

    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'An error occurred while fetching students' });
    }
};
//ID Card
module.exports.getIdCard = async (req, res) => {
    try {
        const { student_id } = req.body;

        const student = await Student.findOne({
            // attributes: ['id','firstName','middleName','lastName','dob','fatherName','mobileNo','presentAddress'],
            where: {
                id: student_id
            }
        });
        const address = await Address.findOne({
            // attributes:['pincode','taluka'],
            where: {
                id: student_id
            }
        });
        return res.status(200).send({ student: student, address: address });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'data lost' }); // Send a response with status 500 and a message
    }
}
// bonafide Certificate
module.exports.getBonafideCertificate = async (req, res) => {
    const certificateId = certificatteController.getCertificateId();

}