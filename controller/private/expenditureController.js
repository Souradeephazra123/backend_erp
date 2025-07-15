const db = require("../../config/dbConfig");
const Expenditure = db.Expenditure;

const getExpenditures = async (req, res) => {
  try {
    const expenditures = await Expenditure.findAll();

    if (!expenditures) {
      return res.status(404).json({ error: "No expenditures found." });
    }

    res.status(200).json(expenditures);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching expenditures." });
  }
};

const addExpenditure = async (req, res) => {
  try {
    const { expenditureType, description, amount, date, Name } = req.body;

    const newExpenditure = await Expenditure.create({
      expenditureType,
      description,
      amount,
      date,
      Name,
    });

    res
      .status(201)
      .json({ message: "Expenditure created successfully.", newExpenditure });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while adding expenditure." });
  }
};

const editExpenditure = async (req, res) => {
  try {
    const { id } = req.params;
    const { expenditureType, description, amount, date, Name } = req.body;

    const expenditure = await Expenditure.findByPk(id);

    if (!expenditure) {
      return res.status(404).json({ message: "Expenditure not found." });
    }

    await expenditure.update({
      expenditureType,
      description,
      amount,
      date,
      Name,
    });

    res
      .status(200)
      .json({ message: "Expenditure updated successfully.", expenditure });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while updating expenditure." });
  }
};
const deleteExpenditure = async (req, res) => {
  try {
    const { id } = req.params;

    const expenditure = await Expenditure.findByPk(id);

    if (!expenditure) {
      return res.status(404).json({ message: "Expenditure not found." });
    }

    await expenditure.destroy();

    res.status(200).json({ message: "Expenditure deleted successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while deleting expenditure." });
  }
};

module.exports = {
  getExpenditures,
  addExpenditure,
  editExpenditure,
  deleteExpenditure,
};
