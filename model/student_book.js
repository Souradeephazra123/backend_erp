module.exports = (sequelize, Sequelize) => {
  const StudentBook = sequelize.define(
    "student_book",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "students",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      book_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "books",
          key: "id",
        },
        onDelete: "CASCADE", // Deletes related rows if book is deleted
      },
      issuedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      returnedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("IN", "OUT"),
        allowNull: false,
      },
    },
    {
      timestamps: true,
    }
  );

  return StudentBook;
};
