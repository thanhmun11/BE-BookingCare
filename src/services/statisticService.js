const db = require("../models/index");
const { Op, fn, col } = require("sequelize");

// Normalize date range to half-open [startOfDay(from), startOfNextDay(to)) to avoid double-counting boundary
const normalizeDateRange = (from, to) => {
  if (!from || !to) return undefined;
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + 1); // next day 00:00, exclusive
  return { [Op.gte]: start, [Op.lt]: end };
};

// Lấy doanh thu theo ngày (API cũ - giữ lại để tương thích)
const getRevenueByDate = async ({ from, to }) => {
  if (!from || !to) {
    throw new Error("Missing from or to date");
  }

  const revenueStats = await db.Bill.findAll({
    attributes: [
      [fn("DATE", col("createdAt")), "date"],
      [fn("SUM", col("total")), "revenue"],
    ],
    where: {
      status: "PAID",
      createdAt: normalizeDateRange(from, to),
    },
    group: [fn("DATE", col("createdAt"))],
    order: [[fn("DATE", col("createdAt")), "ASC"]],
    raw: true,
  });

  return revenueStats;
};

// KPI Tổng quan (Total bookings, revenue, today's stats)
const getDashboardKPI = async ({ clinicId, specialtyId, from, to }) => {
  // Build filters
  const scheduleDateWhere = from && to ? { workDate: normalizeDateRange(from, to) } : {};
  const doctorWhere = {
    ...(clinicId && { clinicId }),
    ...(specialtyId && { specialtyId }),
  };
  const bookingWhere = { status: "DONE" };
  const requireDoctor = Object.keys(doctorWhere).length > 0;

  // Tính tổng lượt khám trong khoảng thời gian
  const totalBookings = await db.Booking.count({
    where: bookingWhere,
    include: [
      {
        model: db.Schedule,
        as: "schedule",
        where: scheduleDateWhere,
        attributes: [],
        required: true,
        include: [
          {
            model: db.Doctor,
            as: "doctor",
            where: doctorWhere,
            attributes: [],
            required: requireDoctor,
          },
        ],
      },
    ],
  });

  // Tính tổng doanh thu trong khoảng thời gian (lọc theo Doctor, gắn theo Schedule.workDate)
  const totalRevenueResult = await db.Bill.findOne({
    attributes: [[fn("SUM", col("Bill.total")), "total"]],
    where: {
      status: "PAID",
    },
    include: [
      {
        model: db.MedicalRecord,
        as: "medicalRecord",
        attributes: [],
        required: true,
        include: [
          {
            model: db.Booking,
            as: "booking",
            attributes: [],
            where: bookingWhere,
            required: true,
            include: [
              {
                model: db.Schedule,
                as: "schedule",
                attributes: [],
                required: true,
                where: scheduleDateWhere,
                include: [
                  {
                    model: db.Doctor,
                    as: "doctor",
                    where: doctorWhere,
                    attributes: [],
                    required: requireDoctor,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    raw: true,
  });

  // Tính KPI hôm nay
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayScheduleWhere = {
    workDate: { [Op.gte]: today, [Op.lt]: tomorrow },
  };

  const todayBookings = await db.Booking.count({
    where: bookingWhere,
    include: [
      {
        model: db.Schedule,
        as: "schedule",
        where: todayScheduleWhere,
        attributes: [],
        required: true,
        include: [
          {
            model: db.Doctor,
            as: "doctor",
            where: doctorWhere,
            attributes: [],
            required: requireDoctor,
          },
        ],
      },
    ],
  });

  const todayRevenueResult = await db.Bill.findOne({
    attributes: [[fn("SUM", col("Bill.total")), "total"]],
    where: {
      status: "PAID",
    },
    include: [
      {
        model: db.MedicalRecord,
        as: "medicalRecord",
        attributes: [],
        required: true,
        include: [
          {
            model: db.Booking,
            as: "booking",
            attributes: [],
            where: bookingWhere,
            required: true,
            include: [
              {
                model: db.Schedule,
                as: "schedule",
                attributes: [],
                required: true,
                where: todayScheduleWhere,
                include: [
                  {
                    model: db.Doctor,
                    as: "doctor",
                    where: doctorWhere,
                    attributes: [],
                    required: requireDoctor,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    raw: true,
  });

  return {
    totalBookings: totalBookings || 0,
    totalRevenue: parseFloat(totalRevenueResult?.total) || 0,
    todayBookings: todayBookings || 0,
    todayRevenue: parseFloat(todayRevenueResult?.total) || 0,
  };
};

// Time series data - lượt khám và doanh thu theo ngày
const getTimeSeries = async ({
  clinicId,
  specialtyId,
  metric = "bookings",
  from,
  to,
}) => {
  const scheduleDateWhere = from && to ? { workDate: normalizeDateRange(from, to) } : {};
  const doctorWhere = {
    ...(clinicId && { clinicId }),
    ...(specialtyId && { specialtyId }),
  };
  const requireDoctor = Object.keys(doctorWhere).length > 0;

  if (metric === "bookings") {
    const data = await db.Booking.findAll({
      attributes: [
        [fn("DATE", col("schedule.workDate")), "date"],
        [fn("COUNT", col("Booking.id")), "count"],
      ],
      where: { status: "DONE" },
      include: [
        {
          model: db.Schedule,
          as: "schedule",
          where: scheduleDateWhere,
          attributes: [],
          required: true,
          include: [
            {
              model: db.Doctor,
              as: "doctor",
              where: doctorWhere,
              attributes: [],
              required: requireDoctor,
            },
          ],
        },
      ],
      group: [fn("DATE", col("schedule.workDate"))],
      order: [[fn("DATE", col("schedule.workDate")), "ASC"]],
      subQuery: false,
      raw: true,
    });
    return data;
  } else if (metric === "revenue") {
    // Doanh thu theo ngày làm việc (Schedule.workDate)
    const data = await db.Bill.findAll({
      attributes: [
        [fn("DATE", col("medicalRecord.booking.schedule.workDate")), "date"],
        [fn("SUM", col("Bill.total")), "revenue"],
      ],
      include: [
        {
          model: db.MedicalRecord,
          as: "medicalRecord",
          attributes: [],
          required: true,
          include: [
            {
              model: db.Booking,
              as: "booking",
              attributes: [],
              where: { status: "DONE" },
              required: true,
              include: [
                {
                  model: db.Schedule,
                  as: "schedule",
                  attributes: [],
                  where: scheduleDateWhere,
                  required: true,
                  include: [
                    {
                      model: db.Doctor,
                      as: "doctor",
                      where: doctorWhere,
                      attributes: [],
                      required: requireDoctor,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      where: { status: "PAID" },
      group: [fn("DATE", col("medicalRecord.booking.schedule.workDate"))],
      order: [[fn("DATE", col("medicalRecord.booking.schedule.workDate")), "ASC"]],
      raw: true,
    });
    return data;
  }
};

// Top Doctors - Thống kê theo bác sĩ
const getTopDoctors = async ({
  clinicId,
  specialtyId,
  limit = 10,
}) => {
  const doctorWhere = {
    ...(clinicId && { clinicId }),
    ...(specialtyId && { specialtyId }),
  };
  const requireDoctor = Object.keys(doctorWhere).length > 0;

  // Bước 1: Lấy danh sách doctorId và booking count
  const bookingData = await db.Booking.findAll({
    attributes: [
      [db.sequelize.col("schedule.doctorId"), "doctorId"],
      [fn("COUNT", col("Booking.id")), "bookingCount"],
    ],
    include: [
      {
        model: db.Schedule,
        as: "schedule",
        attributes: [],
        required: true,
        include: [
          {
            model: db.Doctor,
            as: "doctor",
            where: doctorWhere,
            attributes: [],
            required: requireDoctor,
          },
        ],
      },
    ],
    where: { status: "DONE" },
    group: [db.sequelize.col("schedule.doctorId")],
    subQuery: false,
    raw: true,
  });

  const doctorIds = bookingData.map((b) => b.doctorId);
  
  if (doctorIds.length === 0) {
    return [];
  }

  // Bước 2: Lấy thông tin doctor (user, specialty, clinic)
  const doctors = await db.Doctor.findAll({
    where: { id: doctorIds },
    attributes: ["id"],
    include: [
      {
        model: db.User,
        as: "user",
        attributes: ["fullName"],
      },
      {
        model: db.Specialty,
        as: "specialty",
        attributes: ["name"],
      },
      {
        model: db.Clinic,
        as: "clinic",
        attributes: ["name"],
      },
    ],
  });

  const doctorMap = {};
  doctors.forEach((doc) => {
    doctorMap[doc.id] = doc;
  });

  // Bước 3: Lấy revenue từ Bill cho từng doctor (Sequelize, an toàn & rõ ràng)
  const revenueRows = await db.Bill.findAll({
    attributes: [
      [db.sequelize.col("medicalRecord.booking.schedule.doctorId"), "doctorId"],
      [fn("SUM", col("Bill.total")), "revenue"],
    ],
    where: { status: "PAID" },
    include: [
      {
        model: db.MedicalRecord,
        as: "medicalRecord",
        attributes: [],
        required: true,
        include: [
          {
            model: db.Booking,
            as: "booking",
            attributes: [],
            required: true,
            include: [
              {
                model: db.Schedule,
                as: "schedule",
                attributes: [],
                required: true,
                include: [
                  {
                    model: db.Doctor,
                    as: "doctor",
                    attributes: [],
                    where: doctorWhere,
                    required: requireDoctor,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    group: [db.sequelize.col("medicalRecord.booking.schedule.doctorId")],
    raw: true,
  });

  const revenueMap = {};
  revenueRows.forEach((r) => {
    revenueMap[r.doctorId] = parseFloat(r.revenue) || 0;
  });

  // Bước 4: Map và sort
  const result = bookingData
    .map((booking) => {
      const doctorId = booking.doctorId;
      const doctor = doctorMap[doctorId];
      if (!doctor) return null;

      return {
        doctorId,
        doctorName: doctor.user.fullName,
        specialty: doctor.specialty.name,
        clinic: doctor.clinic.name,
        bookingCount: parseInt(booking.bookingCount) || 0,
        revenue: revenueMap[doctorId] || 0,
      };
    })
    .filter((d) => d !== null)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);

  return result;
};

// Generic comparison stats - So sánh theo clinic hoặc specialty (all-time, không lọc)
const getComparisonStats = async (groupByField, nameField, modelName) => {
  const groupColumn = `schedule.doctor.${groupByField}`;
  
  // Đếm lượt khám
  const bookingData = await db.Booking.findAll({
    attributes: [
      [db.sequelize.col(groupColumn), groupByField],
      [fn("COUNT", col("Booking.id")), "bookingCount"],
    ],
    include: [
      {
        model: db.Schedule,
        as: "schedule",
        attributes: [],
        required: true,
        include: [
          {
            model: db.Doctor,
            as: "doctor",
            attributes: [],
            required: true,
          },
        ],
      },
    ],
    where: { status: "DONE" },
    group: [db.sequelize.col(groupColumn)],
    subQuery: false,
    raw: true,
  });

  const ids = bookingData.map((item) => item[groupByField]);
  if (ids.length === 0) return [];

  // Thông tin model (Clinic hoặc Specialty)
  const Model = db[modelName];
  const items = await Model.findAll({
    where: { id: ids },
    attributes: ["id", "name"],
  });
  const itemMap = items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  // Doanh thu (all-time)
  const revenueRows = await db.Bill.findAll({
    attributes: [
      [db.sequelize.col(`medicalRecord.booking.${groupColumn}`), groupByField],
      [fn("SUM", col("Bill.total")), "revenue"],
    ],
    where: { status: "PAID" },
    include: [
      {
        model: db.MedicalRecord,
        as: "medicalRecord",
        attributes: [],
        required: true,
        include: [
          {
            model: db.Booking,
            as: "booking",
            attributes: [],
            where: { status: "DONE" },
            required: true,
            include: [
              {
                model: db.Schedule,
                as: "schedule",
                attributes: [],
                required: true,
                include: [
                  {
                    model: db.Doctor,
                    as: "doctor",
                    attributes: [],
                    required: true,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    group: [db.sequelize.col(`medicalRecord.booking.${groupColumn}`)],
    raw: true,
  });

  const revenueMap = revenueRows.reduce((acc, r) => {
    acc[r[groupByField]] = parseFloat(r.revenue) || 0;
    return acc;
  }, {});

  return bookingData
    .map((item) => {
      const info = itemMap[item[groupByField]];
      if (!info) return null;
      return {
        [`${groupByField}`]: item[groupByField],
        [nameField]: info.name,
        bookingCount: parseInt(item.bookingCount) || 0,
        revenue: revenueMap[item[groupByField]] || 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.revenue - a.revenue);
};

// Clinics comparison - So sánh các cơ sở (all-time, không lọc)
const getClinicsStats = async () => {
  return getComparisonStats("clinicId", "clinicName", "Clinic");
};

// Specialties comparison - So sánh các chuyên khoa (all-time, không lọc)
const getSpecialtiesStats = async () => {
  return getComparisonStats("specialtyId", "specialtyName", "Specialty");
};

module.exports = {
  getRevenueByDate,
  getDashboardKPI,
  getTimeSeries,
  getTopDoctors,
  getClinicsStats,
  getSpecialtiesStats,
};
