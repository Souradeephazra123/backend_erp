module.exports = (sequelize, DataTypes) => {
  const PaymentApproval = sequelize.define("PaymentApproval", {
    PaymentApproval_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "students",
        key: "id",
      },
    },
    fee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Fees",
        key: "fee_id",
      },
    },
    payment_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    month: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
  });

  return PaymentApproval;
};
