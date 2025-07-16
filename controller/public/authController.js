const authService = require("../../service/authService");

exports.register = async (req, res) => {
  console.log("Register: ", req.body);
  const { userName, userPassword, userType } = req.body;
  try {
    const status = await authService.register(
      userName.trim(),
      userPassword,
      userType
    );
    res.status(201).send({
      message: "User registered successfully",
      username: status.userName,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Registration failed");
  }
};

exports.login = async (req, res) => {
  const { userName, userPassword } = req.body;

  try {
    const result = await authService.login(userName, userPassword);

    res.json(result);
  } catch (err) {
    res.status(401).send("Invalid credentials");
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  try {
    const newAccessToken = await authService.refreshToken(refreshToken);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).send("Invalid refresh token");
  }
};
