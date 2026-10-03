# คณิตสนุก ป.3–ป.4 🧮

เว็บแอปเกมฝึกคณิตศาสตร์สำหรับนักเรียนชั้นประถมศึกษาปีที่ 3–4  
ครอบคลุมพื้นฐานเทอม 2: **การคูณ การหาร เศษส่วน และทศนิยม**

ทำงานได้**ออฟไลน์**ทั้งหมด (ไม่ต้องมีเซิร์ฟเวอร์หลังบ้าน)  
คะแนน / ดาว / ความคืบหน้าเก็บใน `localStorage` ของเบราว์เซอร์

---

## วิธีเปิดใช้งาน

### วิธีที่ 1 — เปิดไฟล์ตรง ๆ (ง่ายสุด)

1. ไปที่โฟลเดอร์โปรเจกต์
2. ดับเบิลคลิกไฟล์ `index.html`  
   หรือลากไฟล์ไปวางใน Chrome / Edge / Firefox / Safari

### วิธีที่ 2 — รันเซิร์ฟเวอร์ท้องถิ่น (แนะนำ)

เปิด Terminal / Command Prompt แล้วรัน:

```bash
cd /workspace/math-practice-p34
python3 -m http.server 8080
```

จากนั้นเปิดเบราว์เซอร์ไปที่:

```
http://localhost:8080
```

(ถ้าใช้ Python 2 ให้ใช้ `python -m SimpleHTTPServer 8080`)

---

## โหมดเกม

| โหมด | ชื่อ | รายละเอียด |
|------|------|------------|
| ⚡ | **คูณเร็ว** | สูตรคูณ, หาจำนวนที่หายไป, คูณเลขยาว — มีจับเวลา |
| 🎯 | **หารแม่น** | หารลงตัว และหารมีเศษ |
| 🍕 | **เศษส่วนสนุก** | อ่านเศษส่วนจากแถบสี, เปรียบเทียบ, บวก/ลบส่วนเท่ากัน, เศษส่วนเท่ากัน |
| 🔍 | **ทศนิยมนักสืบ** | ค่าประจำหลัก, เปรียบเทียบ, บวก/ลบ, เศษส่วน→ทศนิยม, ปัดเศษ |
| 🌟 | **ท้าทายรวม** | สุ่มผสมทุกเรื่อง (ปลดล็อกเมื่อเล่นโหมดอื่นครบ) |

แต่ละรอบมี **10 ข้อ**  
ตอบผิดจะแสดงคำตอบถูกพร้อมคำอธิบายภาษาไทยแบบสั้น ๆ

---

## การตั้งค่า

- **ชั้นปี:** ป.3 / ป.4 — ปรับช่วงตัวเลขให้เหมาะกับระดับ
- **ความยาก:** ระดับ 1 (ปานกลาง) / ระดับ 2 (ยาก)
- **เสียง:** กดปุ่ม 🔊 เพื่อเปิด/ปิดเสียงเอฟเฟกต์
- **ดาว:** ได้ตามความแม่นยำ (≥50% ★, ≥70% ★★, ≥90% ★★★)
- **สตรีค:** ตอบถูกติดกันได้โบนัสคะแนน

---

## โครงสร้างไฟล์

```
math-practice-p34/
├── index.html          ← หน้าหลัก (เปิดไฟล์นี้)
├── css/
│   └── style.css       ← สไตล์สีสัน น่ารัก รองรับมือถือ/แท็บเล็ต
├── js/
│   ├── questions.js    ← สร้างคำถามสุ่มหลากหลาย
│   └── app.js          ← เกม, คะแนน, localStorage, เสียง
├── assets/             ← (ว่าง — พร้อมใส่รูปเพิ่มได้)
└── README.md           ← คู่มือนี้
```

ไม่มีขั้นตอน build — แค่ HTML + CSS + JS ธรรมดา

---

## เคล็ดลับสำหรับผู้ปกครอง / ครู

- ใช้บนแท็บเล็ตหรือมือถือได้ดี (ปุ่มใหญ่ นิ้วแตะง่าย)
- สลับชั้นปีและความยากตามความพร้อมของเด็ก
- ฟอนต์ไทยโหลดจาก Google Fonts เมื่อมีเน็ต — ถ้าออฟไลน์จะใช้ฟอนต์ระบบแทน
- กด ❓ → **ล้างคะแนน** หากต้องการเริ่มสะสมใหม่

สนุกกับการฝึกคณิตนะ! ⭐

---

## บันทึกสถิติฝั่งเซิร์ฟเวอร์ (ตัวเลือกเพิ่มเติม)

ค่าเริ่มต้น เกมจะเก็บคะแนนและดาวไว้ใน `localStorage` เท่านั้น หากต้องการเก็บสถิติการเล่นแต่ละรอบขึ้นเซิร์ฟเวอร์:

1) เตรียมปลายทางรับ HTTP POST (JSON) ของคุณ  
ตัวอย่าง Cloudflare Worker (ต่อยอดบันทึกลง DB ได้):

```js
export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("OK");
    const data = await request.json().catch(() => null);
    console.log("round event:", data);
    return new Response("OK");
  }
}
```

2) ตั้งค่า URL ปลายทางในไฟล์ `js/config.js`

```js
window.STATS_ENDPOINT = "https://your-worker.example.com/ingest";
// (ตัวเลือก) หากต้องการ Authorization header:
// window.STATS_AUTH = "your-public-or-short-lived-token";
```

เมื่อเปิดใช้งานแล้ว แอปจะส่งเหตุการณ์:
- `round_start` เมื่อเริ่มรอบใหม่
- `round_end` เมื่อจบรอบ (มีคะแนน/จำนวนถูกผิด/ดาวที่ได้ ฯลฯ)

หมายเหตุ:
- ถ้า `STATS_ENDPOINT` เว้นว่างไว้ ระบบจะไม่ส่งอะไร (ไม่มีผลกับเกม)
- ใช้ `navigator.sendBeacon` ถ้ามี หรือ `fetch` พร้อม `keepalive: true`
- ไม่มีข้อมูลส่วนบุคคล (PII) — ใช้ `deviceId` แบบสุ่มในเครื่องเท่านั้น

---

## ซิงก์ความคืบหน้าข้ามอุปกรณ์ให้ “ถาวร” (ตัวเลือกเพิ่มเติม)

นอกจากบันทึกเหตุการณ์ (Stats) คุณสามารถเปิด “ซิงก์ความคืบหน้า” เพื่อให้คะแนน/ดาว/สถิติของผู้เล่นตามไปด้วยในทุกอุปกรณ์

1) ทำปลายทาง API สำหรับ Progress (ต้องเปิด CORS):
   - `GET  /progress/{playerId}` → คืน JSON ความคืบหน้าหรือ 404 ถ้ายังไม่มี
   - `PUT  /progress/{playerId}` → รับ JSON แล้วบันทึก

ตัวอย่าง Cloudflare Worker + KV:

```js
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/progress\/([A-Z0-9-_.]{6,})$/);
    if (!m) return new Response("Not Found", { status: 404 });
    const id = m[1];
    const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "GET,PUT,OPTIONS" };
    if (req.method === "OPTIONS") return new Response("", { headers: cors });
    if (req.method === "GET") {
      const v = await env.PROGRESS.get(id);
      return v ? new Response(v, { headers: { "Content-Type": "application/json", ...cors } }) : new Response("Not Found", { status: 404, headers: cors });
    }
    if (req.method === "PUT") {
      const body = await req.text();
      // (เลือกทำ) validate/limit size
      await env.PROGRESS.put(id, body, { expirationTtl: 0 });
      return new Response("OK", { headers: cors });
    }
    return new Response("Method Not Allowed", { status: 405, headers: cors });
  }
}
```

2) ตั้งค่าใน `js/config.js`:

```js
window.PROGRESS_BASE_URL = "https://your-endpoint.example.com";
// (ตัวเลือก) ถ้าต้องการ Authorization:
// window.PROGRESS_AUTH = "your-public-or-short-lived-token";
```

3) การเชื่อมหลายอุปกรณ์:
   - ระบบจะสร้าง `playerId` อัตโนมัติและซิงก์ขึ้นเซิร์ฟเวอร์หลังบันทึกความคืบหน้า
   - บนอุปกรณ์เครื่องใหม่ ใส่พารามิเตอร์ `?pid=รหัสของคุณ` ต่อท้าย URL เพื่อผูกกับบัญชีเดิม เช่น  
     `https://sophon9.github.io/panpan/?pid=ABCD2345XY`
   - หลังจากนั้นความคืบหน้าจะถูกโหลดลงเครื่องใหม่และถูกซิงก์อัตโนมัติ

หมายเหตุ: ถ้าไม่ตั้งค่า `PROGRESS_BASE_URL` เกมจะทำงานแบบเดิม (เก็บเฉพาะในเครื่อง)
