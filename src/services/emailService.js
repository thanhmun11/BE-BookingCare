"use strict";
require("dotenv").config();
const nodemailer = require("nodemailer");

const sendBookingEmail = async ({
  email,
  patientName,
  doctorName,
  workDate,
  timeLabel,
  token,
}) => {
  if (!email || !token) {
    throw new Error("Missing email or token");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_APP,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  const confirmLink = `${process.env.FRONTEND_URL}/confirm-booking?token=${token}`;
  const cancelLink = `${process.env.FRONTEND_URL}/cancel-booking?token=${token}`;

  const mailOptions = {
    from: `"Booking Care" <${process.env.EMAIL_APP}>`,
    to: email,
    subject: "Xác nhận lịch khám",
    html: `
      <h3>Xin chào ${patientName}</h3>
      <p>Bạn đã đặt lịch khám với thông tin sau:</p>
      <ul>
        <li><b>Bác sĩ:</b> ${doctorName}</li>
        <li><b>Ngày khám:</b> ${workDate}</li>
        <li><b>Khung giờ:</b> ${timeLabel}</li>
      </ul>
      <p>Vui lòng xác nhận lịch hẹn:</p>
      <p>
        <a href="${confirmLink}">✅ Xác nhận lịch khám</a>
      </p>
      <p>
        <a href="${cancelLink}">❌ Huỷ lịch khám</a>
      </p>
      <p><i>Nếu bạn không xác nhận, lịch sẽ tự động huỷ.</i></p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendBookingEmail,
};
