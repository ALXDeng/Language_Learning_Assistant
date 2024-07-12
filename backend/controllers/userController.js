const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "3d" });
};
const loginUser = async (req, res) => {
  console.log("logging in");
  const { email, password } = req.body;

  console.log(email, password);
  try {
    console.log("Trying");
    const user = await User.login(email, password);
    const token = createToken(user._id);
    console.log(token);
    res.status(200).json({ email, token });
  } catch (error) {
    console.log("error", error);
    res.status(400).json({ error: error.message });
  }
};
//signp

const signupUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.signup(email, password);

    //create token

    const token = createToken(user._id);
    res.status(200).json({ email, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  loginUser,
  signupUser,
};
