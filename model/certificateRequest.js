module.exports = (sequelize, DataTypes) => {
  const Certificate_request = sequelize.define(
    "Certificate_request",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "",
      timestamps: false,
    }
  );

  return Certificate_request;
};
