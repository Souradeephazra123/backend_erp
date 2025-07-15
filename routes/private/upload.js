const express = require("express");
const router = express.Router();
const { upload, uploadPhoto } = require("../../controller/private/uploadphoto");

// Route for uploading a photo
router.post("/upload-photo", upload.single("photo"), uploadPhoto);

module.exports = router;
