// initial state
const IntialuserId = 1000;
const Type = ["staff", "teacher", "admin"];
module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define(
    "User",
    {
      userId: {
        type: Sequelize.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
      },
      userName: {
        type: Sequelize.STRING,
        allowNull: false,

        validate: {
          notEmpty: true,
          isEmail: true,
        },
      },
      userType: {
        type: Sequelize.STRING,
        values: Type,
        allowNull: false,
      },
      userPassword: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
    },
    {
      initialAutoIncrement: IntialuserId,
    }
  );

  return User;
};

// {
//     hooks: {
//         beforeCreate: async (user, options) => {
//             const maxUserId = await User.max('userId', {
//                 where: {
//                     userId: {
//                         [Sequelize.Op.like]: 'ID_%'
//                     }
//                 },
//                 attributes: [[sequelize.fn('substring', sequelize.col('userId'), 4), 'num']]
//             });

//             const maxIdNumber = maxUserId ? parseInt(maxUserId.substring(3)) : 999;
//             console.log("maxUserId: ", maxUserId);
//             console.log("maxIdNumber: ", maxIdNumber);
//             user.userId = `ID_${maxIdNumber + 1}`;
//         }
//     }
// }
