const CertificateType = ['Cerificate1', 'Cerificate2', 'Certificate3']
// for certificateId
const InitialAutoIncrement = 1000;
module.exports = (sequelize, Sequelize) => {
    const Certificate = sequelize.define('Certificate', {
        certificateId: {
            type: Sequelize.INTEGER,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
        },
        type: {
            type: Sequelize.ENUM,
            values: CertificateType,

        },
        reason:{
            type: Sequelize.STRING,
            allowNullValues: false,
        },
        studentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
    }, {
        initialAutoIncrement: InitialAutoIncrement,
    });

    return Certificate;
};

