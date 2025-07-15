module.exports = (sequelize, DataTypes) => {
  const FeeSubCategory = sequelize.define(
    "FeeSubCategory",
    {
      subcategory_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      subcategory_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "FeeCategories",
          key: "category_id",
        },
      },
      class_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      fee_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      monthly_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      year_session: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "FeeSubCategories",
      timestamps: false,
    }
  );

  FeeSubCategory.associate = (models) => {
    FeeSubCategory.belongsTo(models.FeeCategory, {
      foreignKey: "category_id",
    });
  };

  return FeeSubCategory;
};
