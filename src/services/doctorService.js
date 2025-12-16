const db = require("../models/index");

const createDoctor = async ({ id, clinicId, specialtyId, title, fee, bio }) => {
  if (!id || !clinicId || !specialtyId || !title || !fee) {
    throw new Error("Missing required parameters");
  }

  const existed = await db.Doctor.findByPk(id);
  if (existed) throw new Error("Doctor already exists");

  return db.Doctor.create({ id, clinicId, specialtyId, title, fee, bio });
};

const getDoctors = async ({ clinicId, specialtyId }) => {
  const where = {};
  if (clinicId) where.clinicId = clinicId;
  if (specialtyId) where.specialtyId = specialtyId;

  return db.Doctor.findAll({
    where,
    include: [
      { model: db.User, as: "user", attributes: ["fullName", "email"] },
      { model: db.Clinic, as: "clinic" },
      { model: db.Specialty, as: "specialty" },
    ],
  });
};

const getDoctorById = async (id) => {
  if (!id) throw new Error("Missing doctor id");

  const doctor = await db.Doctor.findByPk(id, {
    include: [
      { model: db.User, as: "user", attributes: ["fullName", "email"] },
      { model: db.Clinic, as: "clinic" },
      { model: db.Specialty, as: "specialty" },
      { model: db.Handbook, as: "handbooks" },
    ],
  });

  if (!doctor) throw new Error("Doctor not found");
  return doctor;
};

const updateDoctor = async (id, data) => {
  if (!id) throw new Error("Missing doctor id");

  const doctor = await db.Doctor.findByPk(id);
  if (!doctor) throw new Error("Doctor not found");

  return doctor.update(data);
};

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
};
