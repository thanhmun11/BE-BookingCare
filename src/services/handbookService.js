const db = require("../models/index");

const createHandbook = async ({ title, content, doctorId }) => {
  if (!title || !content || !doctorId) {
    throw new Error("Missing required parameters");
  }

  const doctor = await db.Doctor.findByPk(doctorId);
  if (!doctor) {
    throw new Error("Doctor not found");
  }

  return db.Handbook.create({
    title,
    content,
    doctorId,
  });
};

const getHandbooks = async () => {
  return db.Handbook.findAll({
    include: [
      {
        model: db.Doctor,
        as: "doctor",
        attributes: ["id"], // name lấy từ User nếu có
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

const getHandbookById = async (id) => {
  if (!id) throw new Error("Missing handbook id");

  const handbook = await db.Handbook.findByPk(id, {
    include: [
      {
        model: db.Doctor,
        as: "doctor",
        attributes: ["id"],
      },
    ],
  });

  if (!handbook) throw new Error("Handbook not found");

  return handbook;
};

const updateHandbook = async (id, data) => {
  if (!id) throw new Error("Missing handbook id");

  const handbook = await db.Handbook.findByPk(id);
  if (!handbook) throw new Error("Handbook not found");

  await handbook.update(data);
  return handbook;
};

const deleteHandbook = async (id) => {
  if (!id) throw new Error("Missing handbook id");

  const handbook = await db.Handbook.findByPk(id);
  if (!handbook) throw new Error("Handbook not found");

  await handbook.destroy();
  return true;
};

module.exports = {
  createHandbook,
  getHandbooks,
  getHandbookById,
  updateHandbook,
  deleteHandbook,
};
