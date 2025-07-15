module.exports = (sequelize, DataTypes) => {
  const FeeCategory = sequelize.define(
    "FeeCategory",
    {
      category_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      category_name: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
    },
    {
      tableName: "FeeCategories",
      timestamps: false,
    }
  );

  return FeeCategory;
};
