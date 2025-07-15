// controllers/certificateRequestController.js
const db = require("../../config/dbConfig");
const { QueryTypes } = require("sequelize");
const CertificateRequest = db.Certificate_request;

// Add a new certificate request
const addCertificateRequest = async (req, res) => {
  const { name, status, student_id } = req.body;
  console.log(name, status, student_id);

  try {
    const newRequest = await CertificateRequest.create({
      name,
      status,
      student_id,
    });
    res.status(201).json({
      message: "Certificate request created successfully",
      data: newRequest,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating certificate request",
      error: error.message,
    });
  }
};

// Get all certificate requests
const getCertificateRequests = async (req, res) => {
  try {
    const requests = await CertificateRequest.findAll();
    res.status(200).json({ data: requests });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving certificate requests",
      error: error.message,
    });
  }
};

module.exports = {
  addCertificateRequest,
  getCertificateRequests,
};
