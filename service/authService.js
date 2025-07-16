const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/dbConfig");
const log4js = require("log4js");
const logger = log4js.getLogger();

// user model
const User = db.User;
// secret key
const SECRET_KEY = process.env.SECRET_KEY;
const REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY;

const refreshTokens = [];

const generateAccessToken = (user) => {
  logger.debug(`Generating access token for user: ${user.userName}`);
  return jwt.sign({ username: user.userName }, SECRET_KEY, { expiresIn: "1m" });
};

const generateRefreshToken = (user) => {
  logger.debug(`Generating refresh token for user: ${user.userName}`);
  const refreshToken = jwt.sign(
    { username: user.userName },
    REFRESH_SECRET_KEY,
    { expiresIn: "7d" }
  );

  refreshTokens.push(refreshToken);
  return refreshToken;
};

exports.register = async (userName, userPassword, userType) => {
  try {
    logger.info(
      `Attempting to register user: ${userName} with type: ${userType}`
    );

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { userName: userName },
    });

    if (existingUser) {
      logger.warn(`Registration failed: User ${userName} already exists`);
      throw new Error("User already exists");
    }

    logger.debug(`Hashing password for user: ${userName}`);
    const hashedPassword = await bcrypt.hash(userPassword, 10);
    const userObj = {
      userName: userName,
      userPassword: hashedPassword,
      userType: userType,
    };

    logger.debug(`Creating user record in database for: ${userName}`);
    const addUser = await User.create(userObj);
    logger.info(
      `User created successfully: ${userName} with ID: ${addUser.userId}`
    );
    return addUser;
  } catch (error) {
    logger.error(`Error in register service for user ${userName}:`, error);
    throw error;
  }
};

exports.login = async (userName, userPassword) => {
  try {
    logger.info(`Login attempt for user: ${userName}`);
    logger.debug(`Searching for user: ${userName}`);

    const user = await User.findOne({
      where: { userName: userName },
    });

    if (!user) {
      logger.warn(`Login failed: User ${userName} not found`);
      throw new Error("Invalid credentials");
    }

    logger.debug(`User found, verifying password for: ${userName}`);
    const passwordMatch = await bcrypt.compare(userPassword, user.userPassword);

    if (passwordMatch) {
      logger.info(`Password verified successfully for user: ${userName}`);
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      logger.info(`Tokens generated successfully for user: ${userName}`);
      return {
        accessToken,
        refreshToken,
        userType: user.userType,
        username: user.userName,
      };
    } else {
      logger.warn(`Login failed: Invalid password for user: ${userName}`);
      throw new Error("Invalid credentials");
    }
  } catch (error) {
    logger.error(`Error in login service for user ${userName}:`, error);
    throw error;
  }
};

exports.refreshToken = async (refreshToken) => {
  logger.info("Attempting to refresh token");

  if (!refreshToken || !refreshTokens.includes(refreshToken)) {
    logger.warn("Refresh token validation failed: Invalid or missing token");
    throw new Error("Invalid refresh token");
  }

  return new Promise((resolve, reject) => {
    jwt.verify(refreshToken, REFRESH_SECRET_KEY, (err, user) => {
      if (err) {
        logger.error("JWT verification failed for refresh token:", err);
        return reject("Invalid refresh token");
      }
      logger.debug(`Generating new access token for user: ${user.username}`);
      const newAccessToken = generateAccessToken(user);
      logger.info(
        `New access token generated successfully for user: ${user.username}`
      );
      resolve(newAccessToken);
    });
  });
};
