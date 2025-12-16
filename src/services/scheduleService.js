const db = require("../models/index");
const { Op } = db.Sequelize;

// Tạo lịch mới
const createSchedule = async ({
  doctorId,
  timeSlotId,
  workDate,
  maxPatient,
}) => {
  if (!doctorId || !timeSlotId || !workDate || !maxPatient) {
    throw new Error("Missing required parameters");
  }

  const doctor = await db.Doctor.findByPk(doctorId);
  if (!doctor) throw new Error("Doctor not found");

  const timeSlot = await db.TimeSlot.findByPk(timeSlotId);
  if (!timeSlot) throw new Error("TimeSlot not found");

  const conflict = await db.Schedule.findOne({
    where: { doctorId, timeSlotId, workDate },
  });
  if (conflict)
    throw new Error(
      "Schedule conflict: Doctor already has a schedule for this time slot on this date"
    );

  return db.Schedule.create({ doctorId, timeSlotId, workDate, maxPatient });
};

const createScheduleBulk = async ({
  doctorId,
  workDate,
  timeSlotIds,
  maxPatient,
}) => {
  /* ========= 1. Validate input ========= */
  if (
    !doctorId ||
    !workDate ||
    !Array.isArray(timeSlotIds) ||
    timeSlotIds.length === 0 ||
    !maxPatient
  ) {
    throw new Error("Missing required parameters");
  }

  /* ========= 2. Check doctor ========= */
  const doctor = await db.Doctor.findByPk(doctorId);
  if (!doctor) {
    throw new Error("Doctor not found");
  }

  /* ========= 3. Check TimeSlot tồn tại ========= */
  const timeSlots = await db.TimeSlot.findAll({
    where: {
      id: { [Op.in]: timeSlotIds },
    },
  });

  if (timeSlots.length !== timeSlotIds.length) {
    throw new Error("One or more TimeSlots not found");
  }

  /* ========= 4. Lấy lịch đã tồn tại trong ngày ========= */
  const existedSchedules = await db.Schedule.findAll({
    where: {
      doctorId,
      workDate,
      timeSlotId: { [Op.in]: timeSlotIds },
    },
    attributes: ["timeSlotId"],
  });

  // Các slot đã có lịch
  const existedSlotIds = existedSchedules.map(
    (schedule) => schedule.timeSlotId
  );

  /* ========= 5. Lọc ra slot CHƯA có lịch ========= */
  const newSlotIds = timeSlotIds.filter(
    (slotId) => !existedSlotIds.includes(slotId)
  );

  if (newSlotIds.length === 0) {
    throw new Error("All selected time slots already have schedules");
  }

  /* ========= 6. Chuẩn bị data để tạo ========= */
  const schedulesToCreate = newSlotIds.map((slotId) => ({
    doctorId,
    workDate,
    timeSlotId: slotId,
    maxPatient,
  }));

  /* ========= 7. Tạo lịch hàng loạt ========= */
  const createdSchedules = await db.Schedule.bulkCreate(schedulesToCreate);

  /* ========= 8. Trả kết quả ========= */
  return {
    createdCount: createdSchedules.length,
    skippedCount: existedSlotIds.length,
    skippedSlotIds: existedSlotIds,
    schedules: createdSchedules,
  };
};

// Lấy danh sách lịch theo filter
const getSchedules = async (filters) => {
  const where = {};
  if (filters.doctorId) where.doctorId = filters.doctorId;
  if (filters.workDate) where.workDate = filters.workDate;

  return db.Schedule.findAll({
    where,
    include: [
      { model: db.Doctor, as: "doctor" },
      { model: db.TimeSlot, as: "timeSlot" },
      { model: db.Booking, as: "bookings" },
    ],
    order: [
      ["workDate", "ASC"],
      ["timeSlotId", "ASC"],
    ],
  });
};

// Cập nhật lịch
const updateSchedule = async (scheduleId, data) => {
  if (!scheduleId) throw new Error("Missing schedule ID");

  const schedule = await db.Schedule.findByPk(scheduleId);
  if (!schedule) throw new Error("Schedule not found");

  const newTimeSlotId = data.timeSlotId || schedule.timeSlotId;
  const newWorkDate = data.workDate || schedule.workDate;

  if (
    newTimeSlotId !== schedule.timeSlotId ||
    newWorkDate !== schedule.workDate
  ) {
    const conflict = await db.Schedule.findOne({
      where: {
        doctorId: schedule.doctorId,
        timeSlotId: newTimeSlotId,
        workDate: newWorkDate,
        id: { [Op.ne]: scheduleId },
      },
    });
    if (conflict)
      throw new Error(
        "Schedule conflict: Doctor already has a schedule for this time slot on this date"
      );
  }

  return schedule.update(data);
};

module.exports = {
  createSchedule,
  createScheduleBulk,
  getSchedules,
  updateSchedule,
};
