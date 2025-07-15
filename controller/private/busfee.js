const { QueryTypes } = require("sequelize");
const db = require("../../config/dbConfig");

const createBusRoute = async (req, res) => {
  try {
    const { route_name, yearly_fee } = req.body;

    if (!route_name || !yearly_fee) {
      return res
        .status(400)
        .json({ message: "Route name and yearly fee are required." });
    }

    const query = `
        INSERT INTO bus_route (route_name, yearly_fee)
        VALUES (:route_name, :yearly_fee)
      `;

    await db.seqeulize.query(query, {
      replacements: { route_name, yearly_fee },
    });

    res.status(201).json({ message: "Bus route created successfully." });
  } catch (error) {
    console.error("Error creating bus route:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getBusRoutes = async (req, res) => {
  try {
    const query = `
  SELECT 
    id, 
    CONCAT(CONVERT(route_name USING utf8mb4), ' - ₹ ', yearly_fee) AS route_info,
    route_name,
    yearly_fee
FROM bus_route;
      `;

    const busRoutes = await db.seqeulize.query(query, {
      type: QueryTypes.SELECT,
    });

    if (busRoutes.length === 0) {
      return res.status(404).json({ message: "No bus routes found." });
    }

    res.json(busRoutes);
  } catch (error) {
    console.error("Error fetching bus routes:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const createFeeCollection = async (req, res) => {
  try {
    const { student_id, route_id, payment_month, paid_amount } = req.body;
    console.log(req.body);

    if (!student_id || !route_id || !payment_month || !paid_amount) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const query = `
        INSERT INTO bus_route_fee_collection (student_id, route_id, payment_month, paid_amount)
        VALUES (:student_id, :route_id, :payment_month, :paid_amount)
      `;

    await db.seqeulize.query(query, {
      replacements: { student_id, route_id, payment_month, paid_amount },
    });

    res
      .status(201)
      .json({ message: "Fee collection entry created successfully." });
  } catch (error) {
    console.error("Error creating fee collection entry:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getFeeCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
        SELECT 
          bfc.id AS payment_id, 
          bfc.student_id, 
          bfc.route_id, 
          bfc.payment_month, 
          bfc.paid_amount, 
          br.route_name, 
          br.yearly_fee
        FROM bus_route_fee_collection bfc
        JOIN bus_route br ON bfc.route_id = br.id
        WHERE bfc.student_id = :id
      `;

    const feeCollection = await db.seqeulize.query(query, {
      type: QueryTypes.SELECT,
      replacements: { id },
    });

    if (feeCollection.length === 0) {
      return res
        .status(404)
        .json({ message: "No fee collection records found for the student." });
    }

    res.json(feeCollection);
  } catch (error) {
    console.error("Error fetching fee collection records:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const getStudentsByRoute = async (req, res) => {
  try {
    const { route_id } = req.query;

    if (!route_id) {
      return res.status(400).json({ message: "Route ID is required." });
    }

    // Query to fetch students based on the route_id
    const query = `
        SELECT s.id, s.firstName, s.lastName 
        FROM students s 
        WHERE s.bus_route_id = :route_id
      `;

    // Execute query with the route_id
    const students = await db.seqeulize.query(query, {
      type: QueryTypes.SELECT,
      replacements: { route_id },
    });

    // If no students are found
    if (students.length === 0) {
      return res.status(200).json(students);
    }

    // Send the list of students as response
    res.json(students);
  } catch (error) {
    console.error("Error fetching students by route:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getTransactionsByStudentId = async (req, res) => {
  const { student_id } = req.query;

  if (!student_id) {
    return res.status(400).json({ message: "Student ID is required." });
  }

  try {
    // Query the database for transactions related to the student ID
    const transactions = await db.seqeulize.query(
      `
      SELECT 
        t.id AS transaction_id,
        t.paid_amount,
        t.payment_month,
        s.firstName,
        s.lastName,
        t.payment_date
      FROM 
        bus_route_fee_collection t
      INNER JOIN 
        students s ON t.student_id = s.id
      WHERE 
        t.student_id = :student_id
      order BY t.payment_date DESC;
      `,
      {
        replacements: { student_id },
        type: db.seqeulize.QueryTypes.SELECT,
      }
    );

    if (transactions.length === 0) {
      return res.status(200).json(transactions);
    }

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching transactions." });
  }
};

module.exports = {
  getStudentsByRoute,
  createBusRoute,
  getBusRoutes,
  createFeeCollection,
  getFeeCollection,
  getTransactionsByStudentId,
};
