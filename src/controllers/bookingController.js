const bookingService = require("../services/bookingService");

const createBooking = async (req, res) => {
  try {
    const booking = await bookingService.createBooking(req.body);
    return res.status(201).json(booking);
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

const confirmBooking = async (req, res) => {
  try {
    const booking = await bookingService.confirmBooking(req.params.id);
    return res.status(200).json(booking);
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await bookingService.cancelBooking(req.params.id);
    return res.status(200).json(booking);
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

const confirmBookingByToken = async (req, res) => {
  try {
    const booking = await bookingService.confirmBookingByToken(req.query.token);

    return res.status(200).json({
      message: "Booking confirmed successfully",
      booking,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

const cancelBookingByToken = async (req, res) => {
  try {
    const booking = await bookingService.cancelBookingByToken(req.query.token);

    return res.status(200).json({
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

module.exports = {
  createBooking,
  confirmBooking,
  cancelBooking,
  confirmBookingByToken,
  cancelBookingByToken,
};
