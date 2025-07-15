const db = require("../config/dbConfig");

// Model for creating a period
exports.create = (period_name, day, subject_id, class_id, callback) => {
  const sql =
    "INSERT INTO periods (period_name, day, subject_id, class_id) VALUES (?, ?, ?, ?)";
  db.query(sql, [period_name, day, subject_id, class_id], callback);
};

exports.getAll = (callback) => {
  const sql = "SELECT * FROM periods";
  db.query(sql, callback);
};
