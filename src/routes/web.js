import express from "express";
import userController from "../controllers/userController.js";
import doctorController from "../controllers/doctorController.js";
import patientController from "../controllers/patientController";
import specialtyController from "../controllers/specialtyController";
import clinicController from "../controllers/clinicController";
import handbookController from "../controllers/handbookController";
import chatController from "../controllers/chatController.js";
import medicineController from "../controllers/medicineController.js";
import bookingController from "../controllers/bookingController.js";
import scheduleController from "../controllers/scheduleController.js";
import timeSlotController from "../controllers/timeSlotController.js";
import prescriptionController from "../controllers/prescriptionController.js";
import medicalRecordController from "../controllers/medicalRecordController.js";
import billController from "../controllers/billController.js";
import statisticController from "../controllers/statisticController.js";

let router = express.Router();

let initWebRoutes = (app) => {
  router.get("/", (req, res) => {
    return res.send("Hello World!");
  });

  // user (auth + management)
  router.post("/api/users/register", userController.registerUser);
  router.post("/api/users/login", userController.loginUser);
  router.get("/api/users/profile", userController.getUserProfile);

  // doctor
  router.post("/api/doctors", doctorController.createDoctor);
  router.patch("/api/doctors/:id", doctorController.updateDoctor);
  router.get("/api/doctors", doctorController.getDoctors);
  router.get("/api/doctors/:id", doctorController.getDoctorById);

  // patient
  router.post(
    "/api/patient-book-appointment",
    patientController.postBookAppointment
  );
  router.post(
    "/api/verify-book-appointment",
    patientController.postVerifyBookAppointment
  );

  // specialty
  router.post("/api/specialties", specialtyController.createSpecialty);
  router.get("/api/specialties", specialtyController.getSpecialties);
  router.get("/api/specialties/:id", specialtyController.getSpecialtyById);
  router.patch("/api/specialties/:id", specialtyController.updateSpecialty);
  router.delete("/api/specialties/:id", specialtyController.deleteSpecialty);

  // clinic
  router.post("/api/clinics", clinicController.createClinic);
  router.get("/api/clinics", clinicController.getClinics);
  router.get("/api/clinics/:id", clinicController.getClinicById);
  router.patch("/api/clinics/:id", clinicController.updateClinic);
  router.delete("/api/clinics/:id", clinicController.deleteClinic);

  // handbook
  router.post("/api/handbooks", handbookController.createHandbook);
  router.get("/api/handbooks", handbookController.getHandbooks);
  router.get("/api/handbooks/:id", handbookController.getHandbookById);
  router.patch("/api/handbooks/:id", handbookController.updateHandbook);
  router.delete("/api/handbooks/:id", handbookController.deleteHandbook);

  // medicine
  router.post("/api/medicines", medicineController.createMedicine);
  router.get("/api/medicines", medicineController.getMedicines);
  router.get("/api/medicines/:id", medicineController.getMedicineById);
  router.patch("/api/medicines/:id", medicineController.updateMedicine);
  router.delete("/api/medicines/:id", medicineController.deleteMedicine);

  // timeslot
  router.post("/api/time-slots", timeSlotController.createTimeSlot);
  router.get("/api/time-slots", timeSlotController.getTimeSlots);
  router.get("/api/time-slots/:id", timeSlotController.getTimeSlotById);
  router.patch("/api/time-slots/:id", timeSlotController.updateTimeSlot);
  router.delete("/api/time-slots/:id", timeSlotController.deleteTimeSlot);

  // schedule
  router.post("/api/schedules", scheduleController.createSchedule);
  router.post("/api/schedules/bulk", scheduleController.createScheduleBulk);
  router.get("/api/schedules", scheduleController.getSchedules);
  router.patch("/api/schedules/:id", scheduleController.updateSchedule);

  // booking
  router.post("/api/bookings", bookingController.createBooking);
  router.patch("/api/bookings/:id/confirm", bookingController.confirmBooking);
  router.patch("/api/bookings/:id/cancel", bookingController.cancelBooking);
  router.get("/api/bookings/confirm", bookingController.confirmBookingByToken);
  router.get("/api/bookings/cancel", bookingController.cancelBookingByToken);

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

  // chat
  router.post("/api/chat-booking", chatController.chatBooking);

  return app.use("/", router);
};

export default initWebRoutes;
