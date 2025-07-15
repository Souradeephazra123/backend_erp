module.exports = (sequelize, Sequelize) => {
  const Address = sequelize.define("address", {
    id: {
      type: Sequelize.INTEGER,
      unique: true,
      primaryKey: true,
      // references: {
      //     model: 'students',
      //     key: 'id',
      // },
    },
    profile: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    presentAddress: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    permanentAddress: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    taluka: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "",
    },
    city: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    district: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    state: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    pincode: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        isNumeric: true,
      },
    },
    country: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  });
  return Address;
};
