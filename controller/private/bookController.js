const db = require("../../config/dbConfig");
const Book = db.Book;

// Get all books
const getBooks = async (req, res) => {
  try {
    // Fetch all books from the database
    let books = await Book.findAll();

    // Iterate over each book and update its status based on the number of available copies
    books = books.map((book) => {
      if (book.numberofbooks > 0) {
        book.status = "available";
      } else {
        book.status = "unavailable";
      }
      return book;
    });

    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getBook = async (req, res) => {
  try {
    // Fetch only available books from the database
    let books = await Book.findAll({
      where: {
        status: "available", // Only select books with status "available"
      },
    });

    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a new book
const addBook = async (req, res) => {
  const {
    title,
    author,
    isbn,
    publisher,
    publicationYear,
    category,
    numberofbooks,
  } = req.body;

  try {
    const newBook = await Book.create({
      title,
      author,
      isbn,
      publisher,
      publicationYear,
      category,
      numberofbooks,
    });
    res.status(201).json(newBook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Edit a book
const editBook = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    author,
    isbn,
    publisher,
    publicationYear,
    category,
    status,
    numberofbooks,
  } = req.body;

  try {
    const book = await Book.findByPk(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    book.title = title || book.title;
    book.author = author || book.author;
    book.isbn = isbn || book.isbn;
    book.publisher = publisher || book.publisher;
    book.publicationYear = publicationYear || book.publicationYear;
    book.category = category || book.category;
    book.status = status || book.status;
    book.numberofbooks = numberofbooks || book.numberofbooks;

    await book.save();
    res.json(book);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a book
const deleteBook = async (req, res) => {
  const { id } = req.params;

  try {
    const book = await Book.findByPk(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    await book.destroy();
    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBooks, addBook, editBook, deleteBook, getBook };
