const db = require("../config/dbConfig"); // Import the DB connection

// Model to add a new division
exports.createDivision = (division_name, class_id, callback) => {
  const sql = "INSERT INTO divisions (division_name, class_id) VALUES (?, ?)";
  const values = [division_name, class_id];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error executing query:", err); // Log the error
      return callback(err, null);
    }
    callback(null, result); // Return the result if no error
  });
};

exports.getDivisions = (class_id, callback) => {
  const sql = "SELECT * FROM divisions WHERE class_id = ?";
  db.query(sql, class_id, callback);
};
