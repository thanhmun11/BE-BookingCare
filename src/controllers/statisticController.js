const statisticService = require("../services/statisticService");

const getRevenueByDate = async (req, res) => {
  try {
    const { from, to } = req.query;

    const data = await statisticService.getRevenueByDate({ from, to });

    return res.status(200).json({
      errCode: 0,
      data,
    });
  } catch (error) {
    return res.status(400).json({
      errCode: 1,
      errMessage: error.message,
    });
  }
};

module.exports = {
  getRevenueByDate,
};
