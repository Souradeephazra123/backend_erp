const authService = require("../../service/authService");
const log4js = require("log4js");
const logger = log4js.getLogger();

exports.register = async (req, res) => {
  logger.info("POST /api/auth/register endpoint was hit.");
  logger.debug("Register request body: ", JSON.stringify(req.body, null, 2));

  const { userName, userPassword, userType } = req.body;
  try {
    logger.debug(
      `Attempting to register user: ${userName} with type: ${userType}`
    );
    const status = await authService.register(
      userName.trim(),
      userPassword,
      userType
    );

    logger.info(`User registered successfully: ${status.userName}`);
    res.status(201).send({
      message: "User registered successfully",
      username: status.userName,
    });
  } catch (err) {
    console.log("Registration Error:", err);
    console.log("Error message:", err.message);
    console.log("Error stack:", err.stack);

    logger.error("Registration Error:", err);
    logger.error("Error message:", err.message);
    logger.error("Error stack:", err.stack);
    res.status(500).send({
      message: "Registration failed",
      error: err.message,
    });
  }
};

exports.login = async (req, res) => {
  const { userName, userPassword } = req.body;
  logger.info("POST /api/auth/login endpoint was hit.");
  logger.debug(`Login attempt for user: ${userName}`);

  try {
    const result = await authService.login(userName, userPassword);
    logger.info(`User logged in successfully: ${userName}`);
    res.json(result);
  } catch (err) {
    logger.warn(`Login failed for user: ${userName}. Reason: ${err.message}`);
    res.status(401).send("Invalid credentials");
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  logger.info("POST /api/auth/refresh-token endpoint was hit.");
  logger.debug("Attempting to refresh token");

  try {
    const newAccessToken = await authService.refreshToken(refreshToken);
    logger.info("Token refreshed successfully");
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    logger.warn("Token refresh failed:", err.message);
    res.status(401).send("Invalid refresh token");
  }
};
