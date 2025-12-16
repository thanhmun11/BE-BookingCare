const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

const registerUser = async ({ fullName, email, password, ...profileData }) => {
  // Validate required fields
  if (!fullName || !email || !password) {
    throw new Error("Missing required parameters: fullName, email, password");
  }

  // Kiểm tra email đã tồn tại chưa
  const existed = await db.User.findOne({ where: { email } });
  if (existed) throw new Error("Email already in use");

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Tạo user, role mặc định là PATIENT
  const user = await db.User.create({
    fullName,
    email,
    password: hashedPassword,
    role: "PATIENT",
    ...profileData,
  });

  // Tạo patient profile luôn
  await db.Patient.create({ id: user.id });

  return user;
};

const loginUser = async ({ email, password }) => {
  if (!email || !password) throw new Error("Missing email or password");

  const user = await db.User.findOne({
    where: { email },
    include: [
      { model: db.Patient, as: "patientData" },
      { model: db.Admin, as: "adminData" },
      { model: db.Doctor, as: "doctorData" },
    ],
  });

  if (!user) throw new Error("User not found");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Incorrect password");

  // Tạo JWT
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "1d",
  });

  return { user, token };
};

const getUserProfile = async (userId) => {
  const user = await db.User.findByPk(userId, {
    include: [
      { model: db.Patient, as: "patientData" },
      { model: db.Admin, as: "adminData" },
      { model: db.Doctor, as: "doctorData" },
    ],
  });
  if (!user) throw new Error("User not found");
  return user;
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};
