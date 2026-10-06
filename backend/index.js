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
      stages: getRandomStages(6), // เพิ่มเป็น 6 ด่านเพื่อให้เห็นเงินเดือน 3 รอบ
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
        p.lastSalaryBonus = 0; // Reset every stage

        if (choice) {
          earned = choice.moneyChange;
          p.money += choice.moneyChange;
          
          // ระบบเงินเดือน/ปันผลออก ทุกๆ 2 ด่าน
          if ((room.currentStageIndex + 1) % 2 === 0 && p.role.income > 0) {
             p.money += p.role.income;
             earned += p.role.income;
             p.lastSalaryBonus = p.role.income;
          }

          if (p.money < 0) p.money = 0;

          p.history.push({
            stageIndex: room.currentStageIndex,
            choiceText: choice.text,
            resultText: choice.result,
            moneyChange: earned
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
