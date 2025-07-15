// models/subjectModel.js
const db = require("../config/dbConfig");

exports.createSubject = (subject_name, class_id, callback) => {
  const sql = "INSERT INTO subjects (subject_name, class_id) VALUES (?, ?)";
  db.query(sql, [subject_name, class_id], callback);
};

exports.getAllSubjects = (callback) => {
  const sql =
    "SELECT subjects.*, classes.class_name FROM subjects JOIN classes ON subjects.class_id = classes.id";
  console.log(sql);
  db.query(sql, callback);
};
