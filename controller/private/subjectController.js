// controllers/subjectController.js
const Subject = require("../../model/subjectModel");

// Create a new subject
exports.createSubject = (req, res) => {
  const { subject_name, class_id } = req.body;
  if (!subject_name || !class_id)
    return res
      .status(400)
      .json({ message: "Subject name and class ID are required" });

  Subject.createSubject(subject_name, class_id, (err, result) => {
    if (err)
      return res.status(500).json({ message: "Failed to create subject" });
    res.status(201).json({
      message: "Subject created successfully",
      subjectId: result.insertId,
    });
  });
};

// Get all subjects
exports.getAllSubjects = (req, res) => {
  Subject.getAllSubjects((err, results) => {
    if (err)
      return res.status(500).json({ message: "Failed to retrieve subjects" });
    res.status(200).json(results);
  });
};
