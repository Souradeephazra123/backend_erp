const db = require("../../config/dbConfig");

// Mark attendance and calculate EPF for staff
exports.markStaffAttendance = (req, res) => {
  const { date, absentStaffIds } = req.body;

  try {
    // Step 1: Get all staff members
    const getStaffQuery = `SELECT * FROM staff`;

    db.query(getStaffQuery, (err, staffData) => {
      if (err) {
        console.log("Failed to fetch staff details:", err);
        return res
          .status(500)
          .json({ message: "Failed to fetch staff details" });
      }

      if (!staffData.length) {
        return res.status(404).json({ message: "No staff found" });
      }

      // Step 2: Prepare attendance records
      const attendanceRecords = staffData.map((staff) => {
        const isAbsent = absentStaffIds.includes(staff.id);
        let epfContribution = 0;

        // Calculate EPF contribution if not absent
        if (!isAbsent) {
          const { totalContribution } = calculateEPFContribution(
            staff.salary,
            staff.epf_employee_percentage,
            staff.epf_employer_percentage
          );
          epfContribution = totalContribution;

          // Update staff EPF balance and last contribution
          const updateEPFQuery = `
                        UPDATE staff 
                        SET epf_balance = epf_balance + ?, epf_last_contribution = ? 
                        WHERE id = ?`;

          db.query(
            updateEPFQuery,
            [epfContribution, epfContribution, staff.id],
            (updateErr) => {
              if (updateErr) {
                console.error(
                  `Failed to update EPF contribution for staff ID ${staff.id}:`,
                  updateErr
                );
              }
            }
          );
        }

        return {
          staff_id: staff.id,
          date: date,
          status: isAbsent ? "absent" : "present",
        };
      });

      // Step 3: Insert or update attendance records
      const attendanceQuery = `
                INSERT INTO staff_attendance (staff_id, date, status) 
                VALUES ? 
                ON DUPLICATE KEY UPDATE status = VALUES(status)`;

      const values = attendanceRecords.map((record) => [
        record.staff_id,
        record.date,
        record.status,
      ]);

      db.query(attendanceQuery, [values], (insertErr, insertResult) => {
        if (insertErr) {
          return res.status(500).json({ message: "Failed to mark attendance" });
        }

        res.status(200).json({
          message: "Attendance marked successfully",
          result: insertResult,
        });
      });
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ message: "An unexpected error occurred" });
  }
};

// Utility function to calculate EPF contribution
const calculateEPFContribution = (
  salary,
  employeePercentage,
  employerPercentage
) => {
  const employeeContribution = (salary * employeePercentage) / 100;
  const employerContribution = (salary * employerPercentage) / 100;
  const totalContribution = employeeContribution + employerContribution;

  return {
    employeeContribution,
    employerContribution,
    totalContribution,
  };
};

// API to get attendance for a specific date
exports.getStaffAttendanceForDate = (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: "Date is required" });
  }

  // Step 1: Query attendance records for staff based on the date
  const attendanceQuery = `
    SELECT 
      s.id AS staff_id, 
      s.name, 
      s.designation, 
      a.status, 
      a.date
    FROM staff_attendance a
    JOIN staff s ON a.staff_id = s.id
    WHERE DATE(a.date) = ?`;

  db.query(attendanceQuery, [date], (err, attendanceRecords) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to fetch staff attendance records",
        error: err,
      });
    }

    if (attendanceRecords.length === 0) {
      return res
        .status(404)
        .json({ message: "No attendance records found for the given date" });
    }

    // Construct the response
    res.status(200).json(attendanceRecords);
  });
};

// API to get the staff list
exports.getStaffList = async (req, res) => {
  const getStaffQuery = `SELECT * FROM staff`;

  try {
    const staffList = await db.seqeulize.query(getStaffQuery, {
      type: db.Sequelize.QueryTypes.SELECT, // Correct query type
    });

    if (staffList.length === 0) {
      return res.status(404).json({ message: "No staff members found" });
    }

    res.status(200).json(staffList);
  } catch (error) {
    console.error("Error fetching staff list:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch staff list", error: error.message });
  }
};

// Fetch EPF balance for a specific staff member
exports.getStaffEPFDetails = (req, res) => {
  const { staffId } = req.params;

  const query = `SELECT epf_number, epf_balance, epf_last_contribution FROM staff WHERE id = ?`;

  db.query(query, [staffId], (err, epfDetails) => {
    if (err) {
      return res.status(500).json({ message: "Failed to fetch EPF details" });
    }

    if (!epfDetails.length) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.status(200).json(epfDetails[0]);
  });
};

// Bulk add staff members
exports.addBulkStaff = (req, res) => {
  const staffList = req.body.staffList;

  if (!Array.isArray(staffList) || staffList.length === 0) {
    return res
      .status(400)
      .json({ message: "Staff list is required and should be an array" });
  }

  const insertStaffQuery = `
        INSERT INTO staff (name, gender, designation, monthly_salary, daily_salary, total_paid_leaves, epf_number, epf_employee_percentage, epf_employer_percentage, hire_date)
        VALUES ?
    `;

  // Prepare bulk insert values
  const staffValues = staffList.map((staff) => [
    staff.name,
    staff.gender,
    staff.designation,
    staff.monthlySalary,
    staff.dailySalary,
    staff.totalPaidLeaves || 0,
    staff.epfNumber || null,
    staff.epfEmployeePercentage || 12, // Default to 12%
    staff.epfEmployerPercentage || 12, // Default to 12%
    staff.hireDate || new Date(), // Use current date if not provided
  ]);

  db.query(insertStaffQuery, [staffValues], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to add staff in bulk", error: err });
    }

    res.status(200).json({
      message: "Bulk staff added successfully",
      affectedRows: result.affectedRows,
    });
  });
};

// Add a single staff member
exports.addSingleStaff = async (req, res) => {
  const { name, gender, designation, epf_number, hire_date } = req.body;
  console.log(req.body);

  // Ensure all required fields are provided
  if (!name || !gender || !designation) {
    return res.status(400).json({ message: "All required fields are missing" });
  }

  const insertStaffQuery = `
    INSERT INTO staff (name, gender, designation, epf_number, hire_date)
    VALUES (?, ?, ?, ?, ?)
  `;

  try {
    // Await the result of the query with correct spelling of sequelize
    const result = await db.seqeulize.query(insertStaffQuery, {
      replacements: [name, gender, designation, epf_number, hire_date],
      type: db.Sequelize.QueryTypes.INSERT,
    });

    res.status(200).json({
      message: "Staff added successfully",
      staffId: result[0], // result[0] holds the inserted ID
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Failed to add staff", error: err.message });
  }
};

exports.getMonthlyStaffAttendance = (req, res) => {
  const { month, year } = req.query;

  try {
    // Validate input
    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    // Step 1: Query attendance records for staff based on the month and year
    const attendanceQuery = `
            SELECT 
                s.id AS staff_id, 
                s.name, 
                s.designation, 
                s.daily_salary, 
                s.epf_employee_percentage, 
                s.epf_employer_percentage, 
                a.status, 
                a.date
            FROM staff_attendance a
            JOIN staff s ON a.staff_id = s.id
            WHERE MONTH(a.date) = ? AND YEAR(a.date) = ?`;

    db.query(attendanceQuery, [month, year], (err, attendanceRecords) => {
      if (err) {
        console.error("Error fetching monthly staff attendance records:", err);
        return res
          .status(500)
          .json({ message: "Failed to fetch staff attendance records" });
      }

      if (attendanceRecords.length === 0) {
        return res.status(404).json({
          message: "No attendance records found for the given month and year",
        });
      }

      // Step 2: Group attendance by staff
      const staffAttendanceMap = {};

      attendanceRecords.forEach((record) => {
        if (!staffAttendanceMap[record.staff_id]) {
          staffAttendanceMap[record.staff_id] = {
            staff_id: record.staff_id,
            name: record.name,
            designation: record.designation,
            daily_salary: parseFloat(record.daily_salary), // Ensure it's a number
            epf_employee_percentage: parseFloat(record.epf_employee_percentage), // Convert to float
            epf_employer_percentage: parseFloat(record.epf_employer_percentage), // Convert to float
            attendance: [],
            present_days: 0,
            total_salary: 0,
            epf_employee: 0,
            epf_employer: 0,
            net_salary: 0,
          };
        }

        // Add attendance record
        staffAttendanceMap[record.staff_id].attendance.push({
          date: record.date,
          status: record.status,
        });

        // Count the number of present days and calculate total salary
        // Normalize attendance status to lowercase and check for "present"
        if (record.status.toLowerCase() === "present") {
          staffAttendanceMap[record.staff_id].present_days += 1;
          staffAttendanceMap[record.staff_id].total_salary +=
            staffAttendanceMap[record.staff_id].daily_salary;
        }
      });

      // Step 3: Calculate EPF and Net Salary
      Object.keys(staffAttendanceMap).forEach((staffId) => {
        const staff = staffAttendanceMap[staffId];

        // Calculate EPF (based on the employee's share)
        staff.epf_employee =
          (staff.total_salary * staff.epf_employee_percentage) / 100;
        staff.epf_employer =
          (staff.total_salary * staff.epf_employer_percentage) / 100;

        // Calculate Net Salary (after deducting employee EPF)
        staff.net_salary = staff.total_salary - staff.epf_employee;
      });

      // Step 4: Construct the response as an array of staff attendance details
      const response = Object.values(staffAttendanceMap);

      res.status(200).json(response);
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ message: "An unexpected error occurred" });
  }
};
