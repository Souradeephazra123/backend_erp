// const multer = require('multer');
// // Set up storage for Multer
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/');
//     },
//     filename: (req, file, cb) => {
//         cb(null, `${Date.now()}-${file.originalname}`);
//     },
// });

// const upload = multer({ storage });

// module.exports = upload;

const multer = require("multer");
// const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create different subdirectories based on file type
    let folder = "uploads/others/";
    if (file.mimetype.startsWith("image/")) {
      folder = "uploads/images/";
    } else if (file.mimetype === "application/pdf") {
      folder = "uploads/documents/";
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

module.exports = upload;
