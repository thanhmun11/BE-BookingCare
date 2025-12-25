import express from "express";
import userController from "../controllers/userController.js";
import doctorController from "../controllers/doctorController.js";
import specialtyController from "../controllers/specialtyController";
import clinicController from "../controllers/clinicController";
import handbookController from "../controllers/handbookController";
import medicineController from "../controllers/medicineController.js";
import bookingController from "../controllers/bookingController.js";
import scheduleController from "../controllers/scheduleController.js";
import timeSlotController from "../controllers/timeSlotController.js";
import prescriptionController from "../controllers/prescriptionController.js";
import medicalRecordController from "../controllers/medicalRecordController.js";
import billController from "../controllers/billController.js";
import statisticController from "../controllers/statisticController.js";
import chatController from "../controllers/chatController.js";
let router = express.Router();

let initWebRoutes = (app) => {
  router.get("/", (req, res) => {
    return res.send("Hello World!");
  });

  // user (auth + management)
  router.post("/api/users/register", userController.registerUser);
  router.post("/api/users/login", userController.loginUser);
  router.get("/api/users/profile", userController.getUserProfile);
  router.post("/api/users/create", userController.createUser); // Admin tạo user với role tùy chỉnh
  router.get("/api/users", userController.getAllUsers); // Lấy danh sách users
  router.get("/api/users/getAllDoctors", userController.getAllDoctors); // Lấy danh sách doctors
  router.delete("/api/users/:id", userController.deleteUser); // Xóa user
  router.put("/api/users/:id", userController.updateUser); // Cập nhật user

  // doctor
  router.post("/api/doctors", doctorController.createDoctor); // tạo doctor
  router.patch("/api/doctors/:id", doctorController.updateDoctor); // cập nhật doctor
  router.get("/api/doctors", doctorController.getDoctors); // lấy danh sách doctors
  router.get("/api/doctors/:id", doctorController.getDoctorById); // lấy doctor by id

  // specialty
  router.post("/api/specialties", specialtyController.createSpecialty); // tạo specialty
  router.get("/api/specialties", specialtyController.getSpecialties); // lấy danh sách specialties
  router.get("/api/specialties/:id", specialtyController.getSpecialtyById); // lấy specialty by id
  router.patch("/api/specialties/:id", specialtyController.updateSpecialty); // cập nhật specialty
  router.delete("/api/specialties/:id", specialtyController.deleteSpecialty); // xóa specialty

  // clinic
  router.post("/api/clinics", clinicController.createClinic); // tạo clinic
  router.get("/api/clinics", clinicController.getClinics); // lấy danh sách clinics
  router.get("/api/clinics/:id", clinicController.getClinicById); // lấy clinic by id
  router.patch("/api/clinics/:id", clinicController.updateClinic); // cập nhật clinic
  router.delete("/api/clinics/:id", clinicController.deleteClinic); // xóa clinic

  // handbook
  router.post("/api/handbooks", handbookController.createHandbook); // tạo handbook
  router.get("/api/handbooks", handbookController.getHandbooks); // lấy danh sách handbooks
  router.get("/api/handbooks/:id", handbookController.getHandbookById); // lấy handbook by id
  router.patch("/api/handbooks/:id", handbookController.updateHandbook); // cập nhật handbook
  router.delete("/api/handbooks/:id", handbookController.deleteHandbook); // xóa handbook

  // medicine
  router.post("/api/medicines", medicineController.createMedicine); // tạo medicine
  router.get("/api/medicines", medicineController.getMedicines); // lấy danh sách medicines
  router.get("/api/medicines/:id", medicineController.getMedicineById); // lấy medicine by id
  router.patch("/api/medicines/:id", medicineController.updateMedicine); // cập nhật medicine
  router.delete("/api/medicines/:id", medicineController.deleteMedicine); // xóa medicine

  // timeslot
  router.post("/api/time-slots", timeSlotController.createTimeSlot); // tạo time slot
  router.get("/api/time-slots", timeSlotController.getTimeSlots); // lấy danh sách time slots
  router.get("/api/time-slots/:id", timeSlotController.getTimeSlotById); // lấy time slot by id
  router.patch("/api/time-slots/:id", timeSlotController.updateTimeSlot); // cập nhật time slot
  router.delete("/api/time-slots/:id", timeSlotController.deleteTimeSlot); // xóa time slot

  // schedule
  router.post("/api/schedules", scheduleController.createSchedule); // tạo schedule
  router.post("/api/schedules/bulk", scheduleController.createScheduleBulk); // tạo nhiều schedule
  router.get("/api/schedules", scheduleController.getSchedules); // lấy danh sách schedules
  router.patch("/api/schedules/:id", scheduleController.updateSchedule); // cập nhật schedule

  // booking
  router.post("/api/bookings", bookingController.createBooking);
  router.get("/api/bookings/:id", bookingController.getBookingById);
  // Email confirm / cancel
  router.get("/api/bookings/confirm", bookingController.confirmBookingByToken);
  router.get("/api/bookings/cancel", bookingController.cancelBookingByToken);
  // patient booking history + cancel (compat with FE)
  router.get("/api/patient/bookings", bookingController.getBookings);
  router.patch("/api/patient/bookings/cancel", bookingController.cancelBooking);
  // doctor booking management
  router.get("/api/doctor/bookings", bookingController.getDoctorBookings);

  // medical record
  router.post(
    "/api/medical-records",
    medicalRecordController.createMedicalRecord
  );

  // prescription
  router.post("/api/prescriptions", prescriptionController.createPrescription);

  // bill
  router.post("/api/bills", billController.createBill);
  router.patch("/api/bills/pay", billController.payBill);

  // statistic
  router.get(
    "/api/statistics/revenue-by-date",
    statisticController.getRevenueByDate
  );
  router.get("/api/statistics/dashboard", statisticController.getDashboardKPI);
  router.get("/api/statistics/time-series", statisticController.getTimeSeries);
  router.get("/api/statistics/doctors", statisticController.getTopDoctors);
  router.get("/api/statistics/clinics", statisticController.getClinicsStats);
  router.get(
    "/api/statistics/specialties",
    statisticController.getSpecialtiesStats
  );
  router.get("/api/statistics/bookings", statisticController.getBookingDetails);

  // chat
  router.post("/api/chat-booking", chatController.chatBooking);

  return app.use("/", router);
};

export default initWebRoutes;
