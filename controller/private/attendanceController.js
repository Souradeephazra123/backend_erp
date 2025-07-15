const Attendance = require("../../model/attendanceModel");
const db = require("../../config/dbConfig");
const { QueryTypes } = require("sequelize");
const { Op } = require("sequelize");
const moment = require("moment");
exports.markAttendance = async (req, res) => {
  const { classId, divisionId, student_id, date } = req.body;

  // Default to today's date if not provided
  console.log(classId, divisionId, student_id, date);
  const todayDate = date || moment().format("YYYY-MM-DD");

  try {
    // Step 1: Check if attendance records exist for today
    const checkAttendanceQuery = `
        SELECT COUNT(*) as count FROM attendance 
        WHERE class_id = :classId AND division_id = :divisionId AND date = :date`;

    const attendanceCheck = await db.seqeulize.query(checkAttendanceQuery, {
      type: QueryTypes.SELECT,
      replacements: {
        classId,
        divisionId,
        date: todayDate,
      },
    });

    // If no attendance records are found for the given date
    if (attendanceCheck[0].count === 0) {
      return res
        .status(404)
        .json({ message: "No attendance records found for today." });
    }

    // Step 2: Get the specific student
    const getStudentsQuery = `
        SELECT COUNT(*) as count FROM students 
        WHERE class_id = :classId AND division_id = :divisionId AND id = :studentId`;

    const students = await db.seqeulize.query(getStudentsQuery, {
      type: QueryTypes.SELECT,
      replacements: {
        classId,
        divisionId,
        studentId: student_id,
      },
    });

    if (students[0].count === 0) {
      return res.status(404).json({
        message: "No students found for the given class and division.",
      });
    }

    // Step 3: Mark attendance for the given student on the given date
    const markAttendanceQuery = `
        UPDATE attendance 
        SET status = CASE 
          WHEN status = 'Present' THEN 'Absent' 
          ELSE 'Present' 
        END 
        WHERE class_id = :classId AND division_id = :divisionId AND student_id = :studentId AND date = :date`;

    await db.seqeulize.query(markAttendanceQuery, {
      type: QueryTypes.UPDATE,
      replacements: {
        classId,
        divisionId,
        studentId: student_id,
        date: todayDate,
      },
    });

    res.status(200).json({
      message: "Attendance updated successfully",
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ message: "Failed to update attendance" });
  }
};

exports.getStudentList = async (req, res) => {
  const { classid, divisionid, date } = req.body;
  console.log(classid, divisionid, date);

  // Use today's date if the date is not provided
  const attendanceDate = date || moment().format("YYYY-MM-DD");

  try {
    console.log(classid, divisionid, attendanceDate);

    // First query: Fetch student IDs for the specified class and division
    const sql =
      "SELECT id FROM students WHERE class_id = ? AND division_id = ?";
    const students = await db.seqeulize.query(sql, {
      replacements: [classid, divisionid],
      type: db.Sequelize.QueryTypes.SELECT,
    });

    console.log(students); // Log the students array

    // If no students are found
    if (!students.length) {
      return res
        .status(404)
        .json({ message: "No students found for this class and division." });
    }

    // Extract student IDs
    const studentIds = students.map((student) => student.id);

    // Fetch students who are not yet marked in the attendance table
    const sql2 = `
      SELECT s.id, CONCAT(s.firstName, ' ', s.middleName, ' ', s.lastName) AS fullName
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id AND a.date = :date
      WHERE s.id IN (:studentIds) AND a.student_id IS NULL
    `;

    const attendanceRecords = await db.seqeulize.query(sql2, {
      replacements: {
        studentIds: studentIds,
        date: attendanceDate,
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    console.log(attendanceRecords); // Log the students without attendance

    // Insert each student into the attendance table as 'present'
    for (const record of attendanceRecords) {
      const insertSql = `
        INSERT INTO attendance (student_id, date, status, class_id, division_id)
        VALUES (?, ?, 'Present', ?, ?)
      `;
      await db.seqeulize.query(insertSql, {
        replacements: [record.id, attendanceDate, classid, divisionid],
        type: db.Sequelize.QueryTypes.INSERT,
      });
    }

    // Fetch all students from the attendance table for the specific class, division, and date
    const fetchAttendanceSql = `
      SELECT a.student_id, CONCAT(s.firstName, ' ', s.middleName, ' ', s.lastName) AS fullName, a.status, s.regdNo
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.class_id = ? AND a.division_id = ? AND a.date = ?
    `;

    const allAttendanceRecords = await db.seqeulize.query(fetchAttendanceSql, {
      replacements: [classid, divisionid, attendanceDate],
      type: db.Sequelize.QueryTypes.SELECT,
    });

    res.status(200).json({
      message: "Attendance records retrieved successfully",
      data: allAttendanceRecords,
    });
  } catch (error) {
    console.error("Failed to fetch students:", error);
    res.status(500).json({ message: "Failed to fetch students", error });
  }
};

exports.getStudentDetails = async (req, res) => {
  const { id } = req.params; // Extracting the student ID from query parameters

  try {
    const attendanceRecords = await db.seqeulize.query(
      "SELECT * FROM attendance WHERE student_id = ? ORDER BY date ASC",
      {
        type: QueryTypes.SELECT,
        replacements: [id], // Use an array for positional replacement
      }
    );
    console.log(attendanceRecords);

    // If no attendance records found, return an error message
    if (attendanceRecords.length === 0) {
      return res.status(404).json({
        message: `No attendance records found for student ID ${id}`,
      });
    }

    // Return the attendance records in the response
    res.status(200).json({
      message: "Attendance records retrieved successfully",
      attendance: attendanceRecords,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({
      message: "Error fetching attendance records",
      error: error.message,
    });
  }
};

exports.getAttendanceForDate = async (req, res) => {
  const { periodId, date } = req.query;

  try {
    // Step 1: Query attendance records for the specified date and period
    const attendanceQuery = `
      SELECT 
        s.id AS student_id, 
        s.firstName, 
        s.lastName, 
        a.status,
        p.period_name,
        c.class_name AS period_class,  
        d.division_name AS period_division  
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN periods p ON a.period_id = p.id
      JOIN classes c ON p.class_id = c.id  
      JOIN divisions d ON p.division_id = d.id  
      WHERE a.period_id = :periodId AND DATE(a.date) = :date`;

    const attendanceRecords = await db.seqeulize.query(attendanceQuery, {
      type: QueryTypes.SELECT,
      replacements: { periodId, date },
    });

    if (attendanceRecords.length === 0) {
      return res
        .status(404)
        .json({ message: "No attendance records found for the given date" });
    }

    const response = {
      attendance: attendanceRecords,
      period_name: attendanceRecords[0].period_name,
      period_class: attendanceRecords[0].period_class,
      period_division: attendanceRecords[0].period_division,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Failed to fetch attendance records:", error);
    res.status(500).json({ message: "Failed to fetch attendance records" });
  }
};

exports.getStaffAttendance = async (req, res) => {
  try {
    const { date } = req.body;
    console.log(req.body);
    const todayDate = date || moment().format("YYYY-MM-DD");

    // Step 1: Get all staff members
    const getStaffQuery = `SELECT id FROM staff`;
    const staff = await db.seqeulize.query(getStaffQuery, {
      type: QueryTypes.SELECT,
    });

    if (!staff || staff.length === 0) {
      return res.status(404).json({ message: "No staff members found." });
    }

    // Step 2: Get existing attendance records for the given date
    const getExistingAttendanceQuery = `
      SELECT staff_id FROM staff_attendance WHERE date = :date
    `;

    const existingAttendance = await db.seqeulize.query(
      getExistingAttendanceQuery,
      {
        type: QueryTypes.SELECT,
        replacements: { date: todayDate },
      }
    );

    const presentStaffIds = new Set(
      existingAttendance.map((record) => record.staff_id)
    );

    // Step 3: Prepare new attendance records (only for staff not marked yet)
    const newAttendanceRecords = staff
      .filter((staffMember) => !presentStaffIds.has(staffMember.id))
      .map((staffMember) => `(${staffMember.id}, 'Present', '${todayDate}')`);

    // Step 4: Bulk insert new attendance records using raw SQL
    if (newAttendanceRecords.length > 0) {
      const insertAttendanceQuery = `
        INSERT INTO staff_attendance (staff_id, status, date) 
        VALUES ${newAttendanceRecords.join(", ")}
      `;

      await db.seqeulize.query(insertAttendanceQuery, {
        type: QueryTypes.INSERT,
      });
    }

    // Step 5: Fetch the updated attendance records
    const fetchAttendanceQuery = `
      SELECT s.id, s.name, sa.status 
      FROM staff_attendance sa
      JOIN staff s ON sa.staff_id = s.id
      WHERE sa.date = :date
    `;

    const allAttendanceRecords = await db.seqeulize.query(
      fetchAttendanceQuery,
      {
        replacements: { date: todayDate },
        type: QueryTypes.SELECT,
      }
    );

    res.status(200).json({
      message: "Staff attendance marked successfully.",
      attendance: allAttendanceRecords,
    });
  } catch (error) {
    console.error("Failed to mark staff attendance:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.markStaffAttendance = async (req, res) => {
  const { staff_id, date } = req.body;
  const currentDate = date || moment().format("YYYY-MM-DD");
  console.log(staff_id, currentDate);
  try {
    const checkAttendanceQuery = `
        SELECT COUNT(*) as count FROM staff_attendance 
        WHERE date = :date`;

    const attendanceCheck = await db.seqeulize.query(checkAttendanceQuery, {
      type: QueryTypes.SELECT,
      replacements: {
        date: currentDate,
      },
    });

    // If no attendance records are found for the given date
    if (attendanceCheck[0].count === 0) {
      return res
        .status(404)
        .json({ message: "No attendance records found for today." });
    }

    const getStaffQuery = `
    SELECT COUNT(*) as count FROM staff
    WHERE id = :staff_id`;

    const staff = await db.seqeulize.query(getStaffQuery, {
      type: QueryTypes.SELECT,
      replacements: {
        staff_id: staff_id,
      },
    });
    console.log(staff);

    if (staff[0].count === 0) {
      return res.status(404).json({
        message: "No staff found for the given staff id.",
      });
    }

    const markAttendanceQuery = `
        UPDATE staff_attendance 
        SET status = CASE 
          WHEN status = 'Present' THEN 'Absent' 
          ELSE 'Present' 
        END 
        WHERE staff_id = :staff_id AND date = :date`;

    await db.seqeulize.query(markAttendanceQuery, {
      type: QueryTypes.UPDATE,
      replacements: {
        staff_id: staff_id,
        date: currentDate,
      },
    });

    res.status(200).json({
      message: "Staff attendance marked successfully",
    });
  } catch (error) {
    console.error("Failed to mark staff attendance:", error);
    res.status(500).json({ message: "Failed to mark staff attendance" });
  }
};

exports.getStaffList = async (req, res) => {
  try {
    const getStaffQuery = `SELECT id, name, gender, designation, salary_monthly, salary_day_wise, paid_leave FROM staff`;

    const staffList = await db.seqeulize.query(getStaffQuery, {
      type: QueryTypes.SELECT,
    });

    if (staffList.length === 0) {
      return res.status(404).json({ message: "No staff members found" });
    }

    res.status(200).json(staffList);
  } catch (error) {
    console.error("Failed to fetch staff list:", error);
    res.status(500).json({ message: "Failed to fetch staff list" });
  }
};

// Add a single staff member
exports.addSingleStaff = async (req, res) => {
  const {
    name,
    gender,
    designation,
    salary,
    epfNumber,
    epfEmployeePercentage,
    epfEmployerPercentage,
  } = req.body;

  if (!name || !gender || !designation || !salary) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const insertStaffQuery = `
        INSERT INTO staff (name, gender, designation, salary, epf_number, epf_employee_percentage, epf_employer_percentage)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const result = await db.seqeulize.query(insertStaffQuery, {
      replacements: [
        name,
        gender,
        designation,
        salary,
        epfNumber,
        epfEmployeePercentage || 12,
        epfEmployerPercentage || 12,
      ],
    });

    res.status(200).json({
      message: "Staff added successfully",
      staffId: result.insertId,
    });
  } catch (error) {
    console.error("Failed to add staff:", error);
    res.status(500).json({ message: "Failed to add staff" });
  }
};

// Bulk add staff members
exports.addBulkStaff = async (req, res) => {
  const staffList = req.body.staffList;

  if (!Array.isArray(staffList) || staffList.length === 0) {
    return res
      .status(400)
      .json({ message: "Staff list is required and should be an array" });
  }

  try {
    const insertStaffQuery = `
        INSERT INTO staff (name, gender, designation, salary, epf_number, epf_employee_percentage, epf_employer_percentage)
        VALUES ?`;

    const values = staffList.map((staff) => [
      staff.name,
      staff.gender,
      staff.designation,
      staff.salary,
      staff.epfNumber,
      staff.epfEmployeePercentage || 12,
      staff.epfEmployerPercentage || 12,
    ]);

    await db.seqeulize.query(insertStaffQuery, { replacements: [values] });

    res.status(200).json({ message: "Bulk staff added successfully" });
  } catch (error) {
    console.error("Failed to bulk add staff:", error);
    res.status(500).json({ message: "Failed to bulk add staff" });
  }
};
