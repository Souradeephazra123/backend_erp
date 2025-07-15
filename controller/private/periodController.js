const Period = require("../../model/periodModel");

// Controller for creating a period
exports.createPeriod = async (req, res) => {
  const { period_name, day, subject_id, class_id } = req.body;

  try {
    const result = await Period.create(period_name, day, subject_id, class_id);
    res.status(201).json({
      message: "Period created successfully",
      periodId: result.insertId,
    });
  } catch (err) {
    console.error("Failed to create period:", err);
    res.status(500).json({ message: "Failed to create period" });
  }
};

// Controller for getting all periods
exports.getAllPeriods = async (req, res) => {
  try {
    const result = await Period.getAll();
    res.status(200).json(result);
  } catch (err) {
    console.error("Failed to fetch periods:", err);
    res.status(500).json({ message: "Failed to fetch periods" });
  }
};
