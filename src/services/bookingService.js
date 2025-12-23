const db = require("../models/index");
const { v4: uuidv4 } = require("uuid");
const emailService = require("./emailService");
const { Op } = require("sequelize");

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

  // Check if patient already has a booking for this schedule
  const existingBooking = await db.Booking.findOne({
    where: {
      patientId,
      scheduleId,
      status: ["PENDING", "CONFIRMED"],
    },
  });
  if (existingBooking) {
    throw new Error(
      "Bạn đã đặt lịch khám với bác sĩ này trong khung giờ này rồi"
    );
  }

  const currentBookingCount = await db.Booking.count({
    where: {
      scheduleId,
      status: ["PENDING", "CONFIRMED"],
    },
  });

  if (currentBookingCount >= schedule.maxPatient) {
    throw new Error("Giờ này đã đầy lịch, vui lòng chọn khung giờ khác");
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

// List bookings for a patient with rich includes
const getBookingsByPatient = async (patientId) => {
  if (!patientId) {
    throw new Error("Missing patientId");
  }

  const patient = await db.Patient.findByPk(patientId);
  if (!patient) {
    throw new Error("Patient not found");
  }

  const bookings = await db.Booking.findAll({
    where: { patientId },
    attributes: ["id", "status", "queueNumber", "reason", "createdAt"],
    include: [
      {
        model: db.Schedule,
        as: "schedule",
        attributes: ["id", "workDate", "maxPatient"],
        include: [
          {
            model: db.Doctor,
            as: "doctor",
            attributes: ["id", "fee"],
            include: [
              {
                model: db.User,
                as: "user",
                attributes: ["id", "fullName"],
              },
              {
                model: db.Clinic,
                as: "clinic",
                attributes: ["id", "name"],
              },
              {
                model: db.Specialty,
                as: "specialty",
                attributes: ["id", "name"],
              },
            ],
          },
          {
            model: db.TimeSlot,
            as: "timeSlot",
            attributes: ["id", "label"],
          },
        ],
      },
      {
        model: db.MedicalRecord,
        as: "medicalRecord",
        attributes: ["id"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return bookings;
};

// Cancel booking verified by patient ownership
const cancelBookingByPatient = async ({ bookingId, patientId }) => {
  if (!bookingId || !patientId) {
    throw new Error("Missing required parameters");
  }

  const booking = await db.Booking.findByPk(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.patientId !== Number(patientId)) {
    throw new Error("Forbidden: booking does not belong to patient");
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

module.exports = {
  createBooking,
  confirmBooking,
  cancelBooking,
  confirmBookingByToken,
  cancelBookingByToken,
  getBookingsByPatient,
  cancelBookingByPatient,
  getBookingsForDoctor,
  getBookingDetails,
};

// List bookings for a doctor by date and status with rich includes
async function getBookingsForDoctor({ doctorId, workDate, status }) {
  if (!doctorId) {
    throw new Error("Missing required parameters");
  }

  // Normalize status filter
  let statusFilter = undefined;
  if (status) {
    if (Array.isArray(status)) statusFilter = { [Op.in]: status };
    else if (typeof status === "string") {
      // allow comma separated list
      const parts = status
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      statusFilter = parts.length > 1 ? { [Op.in]: parts } : parts[0];
    }
  } else {
    // default: only confirmed for triage list
    statusFilter = "CONFIRMED";
  }

  let dateClause = undefined;
  if (workDate) {
    const start = new Date(workDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(workDate);
    end.setHours(23, 59, 59, 999);
    dateClause = { [Op.between]: [start, end] };
  }

  const bookings = await db.Booking.findAll({
    where: statusFilter ? { status: statusFilter } : {},
    attributes: ["id", "status", "queueNumber", "reason", "createdAt"],
    include: [
      {
        model: db.Schedule,
        as: "schedule",
        attributes: ["id", "workDate", "maxPatient"],
        where: {
          doctorId: Number(doctorId),
          ...(dateClause ? { workDate: dateClause } : {}),
        },
        include: [
          { model: db.TimeSlot, as: "timeSlot", attributes: ["id", "label"] },
          {
            model: db.Doctor,
            as: "doctor",
            attributes: ["id", "fee"],
            include: [
              { model: db.User, as: "user", attributes: ["id", "fullName"] },
            ],
          },
        ],
      },
      {
        model: db.Patient,
        as: "patient",
        attributes: ["id"],
        include: [
          {
            model: db.User,
            as: "user",
            attributes: [
              "id",
              "fullName",
              "email",
              "phoneNumber",
              "gender",
              "birthday",
            ],
          },
        ],
      },
      { model: db.MedicalRecord, as: "medicalRecord", attributes: ["id"] },
    ],
    order: [["queueNumber", "ASC"]],
  });

  return bookings;
}

// Detail for a single booking including examination + billing
async function getBookingDetails(bookingId) {
  if (!bookingId) throw new Error("Missing bookingId");

  const booking = await db.Booking.findByPk(bookingId, {
    attributes: ["id", "status", "queueNumber", "reason", "createdAt"],
    include: [
      {
        model: db.Schedule,
        as: "schedule",
        attributes: ["id", "workDate", "maxPatient"],
        include: [
          { model: db.TimeSlot, as: "timeSlot", attributes: ["id", "label"] },
          {
            model: db.Doctor,
            as: "doctor",
            attributes: ["id", "fee" ],
            
            include: [
              { model: db.User, as: "user", attributes: ["id", "fullName"] },
              { model: db.Clinic, as: "clinic", attributes: ["id", "name"] },
              { model: db.Specialty, as: "specialty", attributes: ["id", "name"] },
            ],
          },
        ],
      },
      {
        model: db.Patient,
        as: "patient",
        attributes: ["id"],
        include: [
          {
            model: db.User,
            as: "user",
            attributes: [
              "id",
              "fullName",
              "email",
              "phoneNumber",
              "gender",
              "birthday",
              "address",
            ],
          },
        ],
      },
      {
        model: db.MedicalRecord,
        as: "medicalRecord",
        include: [
          {
            model: db.Prescription,
            as: "prescription",
            include: [
              {
                model: db.PrescriptionItem,
                as: "items",
                include: [{ model: db.Medicine, as: "medicine" }],
              },
            ],
          },
          { model: db.Bill, as: "bill" },
        ],
      },
    ],
  });

  if (!booking) throw new Error("Booking not found");
  return booking;
}
