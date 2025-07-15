const db = require("../../config/dbConfig");
const StudentBook = db.StudentBook;
const Student = db.Student;
const Book = db.Book;
const { QueryTypes } = require("sequelize");
const sequelize = db.seqeulize;
// Ensure sequelize is properly imported

const getStudentBooks = async (req, res) => {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        sb.id,
        CONCAT(s.firstName, ' ', s.lastName) AS student_name,
        b.title AS book_name,
        sb.issuedAt,
        sb.returnedAt,
        sb.status
      FROM student_books sb
      JOIN students s ON sb.student_id = s.id
      JOIN books b ON sb.book_id = b.id
    `);

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const issueBook = async (req, res) => {
  try {
    const { student_id, book_id, issuedAt } = req.body;

    // Fetch the book to check availability
    const book = await Book.findByPk(book_id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Check if there are enough available copies of the book
    if (book.numberofbooks <= 0) {
      return res.status(400).json({ message: "Book is unavailable" });
    }

    // Issue the book and reduce the number of available books
    const newStudentBook = await StudentBook.create({
      student_id,
      book_id,
      issuedAt,
      status: "OUT",
    });

    // Update the number of available books

    book.numberofbooks -= 1;
    console.log(book);
    if (book.numberofbooks == 0) {
      book.status = "unavailable";
    }
    await book.save();

    res.status(201).json(newStudentBook);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const returnBook = async (req, res) => {
  try {
    const { id, returnedAt } = req.body;

    // Find the issued book record by its ID
    const studentBook = await StudentBook.findByPk(id);

    if (!studentBook) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Ensure the book is currently issued (status: OUT)
    if (studentBook.status !== "OUT") {
      return res.status(400).json({ message: "Book is not currently issued" });
    }

    // Find the book associated with the student book record
    const book = await Book.findByPk(studentBook.book_id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Update the status of the studentBook to 'IN' and set the return date
    studentBook.returnedAt = returnedAt;
    studentBook.status = "IN";
    await studentBook.save();

    // Increment the number of available books
    book.numberofbooks += 1;
    await book.save();

    res.json(studentBook);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStudentBooks, issueBook, returnBook };
