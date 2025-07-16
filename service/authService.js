const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/dbConfig");
// user model
const User = db.User;
// secret key
const SECRET_KEY = process.env.SECRET_KEY;
const REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY;

const refreshTokens = [];

const generateAccessToken = (user) => {
  return jwt.sign({ username: user.userName }, SECRET_KEY, { expiresIn: "1m" });
};

const generateRefreshToken = (user) => {
  const refreshToken = jwt.sign(
    { username: user.userName },
    REFRESH_SECRET_KEY,
    { expiresIn: "7d" }
  );

  refreshTokens.push(refreshToken);
  return refreshToken;
};

exports.register = async (userName, userPassword, userType) => {
  const hashedPassword = await bcrypt.hash(userPassword, 10);
  //   todo add user to database
  console.log(userName, userPassword, userType);
  const userObj = {
    userName: userName,
    userPassword: hashedPassword,
    userType: userType,
  };
  // add user to db
  const addUser = await User.create(userObj);
  return addUser;
};

exports.login = async (userName, userPassword) => {
  const user = await User.findOne({
    where: { userName: userName.toLowerCase() },
  });

  if (user && (await bcrypt.compare(userPassword, user.userPassword))) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    return {
      accessToken,
      refreshToken,
      userType: user.userType,
      username: user.userName,
    };
  } else {
    console.log();
    throw new Error("Invalid credentials");
  }
};

exports.refreshToken = async (refreshToken) => {
  if (!refreshToken || !refreshTokens.includes(refreshToken)) {
    throw new Error("Invalid refresh token");
  }

  return new Promise((resolve, reject) => {
    jwt.verify(refreshToken, REFRESH_SECRET_KEY, (err, user) => {
      if (err) return reject("Invalid refresh token");
      const newAccessToken = generateAccessToken(user);
      resolve(newAccessToken);
    });
  });
};
