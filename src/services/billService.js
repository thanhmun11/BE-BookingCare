const db = require("../models/index");

const createBill = async ({ medicalRecordId, method }) => {
  /* ========= 1. Validate ========= */
  if (!medicalRecordId || !method) {
    throw new Error("Missing required parameters");
  }

  /* ========= 2. Check medical record ========= */
  const medicalRecord = await db.MedicalRecord.findByPk(medicalRecordId);

  if (!medicalRecord) {
    throw new Error("Medical record not found");
  }

  /* ========= 3. Check đã có bill chưa ========= */
  const existedBill = await db.Bill.findOne({
    where: { medicalRecordId },
  });

  if (existedBill) {
    throw new Error("Bill already exists for this medical record");
  }

  /* ========= 4. Lấy fee của doctor ========= */
  const doctor = await db.Doctor.findByPk(medicalRecord.doctorId);

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  if (!doctor.fee) {
    throw new Error("Doctor fee not set");
  }

  /* ========= 5. Tạo bill ========= */
  const bill = await db.Bill.create({
    patientId: medicalRecord.patientId,
    medicalRecordId,
    total: doctor.fee,
    status: "UNPAID",
    method: "UNDEFINED",
  });

  return bill;
};

const payBill = async ({ billId, method }) => {
  if (!billId || !method) {
    throw new Error("Missing required parameters");
  }

  const bill = await db.Bill.findByPk(billId);
  if (!bill) throw new Error("Bill not found");

  if (bill.status === "PAID") {
    throw new Error("Bill already paid");
  }

  if (method === "UNDEFINED") {
    throw new Error("Invalid payment method");
  }

  await bill.update({
    status: "PAID",
    method,
  });

  return bill;
};

module.exports = {
  createBill,
  payBill,
};
