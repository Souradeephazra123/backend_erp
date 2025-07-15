require("dotenv").config();

const db = require("./config/dbConfig");
const PORT = process.env.PORT || 8000;

const app = require("./routes/route");
const cors = require("cors");
const fs = require("fs");
const { createObjectCsvWriter } = require("csv-writer");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const { Op } = require("sequelize");
const multer = require("multer");
const XLSX = require("xlsx");
const Student = db.Student;

const { QueryTypes } = require("sequelize");

const { Sequelize } = require("sequelize");

const Expenditure = db.Expenditure;
const PaymentHistory = db.FeeHistory;

const moment = require("moment");

const path = require("path");

app.use(cors());

// create table if not exist
// db.seqeulize.sync();
let feesData = [];

// Route to get all fees or filter by section
app.get("/api/fees", (req, res) => {
  const { section } = req.query;

  if (section === "All" || !section) {
    return res.json(feesData);
  }

  const filteredFees = feesData.filter((fee) => fee.section === section);
  res.json(filteredFees);
});

// Route to add new fee
app.post("/api/fees", (req, res) => {
  const { section, filter, amount } = req.body;

  if (!section || !filter || !amount) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const newFee = {
    id: feesData.length + 1,
    section,
    filter,
    amount: parseFloat(amount),
  };

  feesData.push(newFee);
  res.status(201).json(newFee);
});

// Route to generate and download the Income Tax Certificate
app.get("/api/tax-certificate", (req, res) => {
  const certificatePath = path.join(__dirname, "Income_Tax_Certificate.pdf");

  // You can generate a real PDF file dynamically or serve a static one
  if (fs.existsSync(certificatePath)) {
    res.download(certificatePath, "Income_Tax_Certificate.pdf");
  } else {
    res.status(404).send("Income Tax Certificate not found");
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "info.fitespero@gmail.com",
    pass: "lkgm unpx hhpt mkeh",
  },
});

const sendDailyReport = async () => {
  const startDate = moment().subtract(1, "days").set({ hour: 12, minute: 33 });
  const endDate = moment().set({ hour: 12, minute: 33 });

  try {
    // Get total expenditures in the last 24 hours
    const expenditureByType = await Expenditure.findAll({
      attributes: [
        "expenditureType",
        [Sequelize.fn("SUM", Sequelize.col("amount")), "totalAmount"],
      ],
      where: {
        date: {
          [Op.between]: [startDate.toDate(), endDate.toDate()],
        },
      },
      group: ["expenditureType"],
    });

    // Get total fees collected in the last 24 hours
    console.log(`Total fees collected`, startDate.toDate(), endDate.toDate());
    const totalFeesCollected = await PaymentHistory.sum("payment_amount", {
      where: {
        payment_date: {
          [Op.between]: [startDate.toDate(), endDate.toDate()],
        },
      },
    });
    let expenditureDetails = "Total Expenditure in the last 24 hours:\n";
    expenditureByType.forEach((expenditure) => {
      expenditureDetails += `${expenditure.expenditureType}: ₹${expenditure.dataValues.totalAmount}\n`;
    });

    // Email content
    const mailOptions = {
      from: "info.fitespero@gmail.com", // Sender address
      to: "yashvarshney7011@gmail.com", // Receiver address
      subject: "Daily Expense and Fee Collection Report",
      text: `${expenditureDetails}\nTotal Fees Collected in the last 24 hours: ₹${totalFeesCollected}`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log("Daily report email sent successfully!");
  } catch (error) {
    console.error("Error sending daily report email:", error);
  }
};

const sendDaily = async () => {
  try {
    console.log("Calculating daily expenditures and revenues...");

    // SQL Query to calculate and store the report
    const query = `
          INSERT INTO Revenues (expenditure, revenue, date, createdAt, updatedAt)
          SELECT 
              (SELECT IFNULL(SUM(amount), 0) 
               FROM expenditures 
               WHERE DATE(date) = CURDATE()) AS total_expenditure,
              (SELECT IFNULL(SUM(payment_amount), 0) 
               FROM PaymentHistory 
               WHERE DATE(payment_date) = CURDATE()) AS total_revenue,
              CURDATE() AS report_date,
              NOW() AS createdAt,
              NOW() AS updatedAt;
      `;

    // Execute the query
    const [results] = await db.seqeulize.query(query);
    console.log("Daily report successfully stored.");

    // Retrieve today's totals for email content
    const totalsQuery = `
      SELECT 
        expenditure, 
        revenue 
      FROM Revenues 
      WHERE date = CURDATE() 
      ORDER BY createdAt DESC LIMIT 1;
    `;

    const [totals] = await db.seqeulize.query(totalsQuery);
    const { expenditure, revenue } = totals[0];

    console.log(`Expenditure: ${expenditure}, Revenue: ${revenue}`);

    // Send the email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "info.dmcbgh@gmail.com",
        pass: "pnni rija rqzd mtud",
      },
    });

    const mailOptions = {
      from: "info.dmcbgh@gmail.com",
      to: "susantakdash79@gmail.com",
      subject: "Daily Financial Report | ERP Software",
      text: `Hello,\n\nHere is the daily financial report:\n\nTotal Expenditure: ${expenditure}\nTotal Revenue: ${revenue}\n\nBest regards,\nYour Team`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully.");
  } catch (error) {
    console.error("Error while generating the daily report:", error.message);
  } finally {
    console.log("Process completed.");
  }
};

cron.schedule("15 21 * * *", () => {
  console.log("Running daily report cron job at 10:23 AM");
  // sendDailyReport();
  sendDaily();
});

const getDailyReport = async (req, res) => {
  try {
    // Query to get today's expenditure and revenue
    const query = `
  SELECT 
    * 
FROM Revenues 
ORDER BY date DESC;
    `;

    const [totals] = await db.seqeulize.query(query);

    // Check if data exists
    if (totals.length === 0) {
      return res
        .status(404)
        .json({ message: "No report available for today." });
    }

    res.json(totals);
  } catch (error) {
    console.error("Error fetching daily report:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

app.get("/api/revenue", getDailyReport);
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Route to handle the file upload
app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send("No file uploaded.");
  }

  // Read the Excel file using xlsx
  const workbook = XLSX.readFile(file.path);
  const sheetName = workbook.SheetNames[0]; // Get the first sheet
  const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  // Log the parsed data or save it to the database
  console.log(sheetData);

  res
    .status(200)
    .send({ message: "File uploaded successfully", data: sheetData });
});

app.post("/api/att", async (req, res) => {
  const { studentId, date, period, status } = req.body;

  try {
    // Check if attendance is already marked
    const [existingRecord, metadata] = await db.seqeulize.query(
      `SELECT * FROM attendances WHERE studentId = ${studentId} AND date = '${date}' AND period = ${period}`
    );

    if (existingRecord.length > 0) {
      // Attendance already marked for this student, date, and period
      return res.status(400).json({
        message: "Attendance already marked for this date and period.",
      });
    }

    // If no record exists, mark the attendance
    const [result, metadataInsert] = await db.seqeulize.query(
      `INSERT INTO attendances (studentId, date, period, status) VALUES (${studentId}, '${date}', ${period}, '${status}')`
    );

    res.json({ message: "Attendance marked successfully", result });
  } catch (err) {
    console.error("Error marking attendance:", err);
    res.status(500).json({ error: "Failed to mark attendance" });
  }
});

app.get("/api/att/:date/:period", async (req, res) => {
  const { date, period } = req.params;

  try {
    const [records, metadata] = await db.seqeulize.query(
      `SELECT * FROM attendances WHERE date = '${date}' AND period = ${period}`
    );
    res.json(records);
  } catch (err) {
    console.error("Error fetching attendance records:", err);
    res.status(500).json({ error: "Failed to fetch attendance records" });
  }
});
app.get("/st", async (req, res) => {
  const students = await Student.findAll();
  res.json(students);
});
app.listen(PORT, (err) => {
  if (err) {
    return console.log("server error");
  }
  return console.log(`server listening on port ${PORT}`);
});
