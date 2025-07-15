module.exports = (sequelize, Sequelize) => {
  const Book = sequelize.define(
    "book",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      author: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      publisher: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      publicationYear: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          len: [4, 4],
        },
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("available", "unavailable"),
        allowNull: false,
        defaultValue: "available",
      },
      numberofbooks: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
    },
    {
      timestamps: true,
    }
  );

  return Book;
};
