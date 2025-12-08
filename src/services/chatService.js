const db = require("../models/index");

const GEMINI_URL = `${process.env.GEMINI_BASE_URL}/v1beta/models/${process.env.GEMINI_MODEL}:generateContent`;

// ===== Mapping all code =====
const roleMapping = { R1: "Quản trị viên", R2: "Bác sĩ", R3: "Bệnh nhân" };
const statusMapping = {
  S1: "Lịch hẹn mới",
  S2: "Đã xác nhận",
  S3: "Đã khám xong",
  S4: "Đã hủy",
};
const timeMapping = {
  T1: "8:00 - 9:00",
  T2: "9:00 - 10:00",
  T3: "10:00 - 11:00",
  T4: "11:00 - 12:00",
  T5: "13:00 - 14:00",
  T6: "14:00 - 15:00",
  T7: "15:00 - 16:00",
  T8: "16:00 - 17:00",
};
const positionMapping = {
  P0: "Bác sĩ",
  P1: "Thạc sĩ",
  P2: "Tiến sĩ",
  P3: "Phó giáo sư",
  P4: "Giáo sư",
};
const genderMapping = { M: "Nam", F: "Nữ", O: "Khác" };
const priceMapping = {
  PRI1: "200.000",
  PRI2: "250.000",
  PRI3: "300.000",
  PRI4: "350.000",
  PRI5: "400.000",
  PRI6: "450.000",
  PRI7: "500.000",
};
const paymentMapping = { PAY1: "Tiền mặt", PAY2: "Thẻ ATM", PAY3: "Tất cả" };
const provinceMapping = {
  PRO1: "Hà Nội",
  PRO2: "Hồ Chí Minh",
  PRO3: "Đà Nẵng",
  PRO4: "Cần Thơ",
  PRO5: "Bình Dương",
  PRO6: "Đồng Nai",
  PRO7: "Quảng Ninh",
  PRO8: "Thừa Thiên Huế",
  PRO9: "Quảng Bình",
  PRO10: "Khánh Hòa",
};

// ===== Map SQL row codes sang giá trị hiển thị =====
const mapRowCodes = (rows) =>
  rows.map((r) => ({
    ...r,
    role: r.roleId ? roleMapping[r.roleId] || r.roleId : undefined,
    status: r.status ? statusMapping[r.status] || r.status : undefined,
    time: r.time ? timeMapping[r.time] || r.time : undefined,
    position: r.position
      ? positionMapping[r.position] || r.position
      : undefined,
    gender: r.gender ? genderMapping[r.gender] || r.gender : undefined,
    price: r.price ? priceMapping[r.price] || r.price : undefined,
    payment: r.payment ? paymentMapping[r.payment] || r.payment : undefined,
    province: r.province
      ? provinceMapping[r.province] || r.province
      : undefined,
  }));

// Mapping all code liền gọn
const mappingAllCode = `
Mappings (do not invent any codes, use only these):

Roles: R1=Quản trị viên; R2=Bác sĩ; R3=Bệnh nhân
Status: S1=Lịch hẹn mới; S2=Đã xác nhận; S3=Đã khám xong; S4=Đã hủy
Time: T1=8:00-9:00; T2=9:00-10:00; T3=10:00-11:00; T4=11:00-12:00; T5=13:00-14:00; T6=14:00-15:00; T7=15:00-16:00; T8=16:00-17:00
Position: P0=Bác sĩ; P1=Thạc sĩ; P2=Tiến sĩ; P3=Phó giáo sư; P4=Giáo sư
Gender: M=Nam; F=Nữ; O=Khác
Price: PRI1=200000; PRI2=250000; PRI3=300000; PRI4=350000; PRI5=400000; PRI6=450000; PRI7=500000
Payment: PAY1=Tiền mặt; PAY2=Thẻ ATM; PAY3=Tất cả
Province: PRO1=Hà Nội; PRO2=Hồ Chí Minh; PRO3=Đà Nẵng; PRO4=Cần Thơ; PRO5=Bình Dương; PRO6=Đồng Nai; PRO7=Quảng Ninh; PRO8=Thừa Thiên Huế; PRO9=Quảng Bình; PRO10=Khánh Hòa
`;

// ===== 1. Call Gemini lần 1: sinh SQL =====
const callGeminiSQL = async (apiKey, prompt) => {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { response_mime_type: "application/json" },
    }),
  });
  const data = await res.json();

  console.log("Gemini SQL response:", JSON.stringify(data));
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
};

// ===== 2. Call Gemini lần 2: viết reply =====
const callGeminiExplain = async (apiKey, prompt) => {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { response_mime_type: "text/plain" }, // text-only
    }),
  });
  const data = await res.json();
  console.log("Gemini Explain response:", JSON.stringify(data));
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

// ===== 3. Lấy danh sách model =====
const getModels = () =>
  Object.keys(db).filter((k) => !["sequelize", "Sequelize"].includes(k));

// ===== 4. Xây dựng schema đơn giản =====
const buildSchema = () => {
  const parts = [];
  const tables = [];

  for (const name of getModels()) {
    const model = db[name];
    if (!model?.rawAttributes) continue;

    const tableName = model.getTableName().toString();
    const columns = Object.keys(model.rawAttributes);

    // Thêm mô tả ngắn gọn (prototype)
    let desc = "generic table";
    const t = tableName.toLowerCase();
    if (t.includes("user"))
      desc = "Đây là bảng người dùng gồm thông tin về bệnh nhân và bác sĩ";
    else if (t.includes("doctor"))
      desc = "Đây là bảng bác sĩ gồm thông tin về bác sĩ";
    else if (t.includes("booking") || t.includes("appointment"))
      desc = "Đây là bảng đặt lịch khám";
    else if (t.includes("clinic")) desc = "Đây là bảng phòng khám";
    else if (t.includes("schedule"))
      desc = "Đây là bảng lịch làm việc của bác sĩ";
    else if (t.includes("specialties")) desc = "Đây là bảng chuyên khoa y tế";
    else if (t.includes("markdowns"))
      desc =
        "Đây là bảng các bài viết mô tả về bác sĩ || chuyên khoa || phòng khám";

    parts.push(`${tableName}(${columns.join(", ")}) — ${desc}`);
    tables.push(tableName.toLowerCase());
  }

  return { schema: parts.join("\n"), tables };
};

// ===== 5. Làm sạch dữ liệu SQL =====
const sanitize = (rows = [], maxLength = 2000) => {
  const omitted = {};
  const clean = rows.map((r) => {
    const o = {};
    for (const k in r) {
      const v = r[k];
      if (Buffer.isBuffer?.(v)) {
        omitted[k] = (omitted[k] || 0) + 1;
        o[k] = "<binary>";
      } else if (typeof v === "string" && v.length > maxLength) {
        omitted[k] = (omitted[k] || 0) + 1;
        o[k] = v.slice(0, maxLength) + "...";
      } else {
        o[k] = v;
      }
    }
    return o;
  });
  return { clean, omitted };
};

// ===== 6. Kiểm tra SQL an toàn =====
const safeSql = (sql, allowed = []) => {
  if (!sql) return false;
  const s = sql.toLowerCase().trim();

  if (!s.startsWith("select")) return false;

  const dangerous = ["insert", "update", "delete", "drop", "alter", "truncate"];
  if (dangerous.some((k) => s.includes(k))) return false;

  const matches = [...s.matchAll(/from\s+(\w+)|join\s+(\w+)/gi)];
  const tables = matches
    .map((m) => (m[1] || m[2] || "").toLowerCase())
    .filter(Boolean);
  if (tables.length === 0) return false;

  return tables.every((t) => allowed.includes(t));
};

// ===== 7. ChatBooking main function =====
const chatBooking = async (body = {}) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { errCode: 2, errMessage: "Missing GEMINI_API_KEY" };

    const { message = "", language = "" } = body;
    if (!message) return { errCode: 3, errMessage: "Missing message" };
    if (!language) return { errCode: 4, errMessage: "Missing language" };

    const { schema, tables: allowedTables } = buildSchema();

    // ===== Prompt lần 1: sinh SQL =====
    const askSql = `
You are an AI assistant for an online medical booking app.
- Only generate SQL if the user asks about database information (appointments, doctors, users, clinics, schedules, bookings, etc.).
- If no DB query is needed, set run_sql=false and provide the answer in "answer".
- IMPORTANT: DO NOT SELECT image columns (image, contenHTML ) - these are binary/base64 data
- Use SELECT [specific columns] instead of SELECT * when possible
If the user question is ambiguous, ask for clarification by setting 
"run_sql": false and writing a natural answer explaining what information is missing.

Database schema (tables and columns, do NOT invent any table/column):
${schema}
Mappings:
${mappingAllCode}
- Users table has:
  - firstName: Tên chính (ví dụ: "Thành")
  - lastName: Họ + tên đệm (ví dụ: "Nguyễn Xuân")
- The user's full name = lastName + ' ' + firstName
- When generating SQL to match a doctor by name, use CONCAT(lastName, ' ', firstName) to match the full name.
- Do not assume the first word is firstName or the last word is lastName.

User message: ${message}

Return ONLY a single JSON object:
{
  "run_sql": true|false,
  "sql": "SELECT ...",
  "answer": "natural answer here is ${language} "
}

Rules:
- Respond strictly in JSON format; no extra text.
Example: {"run_sql": false, "sql": "", "answer": "........"} || {"run_sql": true, "sql": "SELECT ..." }
`;

    const rawSql = await callGeminiSQL(apiKey, askSql);
    console.log("Generated raw SQL:", rawSql);
    let sqlObj;
    try {
      sqlObj = JSON.parse(rawSql);
    } catch {
      return {
        errCode: 5,
        errMessage: "Lỗi phân tích JSON từ Gemini SQL",
        raw: rawSql,
      };
    }

    if (!sqlObj.sql)
      if (!sqlObj.run_sql) {
        // Gemini nói không cần query SQL, chỉ trả answer
        return {
          errCode: 0,
          reply: sqlObj.answer || "Xin lỗi, tôi không có thông tin.",
        };
      }

    let sql = sqlObj.sql.replace(/;$/, "");
    if (!/limit/i.test(sql)) sql += " LIMIT 10";

    if (!safeSql(sql, allowedTables))
      return { errCode: 6, errMessage: "SQL không an toàn", sql };

    // ===== Chạy SQL =====
    let rows = [];
    try {
      rows = await db.sequelize.query(sql, {
        type: db.Sequelize.QueryTypes.SELECT,
      });
    } catch (e) {
      console.error("SQL execution failed", e);
      return {
        errCode: 0,
        reply: "Xin lỗi, bạn có thể nói rõ hơn thông tin cần tìm không?",
        sql,
      };
    }

    // Loại bỏ các trường image ngay sau khi query
    const imageFields = ["image", "contenHTML"];
    rows = rows.map((row) => {
      const cleaned = { ...row };
      imageFields.forEach((field) => delete cleaned[field]);
      return cleaned;
    });

    // Map dữ liệu SQL sang hiển thị
    const mappedRows = mapRowCodes(rows);

    const { clean, omitted } = sanitize(mappedRows.slice(0, 200));

    // ===== Prompt lần 2: tạo reply =====
    const askExplain = `
You are an AI assistant for an online medical booking app.
User asked: ${message}
SQL query results:
${JSON.stringify(clean, null, 2)}

Use the following URL patterns if you want to add clickable links:
- Doctor detail page: http://localhost:3000/detail-doctor/{id}
- Specialty detail page: http://localhost:3000/detail-specialty/{id}
- Clinic detail page: http://localhost:3000/detail-clinic/{id}
- All doctors: http://localhost:3000/all-directory?tab=doctor
- All clinics: http://localhost:3000/all-directory?tab=clinic
- All specialties: http://localhost:3000/all-directory?tab=specialty

Rules:
- Only use these URLs, never invent others.
- Replace {id} with actual values from the SQL results.
- Use Markdown format for all clickable links: [Link Text](URL)
- Do not output raw URLs
- Only include a link if it helps the user take the next action.
- If the user wants to book an appointment with a doctor, do NOT invent a booking URL.
- Instead, instruct the user to click on the doctor's detail page to view more information and book an appointment.
- Use the doctor detail URL from the SQL results: http://localhost:3000/detail-doctor/{id}
- Write it in a friendly, helpful way, e.g.:
Write a concise, friendly reply in ${language}.
- Explains results clearly like a medical assistant.
- Can suggest next actions to users
`;

    const finalReply = await callGeminiExplain(apiKey, askExplain);

    return { errCode: 0, reply: finalReply || sqlObj.answer || "" };
  } catch (e) {
    return { errCode: -1, errMessage: e.message };
  }
};

module.exports = {
  chatBooking,
};
