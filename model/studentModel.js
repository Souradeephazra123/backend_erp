// initial state
const InitialStudentId = 100;
const InitialAdmNo = 200;
const InitialRegdNo = 1900;
const Student_Type = ["new", "old", "semi"];

module.exports = (sequelize, Sequelize, DataTypes) => {
  const Student = sequelize.define(
    "student",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      academic_year_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
        validation: {
          notEmpty: true,
        },
      },
      middleName: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "",
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
        validation: {
          notEmpty: true,
        },
      },
      studentType: {
        type: Sequelize.ENUM,
        allowNull: false,
        values: Student_Type,
      },
      class_id: {
        type: Sequelize.INTEGER, // Corrected the data type for class
        allowNull: false,
      },
      division_id: {
        type: Sequelize.INTEGER, // Corrected the data type for division
        allowNull: false,
      },
      admDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      uidNo: {
        type: Sequelize.STRING(12),
        allowNull: false,
      },
      father_aadhar: {
        type: Sequelize.STRING(12),
        allowNull: true,
      },
      mother_aadhar: {
        type: Sequelize.STRING(12),
        allowNull: true,
      },
      dob: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      dobPlace: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      bloodGrp: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      photo: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      identificationMark1: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: "",
      },
      identificationMark2: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: "",
      },
      fatherName: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      motherName: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      guardianName: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: "",
      },
      religion: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      nationality: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      mobileNo: {
        type: Sequelize.STRING(10),
        allowNull: true,
        validate: {
          len: [10, 10],
        },
      },
      alternateMobileNo: {
        type: Sequelize.STRING(10),
        allowNull: true,
        validate: {
          len: [10, 10],
        },
      },
      emailId: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      admNo: {
        type: Sequelize.INTEGER,

        allowNull: true,
      },
      regdNo: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      bus_route_id: {
        type: Sequelize.INTEGER,
        defaultValue: null,
      },
      password: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      carryForwardFee: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0.0,
      },
      carryForwardFee_id: {
        type: Sequelize.INTEGER,
        defaultValue: null,
      },
      gender: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      weight: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      height: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      district: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      pincode: {
        type: Sequelize.STRING(10),
        allowNull: false,
        validate: {
          isNumeric: true,
        },
      },
      udiseCode: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      penCode: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      schoolType: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      classToBeAdmitted: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      lastClassAttended: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      lastSchoolAttended: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fatherPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fatherNumber: {
        type: Sequelize.STRING(10),
        allowNull: true,
        validate: {
          len: [10, 10],
        },
      },
      fatherWhatsappNumber: {
        type: Sequelize.STRING(10),
        allowNull: true,
        validate: {
          len: [10, 10],
        },
      },
      fatherQualification: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      fatherOccupation: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      motherPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      motherNumber: {
        type: Sequelize.STRING(10),
        allowNull: true,
        validate: {
          len: [10, 10],
        },
      },
      motherWhatsappNumber: {
        type: Sequelize.STRING(10),
        allowNull: true,
        validate: {
          len: [10, 10],
        },
      },
      motherQualification: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      motherOccupation: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      guardianNumber: {
        type: Sequelize.STRING(10),
        allowNull: true,
        validate: {
          len: [10, 10],
        },
      },
      relationWithGuardian: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      emergencyContactNumber: {
        type: Sequelize.STRING(10),
        allowNull: false,
        validate: {
          len: [10, 10],
        },
      },
      permanentAddress: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      presentAddress: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      hostelType: {
        type: Sequelize.STRING(50),
        defaultValue: null,
      },
    },
    {
      initialAutoIncrement: InitialStudentId,
      hooks: {
        beforeCreate: async (student, options) => {
          const lastStudent = await Student.findOne({
            where: {
              admNo: {
                [Sequelize.Op.ne]: null,
              },
            },
            order: [["admNo", "DESC"]],
          });

          if (lastStudent && lastStudent.admNo >= InitialAdmNo) {
            student.admNo = lastStudent.admNo + 1;
          } else {
            student.admNo = InitialAdmNo;
          }
        },
      },
    }
  );

  return Student;
};
