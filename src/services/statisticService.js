const db = require("../models/index");
const { Op, fn, col } = require("sequelize");

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
      createdAt: {
        [Op.between]: [from, to],
      },
    },
    group: [fn("DATE", col("createdAt"))],
    order: [[fn("DATE", col("createdAt")), "ASC"]],
    raw: true,
  });

  return revenueStats;
};

module.exports = {
  getRevenueByDate,
};
