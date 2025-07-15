const authService = require("../../service/authService");

exports.register = async (req, res) => {
  console.log("Register: ", req.body);
  const { username, password, userType } = req.body;
  try {
    const status = await authService.register(
      username.trim(),
      password,
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
  const { username, password } = req.body;

  try {
    const result = await authService.login(username, password);

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
