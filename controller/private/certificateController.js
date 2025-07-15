const db = require('../../config/dbConfig');

// certificate model
const Certificate = db.Certificate;
const InitialCertificateId = 1000;
// getCertificateId
module.exports.getCertificateId = async (req, res) => {
    try {
        const maxCertificateId = await Certificate.max('certificateId');

        if (maxCertificateId === null) {
            // return res.status(404).send({ certificateId: InitialCertificateId });
            return InitialCertificateId;
        }


        // return res.status(200).send({ certificateId: maxCertificateId+1 });
        return maxCertificateId + 1
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Something wrong in certificate' });
    }
};


