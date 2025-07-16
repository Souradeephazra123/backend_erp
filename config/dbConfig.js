const Sequelize = require("sequelize");
const log4js = require("log4js");
const logger = log4js.getLogger();

// const dbName = "bikashvi_apierp";
// const dbUser = "bikashvi_usererp";
// const dbPassword = "yashvarshney";
const dbName = "bikashvi_mcs_erp";
// const dbUser = "bikashvi_mcs_user";
const dbUser = "root";
const dbPassword = "Souradeep@599";
// const dbPassword = "yashvarshney";

const seqeulize = new Sequelize(dbName, dbUser, dbPassword, {
  host: "localhost",
  port: "3306",
  dialect: "mysql",
  logging: false,
});

try {
  seqeulize.authenticate();
  logger.info("DB Connection has been established successfully.");
  console.log("DB Connection has been established successfully.");
} catch (error) {
  logger.error("Unable to connect to the database:", error);
  console.error("Unable to connect to the database:", error);
}

//   database handle
const db = {};
db.Sequelize = Sequelize;
db.seqeulize = seqeulize;

// user model
db.User = require("../model/userModel")(seqeulize, Sequelize);

// student model
db.Student = require("../model/studentModel")(seqeulize, Sequelize);
// address model
db.Address = require("../model/addressModel")(seqeulize, Sequelize);
// certificate model
db.Certificate = require("../model/certificateModel")(seqeulize, Sequelize);

// fee model

db.FeeCategory = require("../model/FeeCategories")(seqeulize, Sequelize);
db.FeeSubCategory = require("../model/FeeSubCategories")(seqeulize, Sequelize);
db.Fee = require("../model/Fees")(seqeulize, Sequelize);

// discount model

db.Discount = require("../model/Discounts")(seqeulize, Sequelize);
db.FeeHistory = require("../model/paymentHistory")(seqeulize, Sequelize);
db.Book = require("../model/books")(seqeulize, Sequelize);
db.StudentBook = require("../model/student_book")(seqeulize, Sequelize);
db.Expenditure = require("../model/expenditures")(seqeulize, Sequelize);
db.PaymentApproval = require("../model/paymentApproval")(seqeulize, Sequelize);
db.Certificate_request = require("../model/certificateRequest")(
  seqeulize,
  Sequelize
);
db.Revenue = require("../model/storetraction")(seqeulize, Sequelize);
db.School = require("../model/school")(seqeulize, Sequelize);
// student fee model

// certificate model

// association
db.Student.hasOne(db.Address, {
  foreignKey: {
    name: "id",
  },
});
db.Address.belongsTo(db.Student);
// Associations (to be done in index.js or similar)
db.FeeCategory.hasMany(db.FeeSubCategory, { foreignKey: "category_id" });
db.FeeSubCategory.belongsTo(db.FeeCategory, { foreignKey: "category_id" });

db.FeeSubCategory.hasMany(db.Fee, { foreignKey: "subcategory_id" });
db.Fee.belongsTo(db.FeeSubCategory, { foreignKey: "subcategory_id" });
// export db
module.exports = db;
