module.exports = (sequelize, DataTypes) => {
  
  const Fee = sequelize.define(
    "Fee",
    {
      fee_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      fee_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          isGreaterThanOrEqualToPay(value, { pay }) {
            if (value < pay) {
              throw new Error(
                "Fee amount should be greater than or equal to pay"
              );
            }
          },
        },
      },
      subcategory_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "FeeSubCategories",
          key: "subcategory_id",
        },
      },
      student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "students",
          key: "id",
        },
      },
      pay: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },

      discount_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Discounts",
          key: "discount_id",
        },
      },

      isActive: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
        validate: {
          isBoolean: true,
        },
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Store additional information like late fee details"
      },
    },
    {
      tableName: "Fees",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["student_id", "subcategory_id"],
        },
      ],
    }
  );

  Fee.associate = (models) => {
    Fee.belongsTo(models.FeeSubCategory, {
      foreignKey: "subcategory_id",
    });
    Fee.belongsTo(models.Student, {
      foreignKey: "student_id",
    });
    Fee.belongsTo(models.Discount, {
      foreignKey: "discount_id",
    });
  };

  return Fee;
};
