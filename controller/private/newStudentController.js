const db = require("../../config/dbConfig");
const moment = require("moment");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// TODO profile change
const profile = "Student";

//student model
const Student = db.Student;
const Address = db.Address;
const FeeSubCategories = db.FeeSubCategory;
const Fees = db.Fee;

module.exports.addStudent = async (req, res) => {
  const transaction = await db.seqeulize.transaction(); // Start a transaction
  try {
    console.log("addStudent: ", req.body);

    const {
      academic_year,
      first_name,
      middle_name,
      last_name,
      student_type,
      class_id,
      division_id,
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
    } = req.body;

    if (!req.file) {
      return res.status(400).send("Image not uploaded.");
    }

    // Format image URL
    const imageUrl = `/uploads/${req.file.filename}`;

    // Parse dob and format it for the database and password creation
    const parsedDob = moment(dob, "YYYY-MM-DD");
    const dobFormatted = parsedDob.format("YYYY-MM-DD");

    if (!parsedDob.isValid()) {
      return res.status(400).send("Invalid date format for DOB.");
    }

    const forPassword = parsedDob.format("DD/MM/YYYY"); // Use for password creation
    const password = await bcrypt.hash(forPassword, 10); // Hash the password

    const studentObj = {
      academic_year_id: academic_year,
      firstName: first_name,
      middleName: middle_name,
      lastName: last_name,
      studentType: student_type,
      class_id: class_id,
      division_id: division_id,
      admDate: new Date(),
      uidNo: uid_no,
      father_aadhar: father_aadhar,
      mother_aadhar: mother_aadhar,
      photo: imageUrl,
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
      bus_route_id: bus_route,
      mobileNo: mobile_no,
      alternateMobileNo: alternate_mobile_no,
      emailId: email_id,
      password: password,
      regdNo: regdNo,
      gender: gender,
      hostelType: hostelType,
    };

    // Save student in the database
    const newStudent = await Student.create(studentObj, { transaction });

    // Create address object and save
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
      country: country?.value,
    };
    const address = await Address.create(addressObj, { transaction });

    // Check if class_id exists in FeeSubCategories
    const feeSubCategories = await db.seqeulize.query(
      `SELECT subcategory_id, fee_amount
       FROM FeeSubCategories
       WHERE class_id = :classId`,
      {
        replacements: { classId: class_id }, // Safely replace the placeholder
        type: db.Sequelize.QueryTypes.SELECT,
        transaction,
      }
    );

    // Step 2: Insert Fees for each subcategory
    const feeInsertPromises = feeSubCategories.map((subcategory) =>
      db.seqeulize.query(
        `INSERT INTO Fees (fee_amount, subcategory_id, student_id, pay, isActive)
           VALUES (:feeAmount, :subcategoryId, :studentId, :pay, :isActive)`,
        {
          replacements: {
            feeAmount: subcategory.fee_amount,
            subcategoryId: subcategory.subcategory_id,
            studentId: newStudent.id,
            pay: subcategory.fee_amount, // Initial payment is 0
            isActive: 1,
          },
          type: db.Sequelize.QueryTypes.INSERT,
          transaction,
        }
      )
    );

    // Execute all insert operations
    await Promise.all(feeInsertPromises);

    await transaction.commit(); // Commit the transaction

    return res.status(200).send({
      message: "Student added successfully",
      student: newStudent,
      address: address,
    });
  } catch (error) {
    if (transaction) await transaction.rollback(); // Rollback transaction on error
    console.error(error);
    return res.status(500).send({ error: "Student not added" });
  }
};

module.exports.updateStudentDetails = async (req, res) => {
  try {
    const { id, ...fields } = req.body; // Extract the student ID and fields to update
    console.log(fields);
    // Define fields for each table
    const studentFields = [
      "firstName",
      "middleName",
      "lastName",
      "uidNo",
      "bloodGrp",
      "fatherName",
      "motherName",
      "guardianName",
      "religion",
      "category",
      "nationality",
      "mobileNo",
      "alternateMobileNo",
      "emailId",
      "busRoute",
    ];

    const addressFields = [
      "presentAddress",
      "permanentAddress",
      "taluka",
      "city",
      "district",
      "state",
      "pincode",
      "country",
    ];

    // Separate fields for each table
    const studentUpdates = {};
    const addressUpdates = {};

    for (const [key, value] of Object.entries(fields)) {
      if (studentFields.includes(key)) {
        studentUpdates[key] = value;
      } else if (addressFields.includes(key)) {
        addressUpdates[key] = value;
      }
    }

    // Ensure at least one field is provided for update
    if (
      Object.keys(studentUpdates).length === 0 &&
      Object.keys(addressUpdates).length === 0
    ) {
      return res
        .status(400)
        .json({ message: "No valid fields provided for update" });
    }

    // Initialize query and replacements
    const queries = [];
    const replacements = { id }; // Ensure `id` is part of replacements

    // Update the `students` table
    if (Object.keys(studentUpdates).length > 0) {
      const studentSetClause = Object.keys(studentUpdates)
        .map((field) => `${field} = :${field}`)
        .join(", ");
      queries.push(`UPDATE students SET ${studentSetClause} WHERE id = :id`);
      Object.assign(replacements, studentUpdates);
    }

    // Update the `addresses` table
    if (Object.keys(addressUpdates).length > 0) {
      const addressExistsQuery = `
        SELECT COUNT(*) AS count FROM addresses WHERE id = :id
      `;
      const [addressExists] = await db.seqeulize.query(addressExistsQuery, {
        type: db.Sequelize.QueryTypes.SELECT,
        replacements: { id },
      });

      if (addressExists.count > 0) {
        const addressSetClause = Object.keys(addressUpdates)
          .map((field) => `${field} = :${field}`)
          .join(", ");
        queries.push(`UPDATE addresses SET ${addressSetClause} WHERE id = :id`);
      } else {
        const addressFieldsClause = Object.keys(addressUpdates)
          .concat(["studentId"])
          .join(", ");
        const addressValuesClause = Object.keys(addressUpdates)
          .concat(["studentId"])
          .map((field) => `:${field}`)
          .join(", ");
        queries.push(
          `INSERT INTO addresses (${addressFieldsClause}) VALUES (${addressValuesClause})`
        );
        replacements.studentId = id; // Add `studentId` for insert query
      }
      Object.assign(replacements, addressUpdates);
    }

    // Execute all queries in a transaction
    await db.seqeulize.transaction(async (t) => {
      for (const query of queries) {
        await db.seqeulize.query(query, {
          type: db.Sequelize.QueryTypes.UPDATE,
          replacements,
          transaction: t,
        });
      }
    });

    res.status(200).json({
      message: "Student and address details updated successfully",
      updatedFields: {
        student: studentUpdates,
        address: addressUpdates,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
module.exports.getGenderCounts = async (req, res) => {
  const { classid, divisionid } = req.params;

  // Validate input
  if (!classid || !divisionid) {
    return res
      .status(400)
      .json({ message: "class_id and division_id are required." });
  }

  try {
    // Query the database to count students by gender
    const genderCounts = await Student.findAll({
      where: {
        class_id: classid,
        division_id: divisionid,
      },
      attributes: [
        "gender",
        [db.Sequelize.fn("COUNT", db.Sequelize.col("gender")), "count"],
      ],
      group: ["gender"], // Group by gender
    });

    // Transform the result into a readable format
    console.log(genderCounts);
    const result = {};
    genderCounts.forEach((row) => {
      result[row.gender] = row.dataValues.count;
    });

    res.status(200).json({ classid, divisionid, genderCounts: result });
  } catch (error) {
    console.error("Error fetching gender counts:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching gender counts." });
  }
};
module.exports.getHostelTypeCounts = async (req, res) => {
  const { classid, divisionid } = req.params;

  // Validate input
  if (!classid || !divisionid) {
    return res
      .status(400)
      .json({ message: "class_id and division_id are required." });
  }

  try {
    // Query the database to count students by hostelType
    const hostelTypeCounts = await Student.findAll({
      where: {
        class_id: classid,
        division_id: divisionid,
      },
      attributes: [
        "hostelType",
        [db.Sequelize.fn("COUNT", db.Sequelize.col("hostelType")), "count"],
      ],
      group: ["hostelType"], // Group by hostelType
    });

    // Transform the result into a readable format
    const result = {};
    hostelTypeCounts.forEach((row) => {
      result[row.hostelType] = row.dataValues.count;
    });

    res.status(200).json({ classid, divisionid, hostelTypeCounts: result });
  } catch (error) {
    console.error("Error fetching hostelType counts:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching hostelType counts." });
  }
};
module.exports.getCategoryCounts = async (req, res) => {
  const { classid, divisionid } = req.params;

  // Validate input
  if (!classid || !divisionid) {
    return res
      .status(400)
      .json({ message: "class_id and division_id are required." });
  }

  try {
    // Query the database to count students by category
    const categoryCounts = await Student.findAll({
      where: {
        class_id: classid,
        division_id: divisionid,
      },
      attributes: [
        "category",
        [db.Sequelize.fn("COUNT", db.Sequelize.col("category")), "count"],
      ],
      group: ["category"], // Group by category
    });

    // Transform the result into a readable format
    const result = {};
    categoryCounts.forEach((row) => {
      result[row.category] = row.dataValues.count;
    });

    res.status(200).json({ classid, divisionid, categoryCounts: result });
  } catch (error) {
    console.error("Error fetching category counts:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching category counts." });
  }
};

module.exports.getStudentById = async (req, res) => {
  try {
    const studentId = req.params.id;
    const profile = "student"; // Profile value to filter the address data.

    // Raw SQL Query
    const query = `
      SELECT 
        s.id AS id,
        s.academic_year_id,
        s.firstName,
        s.middleName,
        s.lastName,
        s.studentType,
        s.admDate,
        s.uidNo,
        s.dob,
        s.dobPlace,
        s.bloodGrp,
        s.photo,
        s.identificationMark1,
        s.identificationMark2,
        s.fatherName,
        s.motherName,
        s.guardianName,
        s.religion,
        s.category,
        s.nationality,
        s.mobileNo,
        s.alternateMobileNo,
        s.emailId,
        s.isActive,
        s.admNo,
        s.regdNo,
        s.mother_aadhar,
        s.father_aadhar,
        br.route_name as route_name,
        s.password,
        s.createdAt,
        s.updatedAt,
        c.class_name AS className,
        d.division_name AS divisionName,
        d.division_name AS divisionName,
        a.id AS addressId,
        a.profile,
        a.presentAddress,
        a.permanentAddress,
        a.taluka,
        a.city,
        a.district,
        a.state,
        a.pincode,
        a.country,
        a.isActive AS addressIsActive,
        a.createdAt AS addressCreatedAt,
        a.updatedAt AS addressUpdatedAt
      FROM 
        students s
      LEFT JOIN 
        classes c ON s.class_id = c.id
      LEFT JOIN 
        divisions d ON s.division_id = d.id
      LEFT JOIN 
        addresses a ON a.id = s.id
      LEFT JOIN 
       bus_route br ON br.id = s.bus_route_id
      WHERE 
        s.id = :studentId;
    `;

    // Execute Query
    const [result] = await db.seqeulize.query(query, {
      replacements: { studentId, profile },
      type: db.seqeulize.QueryTypes.SELECT,
    });

    // Handle Not Found
    if (!result) {
      return res.status(404).send({ message: "Student not found" });
    }

    // Format Response
    const formattedResponse = {
      student: {
        id: result.id,
        academicYear: result.academicYear,
        firstName: result.firstName,
        middleName: result.middleName,
        lastName: result.lastName,
        studentType: result.studentType,
        class_id: result.className, // Replace class_id with class name
        division_id: result.divisionName, // Replace division_id with division name
        admDate: result.admDate,
        uidNo: result.uidNo,
        dob: result.dob,
        dobPlace: result.dobPlace,
        bloodGrp: result.bloodGrp,
        photo: result.photo,
        identificationMark1: result.identificationMark1,
        identificationMark2: result.identificationMark2,
        fatherName: result.fatherName,
        motherName: result.motherName,
        guardianName: result.guardianName,
        religion: result.religion,
        category: result.category,
        nationality: result.nationality,
        mobileNo: result.mobileNo,
        alternateMobileNo: result.alternateMobileNo,
        emailId: result.emailId,
        isActive: result.isActive,
        admNo: result.admNo,
        regdNo: result.regdNo,
        mother_aadhar: result.mother_aadhar,
        father_aadhar: result.father_aadhar,
        busRoute: result.route_name,
        password: result.password,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        address: {
          id: result.addressId,
          profile: result.profile,
          presentAddress: result.presentAddress,
          permanentAddress: result.permanentAddress,
          taluka: result.taluka,
          city: result.city,
          district: result.district,
          state: result.state,
          pincode: result.pincode,
          country: result.country,
          isActive: result.addressIsActive,
          createdAt: result.addressCreatedAt,
          updatedAt: result.addressUpdatedAt,
        },
      },
    };

    // Return Response
    return res.status(200).send(formattedResponse);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send({ error: "Something went wrong while fetching the student" });
  }
};

module.exports.getStudentsByQuery = async (req, res) => {
  try {
    const { className, division, admNo, name } = req.query;

    const query = {};

    if (className) {
      query.class = className;
    }

    if (division) {
      query.division = division;
    }

    if (admNo) {
      query.admNo = admNo;
    }

    if (name) {
      const nameParts = name.split(" ");
      if (nameParts.length === 2) {
        query[Op.and] = [
          { firstName: { [Op.like]: `%${nameParts[0]}%` } },
          { lastName: { [Op.like]: `%${nameParts[1]}%` } },
        ];
      } else {
        query[Op.or] = [
          { firstName: { [Op.like]: `%${name}%` } },
          { lastName: { [Op.like]: `%${name}%` } },
        ];
      }
    }

    const students = await Student.findAll({
      where: query,
      include: [{ model: Address, where: { profile: "Student" } }],
    });

    if (!students || students.length === 0) {
      return res.status(404).send({ message: "No students found" });
    }

    return res.status(200).send({ students });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: "Something went wrong while fetching students" });
  }
};

module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if both email and password are provided
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // Find the user by email
    const user = await Student.findOne({ where: { emailId: email } });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: user.id, email: user.emailId },
      process.env.JWT_SECRET || "your_jwt_secret", // Replace with a strong secret
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        id: user.id,
        email: user.emailId,
        name: `${user.firstName} ${user.lastName}`,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getBusRoute = async (req, res) => {
  try {
    const query = `
   SELECT * FROM bus_route
`;

    // Execute the SQL query
    const result = await db.seqeulize.query(query, {
      type: db.seqeulize.QueryTypes.SELECT,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
module.exports.getAcadmeicYear = async (req, res) => {
  try {
    const query = `
   SELECT * FROM academic_year
`;

    // Execute the SQL query
    const result = await db.seqeulize.query(query, {
      type: db.seqeulize.QueryTypes.SELECT,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
