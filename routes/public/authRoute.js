const express = require('express');
const authController = require('../../controller/public/authController');

const router = express.Router();
const prefix = '/api/auth';
router.post(`${prefix}/register`, authController.register);
router.post(`${prefix}/login`, authController.login);
router.post(`${prefix}/refresh-token`, authController.refreshToken);

module.exports = router;
