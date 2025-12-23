"use strict";
require("dotenv").config();
const nodemailer = require("nodemailer");

// Format date in Vietnamese: "Ngày dd/MM/yyyy" with VN timezone
const formatDateVi = (dateInput) => {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  const formatted = date.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
  return `Ngày ${formatted}`;
};


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

  console.log("Sending booking email to:", email, {
    workDate,
    timeLabel,
  });
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_APP,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  const appUrl = process.env.URL_REACT;
  if (!appUrl) {
    throw new Error("Missing URL_REACT in environment");
  }
  const encodedToken = encodeURIComponent(token);
  const confirmLink = `${appUrl}/confirm-booking?token=${encodedToken}`;
  const cancelLink = `${appUrl}/cancel-booking?token=${encodedToken}`;

  const formattedDate = formatDateVi(workDate);

  const mailOptions = {
    from: `"Booking Care" <${process.env.EMAIL_APP}>`,
    to: email,
    subject: "Xác nhận lịch khám",
    html: `
      <h3>Xin chào ${patientName}</h3>
      <p>Bạn đã đặt lịch khám với thông tin sau:</p>
      <ul>
        <li><b>Bác sĩ:</b> ${doctorName}</li>
        <li><b>Ngày khám:</b> ${formattedDate}</li>
        <li><b>Khung giờ:</b> ${timeLabel}</li>
      </ul>
      <p>Vui lòng xác nhận lịch hẹn:</p>
      <p>
        <a href="${confirmLink}" target="_blank" rel="noopener noreferrer">✅ Xác nhận lịch khám</a>
      </p>
      <p>
        <a href="${cancelLink}" target="_blank" rel="noopener noreferrer">❌ Huỷ lịch khám</a>
      </p>
      <p><i>Nếu bạn không xác nhận, lịch sẽ tự động huỷ.</i></p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendBookingEmail,
};
