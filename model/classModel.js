// models/classModel.js
const db = require("../config/dbConfig");
const { QueryTypes } = require("sequelize");

exports.createClass = (class_name, callback) => {
  const sql = "INSERT INTO classes (class_name) VALUES (?)";
  db.query(sql, [class_name], callback);
};

exports.getAllClasses = async (callback) => {
  const sql = "SELECT * FROM classes";
  const data = await db.seqeulize.query("SELECT * FROM classes", {
    type: QueryTypes.SELECT,
  });
  console.log(data);
};
