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
    ]
  },
  {
    id: "scam_call",
    title: "สายเรียกเข้า: ตำรวจภูธร",
    description: "มีคนโทรมาอ้างว่าเป็นตำรวจ บอกว่าบัญชีคุณพัวพันยาเสพติด ต้องโอนเงินมาตรวจสอบความบริสุทธิ์",
    type: "scam",
    choices: [
      { id: "A", text: "ตกใจกลัว รีบโอนเงินไปให้ตรวจสอบ", result: "โดนหลอก! ตำรวจจริงไม่มีการให้โอนเงินตรวจสอบ", moneyChange: -500000, isGood: false },
      { id: "B", text: "วางสาย แล้วโทรเบอร์ 1441 (ตำรวจไซเบอร์)", result: "ถูกต้อง! มีสติและตรวจสอบข้อมูลเสมอ", moneyChange: 0, isGood: true }
    ]
  },
  {
    id: "scam_line_invest",
    title: "กลุ่มไลน์ลงทุน VIP",
    description: "เพื่อนในไลน์(ที่อาจโดนแฮ็ก) เชิญเข้ากลุ่มลงทุนคริปโต การันตีผลตอบแทน 30% ต่อเดือน",
    type: "scam",
    choices: [
      { id: "A", text: "ลองลงทุนสัก 100,000 บาท น่าจะได้กำไรดี", result: "โดนหลอก! เป็นแชร์ลูกโซ่ ถอนเงินไม่ได้", moneyChange: -100000, isGood: false },
      { id: "B", text: "กดรายงาน(Report) กลุ่มและบล็อก", result: "ปลอดภัย! การลงทุนที่การันตีผลตอบแทนสูงมักไม่มีจริง", moneyChange: 0, isGood: true }
    ]
  },
  {
    id: "scam_relative",
    title: "หลานยืมเงินด่วนทาง Facebook",
    description: "หลานทักแชทมาบอกว่า 'น้าคะ หนูรถชน ต้องใช้เงินด่วน 30,000 บาท โอนเข้าบัญชีเพื่อนหนูชื่อ ... ให้หน่อย'",
    type: "scam",
    choices: [
      { id: "A", text: "รีบโอนเงินไปช่วยหลานทันที", result: "โดนหลอก! เฟซบุ๊กหลานโดนแฮ็ก", moneyChange: -30000, isGood: false },
      { id: "B", text: "โทรศัพท์หาเบอร์ส่วนตัวของหลานเพื่อยืนยัน", result: "ถูกต้อง! หลานบอกว่าไม่ได้ทักไป โล่งอกไปที", moneyChange: 0, isGood: true }
    ]
  },
  {
    id: "scam_app",
    title: "แอปฯ ช่วยเหลือรับเงินดิจิทัล",
    description: "มีลิงก์ส่งมาใน SMS บอกให้โหลดแอป 'รัฐแจกเงิน 10,000' แบบไฟล์ .apk",
    type: "scam",
    choices: [
      { id: "A", text: "โหลดและติดตั้งแอปทันที", result: "พลาดแล้ว! เป็นแอปดูดเงิน เครื่องโดนล็อก", moneyChange: -300000, isGood: false },
      { id: "B", text: "ไม่สนใจ โหลดแอปจาก App Store / Play Store เท่านั้น", result: "ยอดเยี่ยม! คุณป้องกันเครื่องได้อย่างดี", moneyChange: 0, isGood: true }
    ]
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
      stages: getRandomStages(5),
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
      history: []
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

        if (choice) {
          earned = choice.moneyChange;
          p.money += choice.moneyChange;
          
          if ((room.currentStageIndex + 1) % 2 === 0 && p.role.income > 0) {
             p.money += p.role.income;
             earned += p.role.income;
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
