const db = require("../models/index");
const { v4: uuidv4 } = require("uuid");
const emailService = require("./emailService");

const createBooking = async ({ patientId, scheduleId, reason }) => {
  if (!patientId || !scheduleId || !reason) {
    throw new Error("Missing required parameters");
  }

  const patient = await db.Patient.findByPk(patientId, {
    include: [{ model: db.User, as: "user" }],
  });
  if (!patient || !patient.user) {
    throw new Error("Patient not found");
  }

  const schedule = await db.Schedule.findByPk(scheduleId, {
    include: [
      {
        model: db.Doctor,
        as: "doctor",
        include: [{ model: db.User, as: "user" }],
      },
      {
        model: db.TimeSlot,
        as: "timeSlot",
      },
    ],
  });
  if (!schedule || !schedule.doctor || !schedule.doctor.user) {
    throw new Error("Schedule not found");
  }

  const currentBookingCount = await db.Booking.count({
    where: {
      scheduleId,
      status: ["PENDING", "CONFIRMED"],
    },
  });

  if (currentBookingCount >= schedule.maxPatient) {
    throw new Error("This schedule is fully booked");
  }

  const queueNumber = currentBookingCount + 1;
  const token = uuidv4();

  const booking = await db.Booking.create({
    patientId,
    scheduleId,
    reason,
    status: "PENDING",
    queueNumber,
    token,
  });

  await emailService.sendBookingEmail({
    email: patient.user.email,
    patientName: patient.user.fullName,
    doctorName: schedule.doctor.user.fullName,
    workDate: schedule.workDate,
    timeLabel: schedule.timeSlot.label,
    token,
  });

  return booking;
};

const confirmBooking = async (bookingId) => {
  if (!bookingId) {
    throw new Error("Missing bookingId");
  }

  const booking = await db.Booking.findByPk(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status === "CANCELLED") {
    throw new Error("Cannot confirm a cancelled booking");
  }

  if (booking.status === "DONE") {
    throw new Error("Cannot confirm a completed booking");
  }

  if (booking.status === "CONFIRMED") {
    return booking; // idempotent
  }

  booking.status = "CONFIRMED";
  await booking.save();

  return booking;
};

const cancelBooking = async (bookingId) => {
  if (!bookingId) {
    throw new Error("Missing bookingId");
  }

  const booking = await db.Booking.findByPk(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status === "DONE") {
    throw new Error("Cannot cancel a completed booking");
  }

  if (booking.status === "CANCELLED") {
    return booking; // idempotent
  }

  booking.status = "CANCELLED";
  await booking.save();

  return booking;
};

const confirmBookingByToken = async (token) => {
  if (!token) {
    throw new Error("Missing token");
  }

  const booking = await db.Booking.findOne({
    where: { token },
  });

  if (!booking) {
    throw new Error("Invalid or expired token");
  }

  if (booking.status === "CANCELLED") {
    throw new Error("Booking has been cancelled");
  }

  if (booking.status === "CONFIRMED") {
    return booking; // đã xác nhận rồi
  }

  booking.status = "CONFIRMED";
  await booking.save();

  return booking;
};

const cancelBookingByToken = async (token) => {
  if (!token) {
    throw new Error("Missing token");
  }

  const booking = await db.Booking.findOne({
    where: { token },
    include: [
      {
        model: db.MedicalRecord,
        as: "medicalRecord",
      },
    ],
  });

  if (!booking) {
    throw new Error("Invalid or expired token");
  }

  if (booking.medicalRecord) {
    throw new Error("Cannot cancel booking after examination");
  }

  if (booking.status === "CANCELLED") {
    return booking;
  }

  booking.status = "CANCELLED";
  await booking.save();

  return booking;
};

module.exports = {
  createBooking,
  confirmBooking,
  cancelBooking,
  confirmBookingByToken,
  cancelBookingByToken,
};
