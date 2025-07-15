module.exports = (sequelize, DataTypes) => {
  const Revenue = sequelize.define("Revenue", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    expenditure: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    revenue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  });

  return Revenue;
};
