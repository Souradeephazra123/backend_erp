const axios = require("axios");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const bcrypt = require("bcrypt");
const moment = require("moment");
const db = require("../../config/dbConfig");
const Student = db.Student;
const Address = db.Address;

const massUploadStudents = async (req, res) => {
  const { id } = req.body;
  const transaction = await db.seqeulize.transaction();

  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    // Fetch required data from APIs
    const [
      classResponse,
      divisionResponse,
      academicYearResponse,
      busRouteResponse,
    ] = await Promise.all([
      axios.get(`https://api.erp.ignitingmindsbkp.in/api/class/classes/${id}`),
      axios.get("https://api.erp.ignitingmindsbkp.in/api/class/divisions"),
      axios.get("https://api.erp.ignitingmindsbkp.in/academic-year"),
      axios.get("https://api.erp.ignitingmindsbkp.in/bus-route"),
    ]);

    // Create mapping for class and division
    const classMap = classResponse.data.reduce((map, cls) => {
      map[cls.class_name] = cls.id;
      return map;
    }, {});

    const divisionMap = divisionResponse.data.reduce((map, div) => {
      if (!map[div.class_id]) map[div.class_id] = {};
      map[div.class_id][div.division_name] = div.id;
      return map;
    }, {});

    // Create mapping for academic year
    const academicYearMap = academicYearResponse.data.reduce((map, year) => {
      map[year.year] = year.id;
      return map;
    }, {});

    // Create mapping for bus routes
    const busRouteMap = busRouteResponse.data.reduce((map, route) => {
      map[route.route_name] = route.id;
      return map;
    }, {});

    // Read and process the uploaded Excel file
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const studentData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!Array.isArray(studentData) || studentData.length === 0) {
      throw new Error("Invalid or empty XLS file.");
    }

    const studentPromises = studentData.map(async (student) => {
      const {
        academic_year,
        first_name,
        middle_name,
        last_name,
        student_type,
        class_name,
        division_name,
        uid_no,
        dob,
        dob_place,
        blood_grp,
        identification_mark_1,
        identification_mark_2,
        father_name,
        mother_name,
        guardian_name,
        religion,
        category,
        nationality,
        present_address,
        permanent_address,
        taluka,
        city,
        district,
        state,
        pincode,
        country,
        bus_route,
        mobile_no,
        alternate_mobile_no,
        email_id,
        regdNo,
        gender,
        hostelType,
        father_aadhar,
        mother_aadhar,
      } = student;

      // Validate and map class & division
      const class_id = classMap[class_name];
      if (!class_id) throw new Error(`Invalid class_name: ${class_name}`);

      const division_id = divisionMap[class_id]?.[division_name];
      if (!division_id)
        throw new Error(
          `Invalid division_name: ${division_name} for class: ${class_name}`
        );

      // Validate and map academic year
      const academicYearId = academicYearMap[academic_year];
      if (!academicYearId)
        throw new Error(`Invalid academic_year: ${academic_year}`);

      // Validate and map bus route
      const busRouteId = bus_route ? busRouteMap[bus_route] : null;
      if (bus_route && !busRouteId)
        throw new Error(`Invalid bus_route: ${bus_route}`);

      // Parse and validate DOB
      let parsedDob;
      if (!isNaN(dob)) {
        parsedDob = moment(new Date(Math.round((dob - 25569) * 86400000)));
      } else {
        parsedDob = moment(dob, "DD/MM/YYYY");
      }

      if (!parsedDob.isValid())
        throw new Error(`Invalid DOB format for student: ${student.regdNo}`);

      const dobFormatted = parsedDob.format("YYYY-MM-DD");
      const forPassword = parsedDob.format("DD/MM/YYYY");
      const password = await bcrypt.hash(forPassword, 10);

      // Create the student object
      const studentObj = {
        academic_year_id: academicYearId,
        firstName: first_name,
        middleName: middle_name,
        lastName: last_name,
        studentType: student_type,
        class_id: class_id,
        division_id: division_id,
        admDate: new Date(),
        uidNo: uid_no,
        dob: dobFormatted,
        dobPlace: dob_place,
        bloodGrp: blood_grp,
        identificationMark1: identification_mark_1,
        identificationMark2: identification_mark_2,
        fatherName: father_name,
        motherName: mother_name,
        guardianName: guardian_name,
        religion: religion,
        category: category,
        nationality: nationality,
        mobileNo: mobile_no,
        alternateMobileNo: alternate_mobile_no,
        emailId: email_id,
        password: password,
        regdNo: regdNo,
        gender: gender,
        hostelType: hostelType,
        bus_route_id: busRouteId,
        father_aadhar: father_aadhar,
        mother_aadhar: mother_aadhar,
      };

      const newStudent = await Student.create(studentObj, { transaction });

      // Create and save the address
      const addressObj = {
        id: newStudent.id,
        profile: "student",
        presentAddress: present_address,
        permanentAddress: permanent_address,
        taluka: taluka,
        city: city,
        district: district,
        state: state,
        pincode: pincode,
        country: country,
      };
      await Address.create(addressObj, { transaction });

      // Handle fees for the student
      const feeSubCategories = await db.seqeulize.query(
        `SELECT subcategory_id, fee_amount FROM FeeSubCategories WHERE class_id = :classId`,
        {
          replacements: { classId: class_id },
          type: db.seqeulize.QueryTypes.SELECT,
          transaction,
        }
      );

      const feeInsertPromises = feeSubCategories.map((subcategory) =>
        db.seqeulize.query(
          `INSERT INTO Fees (fee_amount, subcategory_id, student_id, pay, isActive) VALUES (:feeAmount, :subcategoryId, :studentId, :pay, :isActive)`,
          {
            replacements: {
              feeAmount: subcategory.fee_amount,
              subcategoryId: subcategory.subcategory_id,
              studentId: newStudent.id,
              pay: 0,
              isActive: 1,
            },
            type: db.seqeulize.QueryTypes.INSERT,
            transaction,
          }
        )
      );

      await Promise.all(feeInsertPromises);
    });

    await Promise.all(studentPromises);
    await transaction.commit();

    // Delete the uploaded file
    fs.unlinkSync(filePath);

    return res.status(200).send({
      message: "Students added successfully",
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error during mass upload:", error);

    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).send({ error: "Error adding students." });
  }
};

module.exports = {
  massUploadStudents,
};
