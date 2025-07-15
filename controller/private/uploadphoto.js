const path = require("path");
const multer = require("multer");
const db = require("../../config/dbConfig");
const Student = db.Student;

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/images"); // Upload directory
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Controller to handle image upload
const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { id } = req.body; // Assuming the student's ID is sent in the body
    const photoUrl = `/uploads/${req.file.filename}`;

    // Update the student's photo URL in the database
    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.photo = photoUrl;
    await student.save();

    res.status(200).json({ message: "Photo uploaded successfully", photoUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { upload, uploadPhoto };
