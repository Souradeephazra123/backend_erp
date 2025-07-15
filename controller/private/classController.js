const Class = require("../../model/classModel");
const Division = require("../../model/divisionModel");
const db = require("../../config/dbConfig");
const { QueryTypes } = require("sequelize");
const Student = db.Student;

// Create a new class
exports.createClass = async (req, res) => {
  const { class_name } = req.body;
  if (!class_name) {
    return res.status(400).json({ message: "Class name is required" });
  }

  try {
    const result = await Class.createClass(class_name);
    res.status(201).json({
      message: "Class created successfully",
      classId: result.insertId,
    });
  } catch (err) {
    console.error("Failed to create class:", err);
    res.status(500).json({ message: "Failed to create class" });
  }
};

// Get all classes
exports.getAllClasses = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "school_id is required" });
    }

    // Query the database with the school_id filter
    const sql = "SELECT * FROM classes WHERE school_id = :id";
    const data = await db.seqeulize.query(sql, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    console.log(data);
    res.status(200).json(data);
  } catch (err) {
    console.error("Failed to retrieve classes:", err);
    res.status(500).json({ message: "Failed to retrieve classes" });
  }
};

// Create a new division
exports.createDivision = async (req, res) => {
  const { division_name, class_id } = req.body;
  console.log(req.body);
  if (!division_name || !class_id) {
    return res
      .status(400)
      .json({ message: "Division name and class id are required" });
  }

  try {
    const result = await Division.createDivision(division_name, class_id);
    res.status(201).json({
      message: "Division created successfully",
      divisionId: result.insertId,
    });
  } catch (err) {
    console.error("Failed to create division:", err);
    res.status(500).json({ message: "Failed to create division" });
  }
};

// Get divisions for a specific class
exports.getDivisions = async (req, res) => {
  try {
    const { classId } = req.params;
    console.log(classId);

    const sql = "SELECT * FROM divisions WHERE class_id = :classId";

    const data = await db.seqeulize.query(sql, {
      replacements: { classId }, // Use named replacements
      type: db.Sequelize.QueryTypes.SELECT,
    });
    console.log(data);
    res.status(200).json(data);
  } catch (err) {
    console.error("Failed to fetch divisions:", err);
    res.status(500).json({ message: "Failed to fetch divisions" });
  }
};

exports.getDivision = async (req, res) => {
  try {
    const sql = "SELECT * FROM divisions";

    const data = await db.seqeulize.query(sql, {
      // Use named replacements
      type: db.Sequelize.QueryTypes.SELECT,
    });
    console.log(data);
    res.status(200).json(data);
  } catch (err) {
    console.error("Failed to fetch divisions:", err);
    res.status(500).json({ message: "Failed to fetch divisions" });
  }
};
exports.getSaff = async (req, res) => {
  try {
    const sql = "SELECT * FROM staff";

    const data = await db.seqeulize.query(sql, {
      type: db.Sequelize.QueryTypes.SELECT,
    });
    console.log(data);
    res.status(200).json(data);
  } catch (err) {
    console.error("Failed to fetch divisions:", err);
    res.status(500).json({ message: "Failed to fetch staff" });
  }
};

const getStudentsByClassAndDivisions = async (classId, divisionId) => {
  const query = `
    SELECT students.* 
    FROM students
    JOIN classes ON students.class_id = classes.id
    JOIN divisions ON students.division_id = divisions.id
    WHERE students.class_id = ? AND students.division_id = ?
  `;

  try {
    const results = await db.seqeulize.query(query, {
      replacements: [classId, divisionId],
      type: db.seqeulize.QueryTypes.SELECT,
    });
    console.log(results);
    return results;
  } catch (err) {
    throw new Error(`Failed to fetch students: ${err.message}`);
  }
};

exports.getStudentsByClassAndDivision = async (req, res) => {
  try {
    const { classId, divisionId } = req.params;

    if (!classId || !divisionId) {
      return res
        .status(400)
        .json({ message: "Class ID and Division ID are required" });
    }

    const students = await getStudentsByClassAndDivisions(classId, divisionId);

    if (students.length === 0) {
      return res.status(404).json({
        message: "No students found in the specified class and division",
      });
    }

    res.status(200).json(students);
  } catch (err) {
    console.error("Failed to retrieve students:", err);
    res.status(500).json({ message: "Failed to retrieve students" });
  }
};
const getStudentsByClassAndDivisionsFilter = async (
  classId,
  divisionId,
  filter
) => {
  const query = `
    SELECT students.* 
    FROM students
    JOIN classes ON students.class_id = classes.id
    JOIN divisions ON students.division_id = divisions.id
    WHERE students.class_id = ? AND students.division_id = ?
  `;

  try {
    const results = await db.seqeulize.query(query, {
      replacements: [classId, divisionId],
      type: db.seqeulize.QueryTypes.SELECT,
    });
    console.log(results);
    return results;
  } catch (err) {
    throw new Error(`Failed to fetch students: ${err.message}`);
  }
};
exports.getStudentsByClassAndDivisionFilter = async (req, res) => {
  try {
    const { classId, divisionId, filter } = req.params;

    if (!classId || !divisionId) {
      return res
        .status(400)
        .json({ message: "Class ID and Division ID are required" });
    }

    const students = await getStudentsByClassAndDivisionsFilter(
      classId,
      divisionId,
      filter
    );

    if (students.length === 0) {
      return res.status(404).json({
        message: "No students found in the specified class and division",
      });
    }

    res.status(200).json(students);
  } catch (err) {
    console.error("Failed to retrieve students:", err);
    res.status(500).json({ message: "Failed to retrieve students" });
  }
};
