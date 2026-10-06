const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ตั้งค่าที่เก็บไฟล์อัปโหลด
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// เปิดให้เข้าถึงรูปภาพผ่าน URL ได้
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint สำหรับอัปโหลดภาพ
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const imageUrl = `http://localhost:3001/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const roles = {
  pensioner: { id: "pensioner", name: "ข้าราชการบำนาญ", startMoney: 500000, income: 20000, description: "มีเงินบำนาญเข้ามา 20,000 บาท ทุกๆ 2 ด่าน" },
  wealthy: { id: "wealthy", name: "เศรษฐีวัยเกษียณ", startMoney: 2000000, income: 0, description: "เงินก้อนใหญ่ แต่ไม่มีรายได้เพิ่ม" },
  salary: { id: "salary", name: "พนักงานใกล้เกษียณ", startMoney: 800000, income: 50000, description: "ได้เงินเดือน 50,000 บาท ทุกๆ 2 ด่าน" }
};

const allStages = [
{
    id: "scam_sms",
    title: "SMS พัสดุตกค้าง",
    description: "มี SMS แจ้งว่า 'พัสดุของคุณถูกตีกลับ กรุณากดลิงก์เพื่อยืนยันตัวตนและชำระค่าธรรมเนียม 50 บาท'",
    type: "scam",
    choices: [
      { id: "A", text: "กดลิงก์และกรอกข้อมูลบัตรเพื่อจ่าย 50 บาท", result: "พลาดแล้ว! เว็บปลอมดูดข้อมูลบัตร คุณโดนรูดเงินไป", moneyChange: -150000, isGood: false },
      { id: "B", text: "ลบข้อความทิ้ง และไม่กดลิงก์ใดๆ", result: "ยอดเยี่ยม! คุณรู้ทันมิจฉาชีพ", moneyChange: 0, isGood: true }
    ],
    explanation: "ข้อควรระวัง: บริษัทขนส่งจริง จะไม่มีการส่งลิงก์ให้กรอกข้อมูลบัตรเครดิตหรือบัญชีทาง SMS หากสงสัยให้นำเลขพัสดุไปเช็กที่เว็บไซต์ทางการโดยตรง"
  },
  {
    id: "scam_call",
    imageUrl: "./scam_call.jpg",
    title: "สายเรียกเข้า: ตำรวจภูธร",
    description: "มีคนโทรมาอ้างว่าเป็นตำรวจ บอกว่าบัญชีคุณพัวพันคดีฟอกเงิน ต้องโอนเงินมาตรวจสอบความบริสุทธิ์",
    type: "scam",
    choices: [
      { id: "A", text: "ตกใจกลัว รีบโอนเงินไปให้ตรวจสอบ", result: "โดนหลอก! ตำรวจจริงไม่มีการให้โอนเงินตรวจสอบ", moneyChange: -500000, isGood: false },
      { id: "B", text: "วางสาย แล้วโทรเบอร์ 1441 (ตำรวจไซเบอร์)", result: "ถูกต้อง! มีสติและตรวจสอบข้อมูลเสมอ", moneyChange: 0, isGood: true }
    ],
    explanation: "ข้อควรระวัง: เจ้าหน้าที่รัฐ ตำรวจ หรือศาล ไม่มีนโยบายให้ประชาชนโอนเงินเพื่อ 'ตรวจสอบความบริสุทธิ์' หรือ 'ทำคดี' ผ่านโทรศัพท์เด็ดขาด ห้ามโอนเด็ดขาด!"
  },
  {
    id: "event_dividend",
    imageUrl: "./event_dividend.jpg",
    title: "ข่าวดี: ปันผลหุ้น/กองทุน",
    description: "ถึงรอบเดือน เงินปันผลจากการลงทุนในอดีตของคุณออกแล้ว และโอนเข้าบัญชีโดยอัตโนมัติ",
    type: "good",
    choices: [
      { id: "A", text: "เก็บเข้าบัญชีไว้เป็นทุน", result: "ได้รับเงินปันผลชื่นใจ เงินเก็บงอกเงย", moneyChange: 30000, isGood: true },
      { id: "B", text: "นำไปซื้อของขวัญให้ตัวเอง", result: "ได้ความสุขแต่เงินเก็บเพิ่มไม่มากนัก", moneyChange: 5000, isGood: true }
    ],
    explanation: "ข้อแนะนำ: การลงทุนที่ถูกต้องตามกฎหมายและผ่านสถาบันการเงินที่เชื่อถือได้ จะสร้างผลตอบแทนที่ปลอดภัยให้กับวัยเกษียณ"
  },
  {
    id: "scam_line_invest",
    title: "กลุ่มไลน์ลงทุน VIP",
    description: "เพื่อนในไลน์(ที่อาจโดนแฮ็ก) เชิญเข้ากลุ่มลงทุนคริปโต การันตีผลตอบแทน 30% ต่อเดือน",
    type: "scam",
    choices: [
      { id: "A", text: "ลองลงทุนสัก 100,000 บาท น่าจะได้กำไรดี", result: "โดนหลอก! เป็นแชร์ลูกโซ่ ถอนเงินไม่ได้", moneyChange: -100000, isGood: false },
      { id: "B", text: "กดรายงาน(Report) กลุ่มและบล็อก", result: "ปลอดภัย! การลงทุนที่การันตีผลตอบแทนสูงมักไม่มีจริง", moneyChange: 0, isGood: true }
    ],
    explanation: "ข้อควรระวัง: การลงทุนที่ 'การันตีผลตอบแทนสูงในเวลาอันสั้น' และ 'เร่งรัดให้ตัดสินใจ' คือลักษณะของแชร์ลูกโซ่และมิจฉาชีพ 100% ไม่มีธุรกิจใดทำกำไรได้สูงขนาดนั้นโดยไร้ความเสี่ยง"
  },
  {
    id: "scam_relative",
    title: "หลานยืมเงินด่วนทาง Facebook",
    description: "หลานทักแชทมาบอกว่า 'น้าคะ หนูรถชน ต้องใช้เงินด่วน 30,000 บาท โอนเข้าบัญชีเพื่อนหนูชื่อ ... ให้หน่อย'",
    type: "scam",
    choices: [
      { id: "A", text: "รีบโอนเงินไปบัญชีที่ส่งมาให้ทันที", result: "โดนหลอก! เฟซบุ๊กหลานโดนแฮ็ก", moneyChange: -30000, isGood: false },
      { id: "B", text: "โทรศัพท์หาเบอร์ส่วนตัวของหลานเพื่อยืนยัน", result: "ถูกต้อง! หลานบอกว่าไม่ได้ทักไป โล่งอกไปที", moneyChange: 0, isGood: true }
    ],
    explanation: "ข้อควรระวัง: มิจฉาชีพมักแฮ็ก Facebook/Line แล้วทักไปขอยืมเงินคนรู้จัก หากมีคนทักมายืมเงิน ให้ 'โทรศัพท์คุยด้วยเสียง' เพื่อยืนยันตัวตนเสมอ และสังเกตชื่อบัญชีรับโอนว่าตรงกับคนรู้จักหรือไม่"
  },
  {
    id: "scam_app",
    title: "แอปฯ ช่วยเหลือรับเงินดิจิทัล",
    description: "มีลิงก์ส่งมาใน SMS บอกให้โหลดแอป 'รัฐแจกเงิน 10,000' แบบไฟล์ .apk นอก Play Store",
    type: "scam",
    choices: [
      { id: "A", text: "โหลดและติดตั้งแอปทันทีเพื่อรับเงิน", result: "พลาดแล้ว! เป็นแอปรีโมทดูดเงิน เครื่องโดนล็อกและถูกโอนเงินออก", moneyChange: -300000, isGood: false },
      { id: "B", text: "ไม่สนใจ โหลดแอปจาก App Store / Play Store เท่านั้น", result: "ยอดเยี่ยม! คุณป้องกันเครื่องได้อย่างดี", moneyChange: 0, isGood: true }
    ],
    explanation: "ข้อควรระวัง: ห้ามกดลิงก์ดาวน์โหลดแอปที่ส่งมาทาง SMS หรือ Line (ไฟล์ .apk) เด็ดขาด การติดตั้งแอปควรทำผ่าน Google Play Store หรือ Apple App Store เท่านั้น เพื่อป้องกันแอพรีโมทดูดเงิน"
  },
  {
    id: "event_lottery",
    title: "ข่าวดี: ถูกรางวัลสลากออมสิน",
    description: "คุณได้รับข้อความแจ้งเตือนจากแอปพลิเคชันของธนาคาร (แอปจริง) ว่าคุณถูกรางวัลสลากออมสินงวดนี้!",
    type: "good",
    choices: [
      { id: "A", text: "กดเข้าไปดูในแอปธนาคารด้วยตัวเอง", result: "ยอดเยี่ยม! เงินรางวัล 50,000 บาทโอนเข้าบัญชีแล้ว", moneyChange: 50000, isGood: true },
      { id: "B", text: "ฉลองล่วงหน้า พาครอบครัวไปกินข้าว", result: "ได้เงินรางวัล 50,000 แต่ใช้ไป 5,000", moneyChange: 45000, isGood: true }
    ],
    explanation: "ข้อแนะนำ: การรับรู้ข่าวสารการเงินควรทำผ่านแอปพลิเคชันทางการของธนาคารที่เราติดตั้งเองเท่านั้น ไม่กดลิงก์ที่แนบมากับข้อความ"
  },

  {
    "id": "inv_ai_real",
    "title": "ลงทุนหุ้นเทคโนโลยี AI",
    "description": "มาร์เก็ตติ้งธนาคารที่คุณเป็นลูกค้าอยู่ โทรมาแนะนำกองทุนรวมที่ลงทุนในบริษัท AI ชั้นนำของโลก ผ่านแอปธนาคาร",
    "type": "good",
    "choices": [
      {
        "id": "A",
        "text": "แบ่งเงินไปลงทุนเพื่อกระจายความเสี่ยง",
        "result": "ถูกต้อง! เป็นการลงทุนผ่านช่องทางที่ถูกกฎหมาย มีโอกาสเติบโต",
        "moneyChange": 40000,
        "isGood": true
      },
      {
        "id": "B",
        "text": "ปฏิเสธ ไม่กล้าลงทุนสิ่งที่ไม่รู้จัก",
        "result": "ปลอดภัย แต่พลาดโอกาสให้เงินงอกเงย",
        "moneyChange": 0,
        "isGood": true
      }
    ],
    "explanation": "ข้อแนะนำ: การลงทุนในเทคโนโลยีใหม่ๆ ควรทำผ่านสถาบันการเงินที่น่าเชื่อถือ (ผ่านแอปธนาคารหลัก) ไม่ใช่โอนเข้าบัญชีบุคคล"
  },
  {
    "id": "inv_bank_stock",
    "title": "ลงทุนหุ้นธนาคารกินปันผล",
    "description": "ตลาดหุ้นตกหนัก คุณเห็นโอกาสจึงตัดสินใจซื้อหุ้นธนาคารใหญ่แห่งหนึ่งผ่านแอป Streaming ของโบรคเกอร์",
    "type": "good",
    "choices": [
      {
        "id": "A",
        "text": "ซื้อเก็บไว้เพื่อรับเงินปันผลระยะยาว",
        "result": "เยี่ยมมาก! คุณได้เงินปันผลมั่นคงในระยะยาว",
        "moneyChange": 50000,
        "isGood": true
      },
      {
        "id": "B",
        "text": "เอาเงินไปฝากออมทรัพย์ธรรมดาดีกว่า",
        "result": "เงินปลอดภัย แต่ดอกเบี้ยน้อยมาก",
        "moneyChange": 5000,
        "isGood": true
      }
    ],
    "explanation": "ข้อแนะนำ: การซื้อหุ้นพื้นฐานดีในช่วงวิกฤต เป็นวิธีสร้างผลตอบแทนที่นักลงทุนระดับโลกใช้"
  },
  {
    "id": "inv_crypto_scam",
    "title": "แอปขุดเหรียญคริปโตบนมือถือ",
    "description": "โฆษณาบนเฟซบุ๊กบอกว่า โหลดแอปนี้แล้วเปิดทิ้งไว้ จะได้เหรียญคริปโตวันละ 500 บาท แต่ต้องเติมเงิน VIP 10,000 บาทก่อน",
    "type": "scam",
    "choices": [
      {
        "id": "A",
        "text": "เติมเงิน VIP 10,000 บาท น่าจะคุ้ม",
        "result": "โดนหลอก! แอปปิดหนีและขโมยข้อมูลในมือถือ",
        "moneyChange": -100000,
        "isGood": false
      },
      {
        "id": "B",
        "text": "เลื่อนผ่าน ไม่สนใจ",
        "result": "รอดตัวไป! ไม่มีแอปขุดเหรียญไหนที่ได้เงินง่ายขนาดนี้",
        "moneyChange": 0,
        "isGood": true
      }
    ],
    "explanation": "ข้อควรระวัง: การขุดคริปโตจริงต้องใช้เครื่องคอมพิวเตอร์สเปคสูงมาก แอปบนมือถือที่ให้เติมเงินก่อนคือมิจฉาชีพ 100%"
  },
  {
    "id": "inv_friend_share_scam",
    "title": "เพื่อนสนิทชวนเล่นแชร์",
    "description": "เพื่อนสนิทที่รู้จักกันมา 20 ปี ชวนลงเงินเล่นแชร์วงใหญ่ เปียแชร์ได้ดอกเบี้ยเดือนละ 10%",
    "type": "scam",
    "choices": [
      {
        "id": "A",
        "text": "เชื่อใจเพื่อน ลงเงินไป 200,000 บาท",
        "result": "พลาดแล้ว! ท้าวแชร์เชิดเงินหนี เพื่อนก็ไม่มีเงินคืนคุณ",
        "moneyChange": -200000,
        "isGood": false
      },
      {
        "id": "B",
        "text": "ปฏิเสธ บอกว่าเงินฝากประจำไว้หมดแล้ว",
        "result": "ฉลาดมาก! รักษาน้ำใจและรักษาเงินในกระเป๋า",
        "moneyChange": 0,
        "isGood": true
      }
    ],
    "explanation": "ข้อควรระวัง: คดีโกงแชร์ส่วนใหญ่ เกิดจากคนที่ไว้ใจและคนใกล้ตัว ไม่ควรลงทุนในสิ่งที่ไม่มีกฎหมายคุ้มครอง"
  },
  {
    "id": "inv_bond_fake",
    "title": "จองหุ้นกู้บริษัทดังผ่าน Facebook",
    "description": "เพจ Facebook ชื่อเหมือนบริษัทพลังงานยักษ์ใหญ่ เปิดให้จองหุ้นกู้ ดอกเบี้ย 9% ต่อปี ให้แอดไลน์ไปจอง",
    "type": "scam",
    "choices": [
      {
        "id": "A",
        "text": "แอดไลน์ และโอนเงินจองทันที",
        "result": "โดนหลอก! เป็นเพจปลอมที่ยิงแอดโฆษณาหลอกลวง",
        "moneyChange": -500000,
        "isGood": false
      },
      {
        "id": "B",
        "text": "โทรเช็คกับ Call Center ของบริษัทนั้นโดยตรง",
        "result": "เยี่ยมมาก! บริษัทแจ้งว่าไม่มีนโยบายขายหุ้นกู้ผ่านเพจ",
        "moneyChange": 0,
        "isGood": true
      }
    ],
    "explanation": "ข้อควรระวัง: บริษัทขนาดใหญ่จะขายหุ้นกู้ผ่านธนาคารหรือแอปที่ได้รับการรับรองเท่านั้น ไม่มีการให้โอนเงินเข้าบัญชีบุคคลผ่านแชทไลน์"
  },
  {
    "id": "inv_gov_bonds",
    "title": "ซื้อพันธบัตรรัฐบาล",
    "description": "แอปธนาคารแจ้งเตือนว่า กระทรวงการคลังเปิดจำหน่ายพันธบัตรรัฐบาล ดอกเบี้ย 3.5% ต่อปี สามารถกดซื้อผ่านแอปได้เลย",
    "type": "good",
    "choices": [
      {
        "id": "A",
        "text": "กดซื้อผ่านแอปธนาคาร",
        "result": "ถูกต้อง! เป็นการลงทุนที่ความเสี่ยงต่ำมาก",
        "moneyChange": 20000,
        "isGood": true
      },
      {
        "id": "B",
        "text": "ไม่ซื้อ ผลตอบแทนน้อยไป",
        "result": "เงินต้นปลอดภัย แต่น่าเสียดายโอกาสรับดอกเบี้ย",
        "moneyChange": 0,
        "isGood": true
      }
    ],
    "explanation": "ข้อแนะนำ: พันธบัตรรัฐบาลเป็นการลงทุนที่ปลอดภัยที่สุด เหมาะสำหรับวัยเกษียณที่ต้องการรักษาเงินต้น"
  },
  {
    "id": "inv_crypto_real",
    "title": "ลงทุนคริปโตบนกระดานที่ถูกกฎหมาย",
    "description": "คุณศึกษาบิตคอยน์มาอย่างดี และเปิดบัญชีกับกระดานเทรดที่ ก.ล.ต. ไทยรับรอง",
    "type": "good",
    "choices": [
      {
        "id": "A",
        "text": "ลงทุนด้วยเงินส่วนน้อยที่เสียได้ (5%)",
        "result": "จัดการความเสี่ยงได้ดี! บิตคอยน์ราคาขึ้น ได้กำไรพอสมควร",
        "moneyChange": 30000,
        "isGood": true
      },
      {
        "id": "B",
        "text": "เทขายหุ้นและบ้านมาซื้อบิตคอยน์ทั้งหมด",
        "result": "ประมาทเกินไป! ตลาดผันผวนหนัก ทำให้ขาดทุนมหาศาล",
        "moneyChange": -800000,
        "isGood": false
      }
    ],
    "explanation": "ข้อแนะนำ: การลงทุนในสินทรัพย์เสี่ยงสูง ควรลงทุนผ่านแพลตฟอร์มที่ ก.ล.ต. รับรอง และใช้เงินส่วนน้อยเท่านั้น"
  },
  {
    "id": "inv_task_scam",
    "title": "งานเสริม: กดไลค์ได้เงิน",
    "description": "มีข้อความ SMS ชวนทำงานกดไลค์เพจสินค้า ได้เงินครั้งละ 50 บาท พอทำได้ 3 ครั้ง แอดมินให้โอนเงินเพื่อเลื่อนขั้น VIP",
    "type": "scam",
    "choices": [
      {
        "id": "A",
        "text": "โอนเงินเพื่อเลื่อนขั้น อยากได้งานที่เงินดีกว่า",
        "result": "โดนหลอก! มันคือภารกิจลวงโลก คุณจะโดนดูดเงินไปเรื่อยๆ",
        "moneyChange": -80000,
        "isGood": false
      },
      {
        "id": "B",
        "text": "บล็อกทิ้งและลบข้อความ",
        "result": "ยอดเยี่ยม! คุณไม่ตกเป็นเหยื่อของการหลอกให้ตายใจ",
        "moneyChange": 0,
        "isGood": true
      }
    ],
    "explanation": "ข้อควรระวัง: มิจฉาชีพจะให้เงินจริงจำนวนเล็กน้อยในตอนแรก เพื่อให้เหยื่อตายใจ จากนั้นจะหลอกให้โอนเงินก้อนใหญ่"
  },
  {
    "id": "inv_gold_scam",
    "title": "ลงทุนทองคำออนไลน์",
    "description": "เพจร้านทองชื่อดัง ประกาศขายทองคำออนไลน์ลดราคา 30% ต่ำกว่าราคาตลาดโลก",
    "type": "scam",
    "choices": [
      {
        "id": "A",
        "text": "รีบโอนเงินซื้อทันทีเพราะกลัวของหมด",
        "result": "โดนหลอก! เป็นเพจปลอม ทองไม่มีอยู่จริง",
        "moneyChange": -150000,
        "isGood": false
      },
      {
        "id": "B",
        "text": "ไปซื้อที่หน้าร้านทองดีกว่า",
        "result": "ถูกต้อง! ได้จับของจริง มั่นใจ 100%",
        "moneyChange": 10000,
        "isGood": true
      }
    ],
    "explanation": "ข้อควรระวัง: ราคาทองคำเป็นราคามาตรฐานระดับโลก ไม่มีทางที่จะมีใครนำมาลดราคา 30% ได้ หากเจอแปลว่าเป็นมิจฉาชีพ"
  },
  {
    "id": "inv_forex_scam",
    "title": "ลงทุนเทรด Forex โดยผู้เชี่ยวชาญ",
    "description": "คนใน TikTok โชว์ขับรถสปอร์ต และชวนให้ฝากเงินเทรด Forex โดยบอกว่าจะมี AI เทรดให้ ได้กำไรทุกวัน",
    "type": "scam",
    "choices": [
      {
        "id": "A",
        "text": "ฝากเงินเข้าไป 500,000 บาท",
        "result": "โดนหลอก! พอร์ตแตก และไม่สามารถถอนเงินได้เลย",
        "moneyChange": -500000,
        "isGood": false
      },
      {
        "id": "B",
        "text": "ไม่สนใจ รู้ว่าเป็นหลอกลวง",
        "result": "ปลอดภัย! คุณรู้ทันกลโกง Forex เถื่อน",
        "moneyChange": 0,
        "isGood": true
      }
    ],
    "explanation": "ข้อควรระวัง: การรับฝากเงินเทรด Forex ในไทยถือว่าผิดกฎหมาย และคนที่โชว์ความรวยมักจะเป็นหน้าม้า"
  },
  {
    "id": "inv_lottery",
    "title": "ซื้อสลากออมสิน/ธ.ก.ส.",
    "description": "คุณนำเงินไปซื้อสลากออมสินเพื่อลุ้นรางวัลและเก็บเงินต้น",
    "type": "good",
    "choices": [
      {
        "id": "A",
        "text": "ซื้อเก็บไว้ 1 ล้านบาท",
        "result": "ดวงดี! คุณถูกรางวัลใหญ่ เงินต้นอยู่ครบแถมได้รางวัล",
        "moneyChange": 100000,
        "isGood": true
      },
      {
        "id": "B",
        "text": "นำเงินไปซื้อหวยใต้ดินแทน",
        "result": "ผิดพลาด! หวยไม่ถูก แถมเงินต้นหายเกลี้ยง",
        "moneyChange": -20000,
        "isGood": false
      }
    ],
    "explanation": "ข้อแนะนำ: สลากออมทรัพย์เป็นการลงทุนที่รักษาเงินต้น 100% และได้ลุ้นรางวัล เป็นทางเลือกที่ดีกว่าการพนัน"
  },
  {
    "id": "inv_friend_business",
    "title": "เพื่อนขอยืมเงินทำธุรกิจ",
    "description": "เพื่อนเก่ามาหาที่บ้าน เล่าโปรเจคธุรกิจร้านอาหาร และขอยืมเงิน 300,000 บาท โดยสัญญาจะให้หุ้น 10%",
    "type": "scam",
    "choices": [
      {
        "id": "A",
        "text": "ให้ยืมโดยไม่มีสัญญา เพราะเป็นเพื่อนกัน",
        "result": "พลาดแล้ว! ธุรกิจเจ๊ง เพื่อนไม่มีเงินคืนและเสียเพื่อน",
        "moneyChange": -300000,
        "isGood": false
      },
      {
        "id": "B",
        "text": "ปฏิเสธอย่างนุ่มนวล แต่เลี้ยงข้าวให้กำลังใจ",
        "result": "ฉลาดมาก! รักษาสายสัมพันธ์โดยไม่ต้องเอาเงินเก็บไปเสี่ยง",
        "moneyChange": -1000,
        "isGood": true
      }
    ],
    "explanation": "ข้อแนะนำ: การทำธุรกิจกับเพื่อน หรือให้เพื่อนยืมเงินก้อนใหญ่ในวัยเกษียณ มีความเสี่ยงสูงที่จะเสียทั้งเงินและเพื่อน"
  },

  {
    "id": "event_gift_grandchild",
    "title": "ของขวัญวันเกิดหลาน",
    "description": "หลานรักบ่นว่าอยากได้แท็บเล็ตเครื่องใหม่ไว้เรียนและเล่นเกม ราคา 15,000 บาท",
    "type": "good",
    "choices": [
      {
        "id": "A",
        "text": "ซื้อให้เป็นของขวัญเซอร์ไพรส์",
        "result": "หลานดีใจมากเข้ามากอดคุณ! เสียเงินแต่ได้ความสุขเต็มเปี่ยม",
        "moneyChange": -15000,
        "happinessChange": 30,
        "isGood": true
      },
      {
        "id": "B",
        "text": "ไม่ซื้อให้ ให้เงินใส่ซอง 1,000 บาทแทน",
        "result": "ประหยัดเงินได้เยอะ หลานขอบคุณแต่แอบผิดหวังเล็กน้อย",
        "moneyChange": -1000,
        "happinessChange": -5,
        "isGood": true
      }
    ],
    "explanation": "ข้อแนะนำ: การบริหารเงินวัยเกษียณ ควรมีงบสำหรับความสุขของครอบครัวด้วย ไม่จำเป็นต้องเก็บเงินไว้ทั้งหมดจนเครียดเกินไป"
  },
  {
    "id": "event_holiday_trip",
    "title": "ทริปเที่ยวพักผ่อนวัยเก๋า",
    "description": "กลุ่มเพื่อนเก่าชวนไปทัวร์ไหว้พระทำบุญและแช่ออนเซ็นที่ญี่ปุ่น 5 วัน 4 คืน ราคา 40,000 บาท",
    "type": "good",
    "choices": [
      {
        "id": "A",
        "text": "ไปสิ! ซื้อความสุขให้ตัวเองบ้าง",
        "result": "ทริปนี้สนุกมาก ได้รูปสวยๆ และรอยยิ้มกลับมาเต็มกระเป๋า",
        "moneyChange": -40000,
        "happinessChange": 40,
        "isGood": true
      },
      {
        "id": "B",
        "text": "แพงไป ขออยู่บ้านดูทีวีดีกว่า",
        "result": "เงินอยู่ครบ แต่แอบเหงาที่เห็นเพื่อนๆ โพสต์รูปไปเที่ยวกัน",
        "moneyChange": 0,
        "happinessChange": -10,
        "isGood": true
      }
    ],
    "explanation": "ข้อแนะนำ: การให้รางวัลตัวเองด้วยการท่องเที่ยว ช่วยลดความเครียดและป้องกันโรคซึมเศร้าในผู้สูงอายุได้ดี"
  },

  {
    "id": "event_child_sick",
    "imageUrl": "child_sick.jpg",
    "title": "ลูกป่วยหนักกะทันหัน",
    "description": "ลูกของคุณล้มป่วยหนักด้วยโรคร้ายแรง ต้องใช้ค่ารักษาพยาบาลด่วน 300,000 บาท (ประกันสุขภาพไม่ครอบคลุม)",
    "type": "good",
    "choices": [
      {
        "id": "A",
        "text": "ทุ่มเงินรักษาลูกทันที",
        "result": "ลูกได้รับการรักษาจนหายเป็นปกติ ครอบครัวกลับมามีความสุขอีกครั้ง",
        "moneyChange": -300000,
        "happinessChange": 30,
        "isGood": true
      },
      {
        "id": "B",
        "text": "ปฏิเสธ ไม่ยอมจ่ายเพราะเสียดายเงิน",
        "result": "อาการลูกทรุดหนักจนจากไป... คุณมีเงินเต็มบัญชีแต่ต้องจมอยู่กับความเศร้าโศกตลอดชีวิต",
        "moneyChange": 0,
        "happinessChange": -80,
        "isGood": false
      }
    ],
    "explanation": "ข้อแนะนำ: เงินทองเป็นของนอกกายสามารถหาใหม่ได้ แต่ชีวิตและครอบครัวสำคัญที่สุด อย่าตระหนี่กับเรื่องที่ส่งผลต่อชีวิตของคนที่เรารัก"
  },
  {
    "id": "event_temple_real",
    "imageUrl": "temple_real.jpg",
    "title": "ร่วมบุญสร้างศาลาวัด",
    "description": "วัดแถวบ้านที่คุณไปทำบุญเป็นประจำ มีโครงการสร้างศาลาปฏิบัติธรรม โดยประกาศเลขบัญชีชื่อวัดอย่างถูกต้องชัดเจน",
    "type": "good",
    "choices": [
      {
        "id": "A",
        "text": "ร่วมทำบุญ 10,000 บาท",
        "result": "ได้ทำบุญตามเจตนารมณ์ จิตใจเบิกบานและอิ่มเอมใจ",
        "moneyChange": -10000,
        "happinessChange": 15,
        "isGood": true
      },
      {
        "id": "B",
        "text": "อนุโมทนาบุญ แต่ไม่บริจาคเงิน",
        "result": "เงินยังอยู่ครบ และไม่ได้รู้สึกแย่อะไร",
        "moneyChange": 0,
        "happinessChange": 0,
        "isGood": true
      }
    ],
    "explanation": "ข้อแนะนำ: การทำบุญกับวัดที่สามารถตรวจสอบได้ และโอนเข้าบัญชีชื่อองค์กร เป็นการทำบุญที่ปลอดภัยและจรรโลงใจ"
  },
  {
    "id": "event_temple_scam",
    "imageUrl": "temple_scam.jpg",
    "title": "โครงการบุญมหากุศล (หลอกลวง)",
    "description": "มีเพจเฟซบุ๊กอ้างเป็นพระภิกษุชื่อดัง ทักข้อความมาชวนทำบุญสร้างพระประธาน โดยให้โอนเข้าบัญชีนาย... (ชื่อบุคคลธรรมดา)",
    "type": "scam",
    "choices": [
      {
        "id": "A",
        "text": "โอนทำบุญทันที 50,000 บาท",
        "result": "โดนหลอก! มิจฉาชีพในคราบนักบุญเชิดเงินหนี ทำบุญแต่กลับรู้สึกเจ็บใจและเป็นทุกข์",
        "moneyChange": -50000,
        "happinessChange": -30,
        "isGood": false
      },
      {
        "id": "B",
        "text": "ไม่ทำบุญ เพราะบัญชีน่าสงสัย",
        "result": "รอดตัว! คุณรู้ทันว่าการเรี่ยไรที่โอนเข้าบัญชีบุคคลมักเป็นมิจฉาชีพ",
        "moneyChange": 0,
        "happinessChange": 5,
        "isGood": true
      }
    ],
    "explanation": "ข้อควรระวัง: มิจฉาชีพมักหากินกับความศรัทธา หากพบการเรี่ยไรที่ให้โอนเข้าบัญชีชื่อบุคคลธรรมดา ให้สันนิษฐานไว้ก่อนว่าเป็นมิจฉาชีพ"
  },
  {
    "id": "event_house_repair",
    "imageUrl": "house_fire.jpg",
    "title": "สายไฟในบ้านเก่าชำรุด",
    "description": "ช่างไฟเตือนว่าสายไฟในบ้านเก่ามากและมีรอยหนูกัด เสี่ยงต่อการลัดวงจร ต้องเสียค่าเดินสายไฟใหม่ทั้งหลัง 50,000 บาท",
    "type": "good",
    "choices": [
      {
        "id": "A",
        "text": "ยอมจ่าย 50,000 บาท เพื่อซ่อมทันที",
        "result": "บ้านปลอดภัย นอนหลับสบายไร้ความกังวล",
        "moneyChange": -50000,
        "happinessChange": 15,
        "isGood": true
      },
      {
        "id": "B",
        "text": "เปลืองเงิน ทนใช้ไปก่อนยังไม่พัง",
        "result": "ไฟฟ้าลัดวงจร! ไฟไหม้บ้าน ต้องเสียค่าซ่อมแซมใหม่ 1,000,000 บาท สุขภาพจิตพังทลาย",
        "moneyChange": -1000000,
        "happinessChange": -60,
        "isGood": false
      }
    ],
    "explanation": "ข้อคิด: เสียน้อยเสียยาก เสียมากเสียง่าย เรื่องความปลอดภัยในชีวิตและทรัพย์สิน คือสิ่งที่ไม่ควรประหยัดเด็ดขาด"
  }

];

const rooms = {};

function getRandomStages(count) {
  const shuffled = [...allStages].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', (data, callback) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    rooms[roomId] = {
      id: roomId,
      host: socket.id,
      players: [],
      state: 'lobby',
      stages: getRandomStages(data.gameLength || 6), 
      currentStageIndex: -1,
      responses: {}
    };
    socket.join(roomId);
    callback({ roomId });
  });

  socket.on('joinRoom', ({ roomId, playerName, roleId }, callback) => {
    const room = rooms[roomId];
    if (!room) return callback({ error: 'ไม่พบห้องนี้' });
    if (room.state !== 'lobby') return callback({ error: 'เกมเริ่มไปแล้ว' });

    const role = roles[roleId] || roles.pensioner;
    const player = {
      id: socket.id,
      name: playerName,
      role: role,
      money: role.startMoney,
      isReady: true,
      history: [],
      lastSalaryBonus: 0
    };

    room.players.push(player);
    socket.join(roomId);
    io.to(roomId).emit('updateRoom', room);
    callback({ success: true, room });
  });

  socket.on('startGame', (roomId) => {
    const room = rooms[roomId];
    if (room && room.host === socket.id) {
      room.state = 'playing';
      room.currentStageIndex = 0;
      room.responses = {};
      io.to(roomId).emit('gameStarted', { room });
      io.to(roomId).emit('newStage', { stage: room.stages[0], stageIndex: 0 });
    }
  });

  socket.on('submitAnswer', ({ roomId, choiceId }) => {
    const room = rooms[roomId];
    if (!room || room.state !== 'playing') return;

    room.responses[socket.id] = choiceId;

    if (Object.keys(room.responses).length === room.players.length) {
      const currentStage = room.stages[room.currentStageIndex];
      
      room.players.forEach(p => {
        const pChoiceId = room.responses[p.id];
        const choice = currentStage.choices.find(c => c.id === pChoiceId);
        
        let earned = 0;
        let hapChange = 0;
        p.lastSalaryBonus = 0;
        
        if (choice) {
          earned = choice.moneyChange;
          
          if (choice.happinessChange !== undefined) {
             hapChange = choice.happinessChange;
          } else {
             if (choice.isGood && choice.moneyChange > 0) hapChange = 15;
             else if (!choice.isGood && choice.moneyChange < 0) hapChange = -20;
             else if (choice.isGood && choice.moneyChange === 0) hapChange = 5;
             else hapChange = 0;
          }

          p.money += choice.moneyChange;
          
          if (p.happiness === undefined) p.happiness = 50;
          p.happiness += hapChange;
          if (p.happiness > 100) p.happiness = 100;
          if (p.happiness < 0) p.happiness = 0;

          if ((room.currentStageIndex + 1) % 2 === 0 && p.role.income > 0) {
             p.money += p.role.income;
             earned += p.role.income;
             p.lastSalaryBonus = p.role.income;
          }
          // (Allow debt) if (p.money < 0) p.money = 0;
          
          p.history.push({
            stageIndex: room.currentStageIndex,
            choiceText: choice.text,
            resultText: choice.result,
            moneyChange: earned,
            happinessChange: hapChange
          });
        }
      });

      io.to(roomId).emit('stageResult', { room, currentStage });
    }
  });

  socket.on('sendImage', ({ roomId, imageUrl }) => {
    const room = rooms[roomId];
    if (room && room.host === socket.id) {
      io.to(roomId).emit('showImage', imageUrl);
    }
  });

  socket.on('addCustomStage', ({ roomId, stage }) => {
    const room = rooms[roomId];
    if (room && room.host === socket.id) {
      if (room.currentStageIndex >= 0) {
        // แทรกลงเป็นด่านถัดไปเลย
        room.stages.splice(room.currentStageIndex + 1, 0, stage);
      } else {
        // ถ้ายังอยู่หน้าล็อบบี้ ก็ต่อท้ายไปเลย
        room.stages.push(stage);
      }
      io.to(roomId).emit('updateRoom', room);
    }
  });

  socket.on('nextStage', (roomId) => {
    const room = rooms[roomId];
    if (room && room.host === socket.id) {
      room.currentStageIndex++;
      room.responses = {};

      if (room.currentStageIndex >= room.stages.length) {
        room.state = 'finished';
        io.to(roomId).emit('gameOver', { room });
      } else {
        io.to(roomId).emit('newStage', { 
          stage: room.stages[room.currentStageIndex], 
          stageIndex: room.currentStageIndex 
        });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
