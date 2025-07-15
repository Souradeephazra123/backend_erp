const db = require("../config/dbConfig");

// Model for fetching students based on class and division
exports.getStudents = (className, division, callback) => {
  const sql = "SELECT * FROM students WHERE class = ? AND division = ?";
  db.query(sql, [className, division], callback); // Pass parameters to prevent SQL injection
};

// Model for saving attendance data
exports.save = (attendanceData, callback) => {
  const sql =
    "INSERT INTO attendance (student_id, period_id, date, status) VALUES ?";
  db.query(sql, [attendanceData], callback);
};

// Model to fetch attendance list based on classId, periodId, and divisionId
exports.getAttendanceList = (classId, periodId, divisionId, callback) => {
  const sql = `
    SELECT 
      s.id AS student_id, 
      s.firstName, 
      s.middleName, 
      s.lastName, 
      p.period_name, 
      sub.subject_name, 
      s.class 
    FROM 
      students s 
    JOIN 
      periods p ON p.id = ? 
    JOIN 
      subjects sub ON sub.id = p.subject_id 
    WHERE 
      s.class = ? AND 
      s.division = ?`;

  db.query(sql, [periodId, classId, divisionId], callback); // Prevent SQL injection by using placeholders
};
