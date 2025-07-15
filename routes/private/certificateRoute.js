const express = require('express')
const router = express.Router();
const certificateController = require('../../controller/private/certificateController');
//bonafide certificate
router.get('/bonafide_certificate',certificateController.getCertificateId);



module.exports = router;