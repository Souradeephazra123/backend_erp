module.exports = (sequelize, DataTypes) => {
  const Discount = sequelize.define(
    "Discounts",
    {
      discount_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      fee_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Fees",
          key: "fee_id",
        },
      },
      discount_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      discount_reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "Discounts",
      timestamps: false,
    }
  );

  Discount.associate = (models) => {
    Discount.belongsTo(models.StudentFee, { foreignKey: "student_fee_id" });
  };

  return Discount;
};
