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

// 2. CONFIGURE AND INITIALIZE LOG4JS HERE
const log4js = require("log4js");
log4js.configure({
  appenders: {
    // This defines an 'appender' named 'app' that writes to a file
    app: { type: "file", filename: "application.log" },
  },
  categories: {
    // The 'default' category uses the 'app' appender
    default: { appenders: ["app"], level: "debug" },
  },
});

// Get the logger instance
const logger = log4js.getLogger();

// 3. Log that the application is starting up
logger.info("Application is starting up...");

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
  logger.info("GET /api/fees endpoint was hit.");
  logger.debug(`Fetching fees for section: ${section || "All"}`);

  if (section === "All" || !section) {
    logger.debug(`Returning all fees data. Count: ${feesData.length}`);
    return res.json(feesData);
  }

  const filteredFees = feesData.filter((fee) => fee.section === section);
  logger.debug(
    `Filtered fees for section ${section}. Count: ${filteredFees.length}`
  );
  res.json(filteredFees);
});

// Route to add new fee
app.post("/api/fees", (req, res) => {
  const { section, filter, amount } = req.body;
  logger.info("POST /api/fees endpoint was hit.");
  logger.debug(
    `Adding new fee: section=${section}, filter=${filter}, amount=${amount}`
  );

  if (!section || !filter || !amount) {
    logger.warn("Missing required fields for fee creation");
    return res.status(400).json({ message: "All fields are required" });
  }

  const newFee = {
    id: feesData.length + 1,
    section,
    filter,
    amount: parseFloat(amount),
  };

  feesData.push(newFee);
  logger.info(`New fee created successfully with ID: ${newFee.id}`);
  res.status(201).json(newFee);
});

// Route to generate and download the Income Tax Certificate
app.get("/api/tax-certificate", (req, res) => {
  logger.info("GET /api/tax-certificate endpoint was hit.");
  const certificatePath = path.join(__dirname, "Income_Tax_Certificate.pdf");
  logger.debug(`Looking for certificate at: ${certificatePath}`);

  // You can generate a real PDF file dynamically or serve a static one
  if (fs.existsSync(certificatePath)) {
    logger.info("Certificate found, sending download");
    res.download(certificatePath, "Income_Tax_Certificate.pdf");
  } else {
    logger.warn("Income Tax Certificate not found");
    res.status(404).send("Income Tax Certificate not found");
  }
});

app.get("/", (req, res) => {
  logger.info("GET / (root) endpoint was hit.");
  res.send("Hello World, Hi souradeep!");
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "info.fitespero@gmail.com",
    pass: "lkgm unpx hhpt mkeh",
  },
});

const sendDailyReport = async () => {
  logger.info("Starting daily report generation");
  const startDate = moment().subtract(1, "days").set({ hour: 12, minute: 33 });
  const endDate = moment().set({ hour: 12, minute: 33 });
  logger.debug(`Report period: ${startDate.format()} to ${endDate.format()}`);

  try {
    // Get total expenditures in the last 24 hours
    logger.debug("Fetching expenditure data from database");
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
    logger.debug("Fetching payment history from database");
    console.log(`Total fees collected`, startDate.toDate(), endDate.toDate());
    const totalFeesCollected = await PaymentHistory.sum("payment_amount", {
      where: {
        payment_date: {
          [Op.between]: [startDate.toDate(), endDate.toDate()],
        },
      },
    });

    logger.debug(`Total fees collected: ${totalFeesCollected}`);
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
    logger.info("Sending daily report email");
    await transporter.sendMail(mailOptions);
    logger.info("Daily report email sent successfully!");
    console.log("Daily report email sent successfully!");
  } catch (error) {
    logger.error("Error sending daily report email:", error);
    console.error("Error sending daily report email:", error);
  }
};

const sendDaily = async () => {
  try {
    logger.info("Starting daily financial report calculation");
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
    logger.debug("Executing revenue calculation query");
    const [results] = await db.seqeulize.query(query);
    logger.info("Daily report successfully stored in database");
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

    logger.debug("Fetching today's totals for email");
    const [totals] = await db.seqeulize.query(totalsQuery);
    const { expenditure, revenue } = totals[0];

    logger.debug(
      `Today's totals - Expenditure: ${expenditure}, Revenue: ${revenue}`
    );
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

    logger.info("Sending daily financial report email");
    await transporter.sendMail(mailOptions);
    logger.info("Daily financial report email sent successfully");
    console.log("Email sent successfully.");
  } catch (error) {
    logger.error("Error while generating the daily report:", error);
    console.error("Error while generating the daily report:", error.message);
  } finally {
    logger.debug("Daily report process completed");
    console.log("Process completed.");
  }
};

cron.schedule("15 21 * * *", () => {
  logger.info("Running daily report cron job at 9:15 PM");
  console.log("Running daily report cron job at 10:23 AM");
  // sendDailyReport();
  sendDaily();
});

const getDailyReport = async (req, res) => {
  try {
    logger.info("GET /api/revenue endpoint was hit.");
    // Query to get today's expenditure and revenue
    const query = `
  SELECT 
    * 
FROM Revenues 
ORDER BY date DESC;
    `;

    logger.debug("Fetching revenue reports from database");
    const [totals] = await db.seqeulize.query(query);

    // Check if data exists
    if (totals.length === 0) {
      logger.warn("No revenue reports found in database");
      return res
        .status(404)
        .json({ message: "No report available for today." });
    }

    logger.debug(`Returning ${totals.length} revenue reports`);
    res.json(totals);
  } catch (error) {
    logger.error("Error fetching daily report:", error);
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
  logger.info("POST /upload endpoint was hit.");

  if (!file) {
    logger.warn("File upload failed: No file provided");
    return res.status(400).send("No file uploaded.");
  }

  try {
    logger.debug(`Processing uploaded file: ${file.filename}`);
    // Read the Excel file using xlsx
    const workbook = XLSX.readFile(file.path);
    const sheetName = workbook.SheetNames[0]; // Get the first sheet
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Log the parsed data or save it to the database
    logger.debug(`Parsed ${sheetData.length} rows from Excel file`);
    console.log(sheetData);

    logger.info("File uploaded and processed successfully");
    res
      .status(200)
      .send({ message: "File uploaded successfully", data: sheetData });
  } catch (error) {
    logger.error("Error processing uploaded file:", error);
    res
      .status(500)
      .send({ message: "Error processing file", error: error.message });
  }
});

app.post("/api/att", async (req, res) => {
  const { studentId, date, period, status } = req.body;
  logger.info("POST /api/att endpoint was hit.");
  logger.debug(
    `Marking attendance: studentId=${studentId}, date=${date}, period=${period}, status=${status}`
  );

  try {
    // Check if attendance is already marked
    logger.debug("Checking for existing attendance record");
    const [existingRecord, metadata] = await db.seqeulize.query(
      `SELECT * FROM attendances WHERE studentId = ${studentId} AND date = '${date}' AND period = ${period}`
    );

    if (existingRecord.length > 0) {
      // Attendance already marked for this student, date, and period
      logger.warn(
        `Attendance already marked for student ${studentId} on ${date} period ${period}`
      );
      return res.status(400).json({
        message: "Attendance already marked for this date and period.",
      });
    }

    // If no record exists, mark the attendance
    logger.debug("Creating new attendance record");
    const [result, metadataInsert] = await db.seqeulize.query(
      `INSERT INTO attendances (studentId, date, period, status) VALUES (${studentId}, '${date}', ${period}, '${status}')`
    );

    logger.info(`Attendance marked successfully for student ${studentId}`);
    res.json({ message: "Attendance marked successfully", result });
  } catch (err) {
    logger.error("Error marking attendance:", err);
    console.error("Error marking attendance:", err);
    res.status(500).json({ error: "Failed to mark attendance" });
  }
});

app.get("/api/att/:date/:period", async (req, res) => {
  const { date, period } = req.params;
  logger.info(`GET /api/att/${date}/${period} endpoint was hit.`);
  logger.debug(
    `Fetching attendance records for date: ${date}, period: ${period}`
  );

  try {
    const [records, metadata] = await db.seqeulize.query(
      `SELECT * FROM attendances WHERE date = '${date}' AND period = ${period}`
    );

    logger.debug(`Found ${records.length} attendance records`);
    res.json(records);
  } catch (err) {
    logger.error("Error fetching attendance records:", err);
    console.error("Error fetching attendance records:", err);
    res.status(500).json({ error: "Failed to fetch attendance records" });
  }
});
app.get("/st", async (req, res) => {
  logger.info("GET /st endpoint was hit.");
  try {
    logger.debug("Fetching all students from database");
    const students = await Student.findAll();
    logger.debug(`Found ${students.length} students`);
    res.json(students);
  } catch (error) {
    logger.error("Error fetching students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});
app.listen(PORT, (err) => {
  if (err) {
    logger.error("Server startup error:", err);
    return console.log("server error");
  }
  logger.info(`Server started successfully and listening on port ${PORT}`);
  return console.log(`server listening on port ${PORT}`);
});
