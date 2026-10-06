import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Shield, ShieldAlert, Coins, Users, Trophy, QrCode, Smile } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Papa from 'papaparse';
import imgWealthy from './assets/role_wealthy.png';
import imgPensioner from './assets/role_pensioner.png';
import imgSalary from './assets/role_salary.png';
import './App.css';

// เชื่อมต่อ Backend (สำหรับการเล่นแบบกลุ่ม)
const socket = io('http://localhost:3001');

const roles = {
  wealthy: { id: "wealthy", name: "คนรวย", startMoney: 2000000, income: 0, description: "เงินก้อนใหญ่ แต่ไม่มีรายได้เพิ่ม", img: imgWealthy },
  pensioner: { id: "pensioner", name: "ข้าราชการเกษียณ", startMoney: 500000, income: 20000, description: "มีเงินบำนาญเข้ามา 20,000 บาท ทุกๆ 2 ด่าน", img: imgPensioner },
  salary: { id: "salary", name: "พนักงานระดับสูง", startMoney: 800000, income: 50000, description: "ได้เงินเดือน 50,000 บาท ทุกๆ 2 ด่าน", img: imgSalary }
};

// ด่านสำรองกรณีเล่นออฟไลน์
const fallbackStages = [
{
    id: "scam_sms",
    title: "SMS พัสดุตกค้าง",
    description: "มี SMS แจ้งว่า 'พัสดุของคุณถูกตีกลับ กรุณากดลิงก์เพื่อยืนยันตัวตนและชำระค่าธรรมเนียม 50 บาท'",
    type: "scam",
    choices: [
      { id: "A", text: "กดลิงก์และกรอกข้อมูลบัตรเพื่อจ่าย 50 บาท", result: "พลาดแล้ว! เว็บปลอมดูดข้อมูลบัตร คุณโดนรูดเงินไป", moneyChange: -150000, isGood: false },
      { id: "B", text: "ลบข้อความทิ้ง และไม่กดลิงก์ใดๆ", result: "ยอดเยี่ยม! คุณรู้ทันมิจฉาชีพ", moneyChange: 0, isGood: true }
    ],
    explanation: "ข้อควรระวัง: บริษัทขนส่งจริง จะไม่มีการส่งลิงก์ให้กรอกข้อมูลบัตรเครดิตหรือบัญชีทาง SMS"
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
    explanation: "ข้อควรระวัง: เจ้าหน้าที่รัฐ ตำรวจ หรือศาล ไม่มีนโยบายให้ประชาชนโอนเงินเพื่อ 'ตรวจสอบความบริสุทธิ์'"
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
    explanation: "ข้อแนะนำ: การลงทุนที่ถูกต้องสร้างผลตอบแทนที่ปลอดภัยให้กับวัยเกษียณ"
  },
  {
    id: "scam_line_invest",
    title: "กลุ่มไลน์ลงทุน VIP",
    description: "เพื่อนในไลน์เชิญเข้ากลุ่มลงทุนคริปโต การันตีผลตอบแทน 30% ต่อเดือน",
    type: "scam",
    choices: [
      { id: "A", text: "ลองลงทุนสัก 100,000 บาท น่าจะได้กำไรดี", result: "โดนหลอก! เป็นแชร์ลูกโซ่ ถอนเงินไม่ได้", moneyChange: -100000, isGood: false },
      { id: "B", text: "กดรายงาน(Report) กลุ่มและบล็อก", result: "ปลอดภัย! การลงทุนที่การันตีผลตอบแทนสูงมักไม่มีจริง", moneyChange: 0, isGood: true }
    ],
    explanation: "ข้อควรระวัง: การลงทุนที่ 'การันตีผลตอบแทนสูงในเวลาอันสั้น' คือลักษณะของแชร์ลูกโซ่"
  },
  {
    id: "scam_relative",
    title: "หลานยืมเงินด่วนทาง Facebook",
    description: "หลานทักแชทมาบอกว่า 'น้าคะ หนูรถชน ต้องใช้เงินด่วน 30,000 บาท'",
    type: "scam",
    choices: [
      { id: "A", text: "รีบโอนเงินไปบัญชีที่ส่งมาให้ทันที", result: "โดนหลอก! เฟซบุ๊กหลานโดนแฮ็ก", moneyChange: -30000, isGood: false },
      { id: "B", text: "โทรศัพท์หาเบอร์ส่วนตัวของหลานเพื่อยืนยัน", result: "ถูกต้อง! หลานบอกว่าไม่ได้ทักไป โล่งอกไปที", moneyChange: 0, isGood: true }
    ],
    explanation: "ข้อควรระวัง: มิจฉาชีพมักแฮ็ก Facebook แล้วทักไปขอยืมเงิน ให้ 'โทรศัพท์คุยด้วยเสียง' เพื่อยืนยันเสมอ"
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

function App() {
  const [appState, setAppState] = useState('home');
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [roleId, setRoleId] = useState('pensioner');
  const [gameLength, setGameLength] = useState(6);
  const [isHost, setIsHost] = useState(false);
  const [isSinglePlayer, setIsSinglePlayer] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [roomData, setRoomData] = useState(null);
  
  const [currentStage, setCurrentStage] = useState(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [stageResult, setStageResult] = useState(null);
  const [stageImage, setStageImage] = useState(null);
  const [showCustomForm, setShowCustomForm] = useState(false);

  useEffect(() => {
    socket.on('updateRoom', (room) => {
      setRoomData(room);
    });

    socket.on('gameStarted', ({ room }) => {
      setRoomData(room);
      setAppState('playing');
    });

    socket.on('newStage', ({ stage, stageIndex }) => {
      setCurrentStage(stage);
      setStageIndex(stageIndex);
      setHasAnswered(false);
      setStageResult(null);
      setStageImage(null); // ล้างรูปทุกครั้งที่ขึ้นด่านใหม่
      setAppState('playing');
    });

    socket.on('stageResult', ({ room, currentStage }) => {
      setRoomData(room);
      setStageResult(currentStage);
      setAppState('result');
    });

    socket.on('gameOver', ({ room }) => {
      setRoomData(room);
      setAppState('finished');
    });

    socket.on('showImage', (url) => {
      setStageImage(url);
    });

    return () => {
      socket.off('updateRoom');
      socket.off('gameStarted');
      socket.off('newStage');
      socket.off('stageResult');
      socket.off('gameOver');
      socket.off('showImage');
    };
  }, []);

  const submitCustomStage = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    
    let imageUrl = null;
    const file = fd.get('image');
    if (file && file.size > 0) {
       const imgData = new FormData();
       imgData.append('image', file);
       try {
         const res = await fetch('http://localhost:3001/upload', { method: 'POST', body: imgData });
         const data = await res.json();
         imageUrl = data.url;
       } catch (err) {
         console.error(err);
       }
    }

    const stage = {
      id: "custom_" + Date.now(),
      title: fd.get('title'),
      description: fd.get('description'),
      imageUrl: imageUrl,
      type: "custom",
      choices: [
        {
          id: "A",
          text: fd.get('ca_text'),
          result: fd.get('ca_result'),
          moneyChange: Number(fd.get('ca_money')),
          isGood: Number(fd.get('ca_money')) >= 0
        },
        {
          id: "B",
          text: fd.get('cb_text'),
          result: fd.get('cb_result'),
          moneyChange: Number(fd.get('cb_money')),
          isGood: Number(fd.get('cb_money')) >= 0
        }
      ],
      explanation: fd.get('explanation')
    };

    socket.emit('addCustomStage', { roomId, stage });
    setShowCustomForm(false);
    alert('เพิ่มด่านใหม่สำเร็จ! ด่านนี้จะขึ้นเป็นด่านถัดไปเมื่อกดไปต่อ');
  };

  const createRoom = () => {
    socket.emit('createRoom', { gameLength }, (res) => {
      setRoomId(res.roomId);
      setIsHost(true);
      setAppState('lobby');
    });
  };

  const fetchStagesFromSheet = async (url, length) => {
    if (!url) {
      return [...fallbackStages].sort(() => 0.5 - Math.random()).slice(0, length);
    }
    return new Promise((resolve) => {
      Papa.parse(url, {
        download: true,
        header: true,
        complete: (results) => {
          const parsed = results.data.filter(row => row.title).map(row => ({
            id: row.id || "custom_" + Math.random(),
            title: row.title,
            description: row.description,
            imageUrl: row.imageUrl || null,
            type: row.type || 'scam',
            choices: [
              { id: "A", text: row.ca_text, result: row.ca_result, moneyChange: Number(row.ca_money), isGood: Number(row.ca_money) >= 0 },
              { id: "B", text: row.cb_text, result: row.cb_result, moneyChange: Number(row.cb_money), isGood: Number(row.cb_money) >= 0 }
            ],
            explanation: row.explanation
          }));
          resolve(parsed.sort(() => 0.5 - Math.random()).slice(0, length));
        },
        error: () => resolve([...fallbackStages].sort(() => 0.5 - Math.random()).slice(0, length))
      });
    });
  };

  const startSinglePlayer = async () => {
    const finalName = playerName || 'ผู้เล่นคนเดียว';
    setPlayerName(finalName);
    
    // โหมดออฟไลน์ล้วน (Local Mode)
    const stages = await fetchStagesFromSheet(sheetUrl, gameLength);
    const role = roles[roleId] || roles.pensioner;
    
    const localRoom = {
      id: 'LOCAL',
      host: 'LOCAL_ME',
      players: [{
        id: 'LOCAL_ME',
        name: finalName,
        role: role,
        money: role.startMoney,
        isReady: true,
        history: [],
        lastSalaryBonus: 0
      }],
      state: 'playing',
      stages: stages,
      currentStageIndex: 0,
      responses: {}
    };
    
    setRoomData(localRoom);
    setCurrentStage(stages[0]);
    setStageIndex(0);
    setAppState('playing');
    setIsSinglePlayer(true);
    setIsLocalMode(true);
  };

  const joinRoom = () => {
    if (!roomId || !playerName) return alert('กรุณากรอกข้อมูลให้ครบ');
    socket.emit('joinRoom', { roomId, playerName, roleId }, (res) => {
      if (res.error) return alert(res.error);
      setRoomData(res.room);
      setAppState('lobby');
    });
  };

  const startGame = () => {
    socket.emit('startGame', roomId);
  };

  const submitAnswer = (choiceId) => {
    if (isLocalMode) {
      const room = { ...roomData };
      const p = room.players[0];
      const stage = room.stages[room.currentStageIndex];
      const choice = stage.choices.find(c => c.id === choiceId);
      
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
        if (p.money < 0) p.money = 0;
        
        p.history.push({
          stageIndex: room.currentStageIndex,
          choiceText: choice.text,
          resultText: choice.result,
          moneyChange: earned,
          happinessChange: hapChange
        });
      }
      setRoomData(room);
      setStageResult(stage);
      setHasAnswered(true);
      setAppState('result');
      return;
    }
    socket.emit('submitAnswer', { roomId, choiceId });
    setHasAnswered(true);
  };

  const nextStage = () => {
    if (isLocalMode) {
      const room = { ...roomData };
      room.currentStageIndex++;
      if (room.currentStageIndex >= room.stages.length) {
        room.state = 'finished';
        setAppState('finished');
      } else {
        setCurrentStage(room.stages[room.currentStageIndex]);
        setStageIndex(room.currentStageIndex);
        setHasAnswered(false);
        setStageResult(null);
        setStageImage(null);
        setAppState('playing');
      }
      setRoomData(room);
      return;
    }
    socket.emit('nextStage', roomId);
  };

  const me = isLocalMode ? roomData?.players[0] : roomData?.players.find(p => p.id === socket.id);

  const renderCustomForm = () => (
    <div className="mt-8 bg-indigo-50 p-6 rounded-lg border border-indigo-200 text-left">
      <h3 className="text-xl font-bold text-indigo-800 mb-4 flex items-center gap-2">
        ➕ สร้างด่านพิเศษ
      </h3>
      <form onSubmit={submitCustomStage} className="space-y-4">
        <div>
          <label className="block font-bold mb-1 text-sm">หัวข้อด่าน:</label>
          <input name="title" required className="w-full p-2 border rounded" placeholder="เช่น SMS หลอกลวงแบบใหม่" />
        </div>
        <div>
          <label className="block font-bold mb-1 text-sm">รายละเอียดสถานการณ์:</label>
          <textarea name="description" required className="w-full p-2 border rounded" placeholder="เล่าสถานการณ์ที่เกิดขึ้น..." />
        </div>
        <div>
          <label className="block font-bold mb-1 text-sm">อัปโหลดรูปภาพโจทย์ (ถ้ามี):</label>
          <input name="image" type="file" accept="image/*" className="w-full p-2 bg-white border rounded text-sm" />
        </div>
        
        <div className="bg-red-50 p-3 rounded border border-red-200">
          <h4 className="font-bold text-red-700 mb-2 text-sm">ตัวเลือก A (เช่น ตัดสินใจผิด)</h4>
          <input name="ca_text" required className="w-full p-2 border rounded mb-2 text-sm" placeholder="ข้อความตัวเลือก A" />
          <input name="ca_result" required className="w-full p-2 border rounded mb-2 text-sm" placeholder="เฉลยเมื่อเลือก A" />
          <input name="ca_money" type="number" required className="w-full p-2 border rounded text-sm" placeholder="เงินที่ได้/เสีย (เช่น -50000)" />
        </div>

        <div className="bg-green-50 p-3 rounded border border-green-200">
          <h4 className="font-bold text-green-700 mb-2 text-sm">ตัวเลือก B (เช่น ตัดสินใจถูก)</h4>
          <input name="cb_text" required className="w-full p-2 border rounded mb-2 text-sm" placeholder="ข้อความตัวเลือก B" />
          <input name="cb_result" required className="w-full p-2 border rounded mb-2 text-sm" placeholder="เฉลยเมื่อเลือก B" />
          <input name="cb_money" type="number" required className="w-full p-2 border rounded text-sm" placeholder="เงินที่ได้/เสีย (เช่น 0)" />
        </div>

        <div>
          <label className="block font-bold mb-1 text-sm">คำชี้แจง / ความรู้ป้องกันภัย:</label>
          <textarea name="explanation" required className="w-full p-2 border rounded text-sm" placeholder="สอนวิธีสังเกตหรือป้องกันตัว..." />
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={() => setShowCustomForm(false)} className="flex-1 bg-gray-300 p-3 rounded font-bold text-gray-800">ยกเลิก</button>
          <button type="submit" className="flex-1 bg-indigo-600 text-white p-3 rounded font-bold">บันทึกด่านใหม่</button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-8 text-blue-600">
          <ShieldAlert size={32} />
          <h1 className="text-3xl font-bold">วัยเก๋า รู้ทันมิจ!</h1>
        </div>

        {/* --- Home Screen --- */}
        {appState === 'home' && (
          <div className="space-y-6">

            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="ชื่อผู้เล่น (ปล่อยว่างได้)" 
                className="w-full p-3 border rounded-lg border-blue-300 bg-blue-50"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
              
              <div className="space-y-3">
                <label className="font-bold block text-sm text-gray-600">เลือกตัวละคร (บทบาท):</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(roles).map(role => (
                    <div 
                      key={role.id}
                      onClick={() => setRoleId(role.id)}
                      className={`cursor-pointer border-4 rounded-xl overflow-hidden text-center transition ${roleId === role.id ? 'border-blue-500 shadow-md scale-105 bg-white' : 'border-transparent hover:border-gray-300 bg-gray-50 opacity-80'}`}
                    >
                      <div className="w-full h-24 sm:h-32 bg-blue-50 flex items-center justify-center">
                        <img src={role.img} alt={role.name} className="w-full h-full object-contain p-1" />
                      </div>
                      <div className={`text-xs font-bold py-1 ${roleId === role.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                        {role.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-blue-200">
                <label className="font-bold block text-sm text-gray-600 mb-2">เลือกระยะเวลาการใช้ชีวิต:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 6, label: "3 ปี", desc: "(6 เหตุการณ์)" },
                    { val: 10, label: "5 ปี", desc: "(10 เหตุการณ์)" },
                    { val: 14, label: "7 ปี", desc: "(14 เหตุการณ์)" }
                  ].map(opt => (
                    <div 
                      key={opt.val}
                      onClick={() => setGameLength(opt.val)}
                      className={`cursor-pointer border-2 rounded-lg p-2 text-center transition ${gameLength === opt.val ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-gray-200 hover:border-gray-300 text-gray-500'}`}
                    >
                      <div className="font-bold">{opt.label}</div>
                      <div className="text-xs">{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={startSinglePlayer}
                className="w-full bg-indigo-500 text-white font-bold py-4 px-4 rounded-xl hover:bg-indigo-600 transition shadow-lg text-lg flex justify-center items-center gap-2 mt-6"
              >
                🎮 เล่นคนเดียวทันที (Single Player)
              </button>
            </div>

            <div className="relative flex py-6 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink-0 mx-4 text-sm font-bold text-gray-500">สำหรับคุณครู / ผู้ดูแลระบบ</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-3 text-center">เล่นแบบกลุ่ม (Multiplayer)</h3>
                <div className="flex flex-col gap-2 mb-3">
                  <input 
                    type="text" 
                    placeholder="รหัสห้อง (Room ID)" 
                    className="w-full p-3 border rounded-lg uppercase"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  />
                  <button 
                    onClick={joinRoom}
                    className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition"
                  >
                    เข้าร่วมห้อง
                  </button>
                </div>
                
                <div className="relative flex py-2 items-center mb-3">
                  <div className="flex-grow border-t border-blue-200"></div>
                  <span className="flex-shrink-0 mx-2 text-xs text-blue-400">หรือ</span>
                  <div className="flex-grow border-t border-blue-200"></div>
                </div>

                <button 
                  onClick={createRoom}
                  className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition"
                >
                  สร้างห้องใหม่ (สำหรับโฮสต์)
                </button>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <label className="font-bold block text-sm text-gray-700 flex items-center gap-1 mb-2">
                  📊 ลิงก์ Google Sheet CSV (ชุดโจทย์กำหนดเอง):
                </label>
                <input 
                  type="text" 
                  placeholder="วางลิงก์ CSV (ปล่อยว่างเพื่อใช้โจทย์เริ่มต้น)" 
                  className="w-full p-2 border rounded-lg border-gray-300 text-sm mb-2"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500">* แอดมินสามารถนำรูปฝากเว็บแล้วเอาลิงก์ใส่ในชีตได้เลย</p>
              </div>

            </div>

            {/* QR Code สำหรับแชร์ */}
            <div className="mt-8 flex flex-col items-center p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-3 text-lg">
                <QrCode size={24} /> สแกนคิวอาร์โค้ดเพื่อเข้าเล่น
              </h3>
              <div className="bg-white p-3 rounded-xl shadow-md border mb-2">
                <QRCodeSVG value="https://BoydzII.github.io/gamemij/" size={160} />
              </div>
              <p className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">https://BoydzII.github.io/gamemij/</p>
            </div>
          </div>
        )}

        {/* --- Lobby Screen --- */}
        {appState === 'lobby' && (
          <div className="text-center space-y-6">
            <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-300">
              <h2 className="text-xl font-bold text-yellow-800">รหัสห้อง: <span className="text-3xl tracking-widest">{roomId}</span></h2>
            </div>
            
            <div className="text-left bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold flex items-center gap-2 mb-2"><Users size={20} /> ผู้เล่นรอในห้อง ({roomData?.players.length}/10)</h3>
              <ul className="space-y-2">
                {roomData?.players.map((p, i) => (
                  <li key={i} className="flex justify-between items-center bg-white p-2 rounded border">
                    <span>{p.name} ({p.role.name})</span>
                    <span className="text-green-600 font-bold">฿{p.money.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>

            {isHost ? (
              <button 
                onClick={startGame}
                disabled={!roomData || roomData.players.length === 0}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                เริ่มเกม!
              </button>
            ) : (
              <p className="text-gray-500 animate-pulse">รอโฮสต์เริ่มเกม...</p>
            )}

            {/* เพิ่มด่านสำหรับโฮสต์ในล็อบบี้ */}
            {(isHost || isSinglePlayer) && !showCustomForm && (
              <button onClick={() => setShowCustomForm(true)} className="w-full mt-4 bg-indigo-100 text-indigo-700 font-bold py-3 px-4 rounded-lg border border-indigo-300 hover:bg-indigo-200">
                ➕ แอดโจทย์/ด่านใหม่ด้วยตัวเอง
              </button>
            )}
            {(isHost || isSinglePlayer) && showCustomForm && renderCustomForm()}
          </div>
        )}

        {/* --- Playing Screen --- */}
        {appState === 'playing' && currentStage && (
          <div className="space-y-6">
            {!isHost && me && (
              <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg font-bold text-blue-800">
                <span>{me.name}</span>
                <div className="flex items-center gap-4"><span className={`flex items-center gap-1 ${me.money < 0 ? 'text-red-600' : 'text-green-700'}`}><Coins size={18}/> ฿{me.money.toLocaleString()}</span><span className="flex items-center gap-1 text-pink-500"><Smile size={18}/> {me.happiness !== undefined ? me.happiness : 50}/100</span></div>
              </div>
            )}

            <div className="text-center">
              <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mb-2">
                ด่านที่ {stageIndex + 1} / {roomData.stages.length}
              </span>
              <h2 className="text-2xl font-bold text-red-600">{currentStage.title}</h2>
              <p className="mt-4 text-lg bg-gray-100 p-4 rounded-lg border-l-4 border-red-500">{currentStage.description}</p>
            </div>

            {/* แสดงภาพประกอบ ถ้ามี หรือใช้ภาพอัตโนมัติ */}
            {(() => {
               let displayImg = stageImage || currentStage?.imageUrl;
               if (!displayImg) {
                  const hasScam = currentStage?.choices.some(c => !c.isGood);
                  displayImg = hasScam ? 'img_scam_default.jpg' : 'img_good_default.jpg';
               }
               return displayImg ? (
                  <div className="mt-4 text-center bg-white p-2 rounded-lg shadow border">
                    <p className="text-sm text-gray-500 mb-2 font-bold flex items-center justify-center gap-1">
                      <ShieldAlert size={16} /> ภาพประกอบจำลองสถานการณ์
                    </p>
                    <img src={displayImg} alt="ภาพประกอบ" className="w-full h-auto max-h-[32rem] mx-auto rounded-lg object-contain" />
                  </div>
               ) : null;
            })()}

            {(!isHost || isSinglePlayer) && (
              <div className="space-y-3 mt-6">
                <h3 className="font-bold">คุณจะทำอย่างไร?</h3>
                {hasAnswered ? (
                  <div className="text-center p-6 bg-gray-100 rounded-lg text-gray-500 font-bold">
                    ส่งคำตอบแล้ว รอผู้เล่นคนอื่น...
                  </div>
                ) : (
                  currentStage.choices.map((choice) => (
                    <button
                      key={choice.id}
                      onClick={() => submitAnswer(choice.id)}
                      className="w-full text-left bg-white border-2 border-blue-500 p-4 rounded-lg hover:bg-blue-50 transition"
                    >
                      {choice.text}
                    </button>
                  ))
                )}
              </div>
            )}
            
            {isHost && !isSinglePlayer && (
              <div className="text-center p-6 bg-gray-100 rounded-lg space-y-4">
                <h3 className="font-bold text-xl">รอผู้เล่นตอบ...</h3>
                <p className="text-gray-500 mt-2">{Object.keys(roomData?.responses || {}).length} / {roomData.players.length} คน</p>
                
                <div className="mt-6 pt-4 border-t border-gray-300 text-left">
                  <h4 className="font-bold mb-2 text-indigo-700">📷 ส่งภาพประกอบให้ผู้เล่น (เช่น สลิปปลอม, แชทปลอม)</h4>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      
                      const formData = new FormData();
                      formData.append('image', file);
                      
                      try {
                        const response = await fetch('http://localhost:3001/upload', {
                          method: 'POST',
                          body: formData
                        });
                        const data = await response.json();
                        if (data.url) {
                           socket.emit('sendImage', { roomId, imageUrl: data.url });
                        }
                      } catch (err) {
                        alert('อัปโหลดรูปล้มเหลว');
                      }
                    }}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100
                    "
                  />
                  <p className="text-xs text-gray-500 mt-2">เลือกรูปภาพจากเครื่อง ระบบจะส่งให้ผู้เล่นทุกคนดูทันที</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Result Screen --- */}
        {appState === 'result' && stageResult && (
          <div className="space-y-6 text-center">
            <h2 className="text-3xl font-bold text-blue-600">เฉลย!</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
               {stageResult.choices.map(c => (
                 <div key={c.id} className={`p-3 rounded border ${c.isGood ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                    <p className="font-bold">{c.text}</p>
                    <p className="text-sm mt-1">{c.result}</p>
                 </div>
               ))}
            </div>

            {/* คำชี้แจง / ความรู้ */}
            {stageResult.explanation && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 text-left rounded-r-lg shadow-sm">
                <h4 className="font-bold text-yellow-800 flex items-center gap-2 mb-1">
                  <Shield size={18} /> ความรู้ป้องกันภัย
                </h4>
                <p className="text-sm text-yellow-900">{stageResult.explanation}</p>
              </div>
            )}

            {/* แสดงโบนัสเงินเดือน ถ้ามี */}
            {me && me.lastSalaryBonus > 0 && (
              <div className="bg-green-100 border border-green-400 p-3 rounded-lg text-green-800 animate-bounce shadow-md">
                <h3 className="font-bold text-lg flex items-center justify-center gap-2">
                  <Coins size={24} /> 
                  ถึงรอบรับเงินบำนาญ/ปันผล!
                </h3>
                <p>คุณได้รับเงินเข้าบัญชีเพิ่ม ฿{me.lastSalaryBonus.toLocaleString()}</p>
              </div>
            )}

            {me && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-100 p-4 rounded-lg text-lg font-bold text-blue-900 flex flex-col items-center shadow-inner">
                  <span>ยอดเงินปัจจุบัน</span>
                  <span className={`text-xl sm:text-2xl flex items-center gap-1 mt-2 ${me.money < 0 ? 'text-red-600' : 'text-green-700'}`}><Coins size={24}/> ฿{me.money.toLocaleString()}</span>
                </div>
                <div className="bg-pink-100 p-4 rounded-lg text-lg font-bold text-pink-900 flex flex-col items-center shadow-inner">
                  <span>ระดับความสุข</span>
                  <span className="text-xl sm:text-2xl text-pink-600 flex items-center gap-1 mt-2"><Smile size={24}/> {me.happiness !== undefined ? me.happiness : 50}/100</span>
                </div>
              </div>
            )}

            {isHost || isSinglePlayer ? (
              <button 
                onClick={nextStage}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 mt-4"
              >
                {stageIndex + 1 >= roomData.stages.length ? 'ดูสรุปผลคะแนน' : 'ไปด่านถัดไป'}
              </button>
            ) : (
              <p className="text-gray-500 animate-pulse mt-4">รอโฮสต์กดไปด่านถัดไป...</p>
            )}

            {/* เพิ่มด่านสำหรับโฮสต์ในหน้าเฉลย */}
            {(isHost || isSinglePlayer) && !showCustomForm && (
              <button onClick={() => setShowCustomForm(true)} className="w-full mt-4 bg-indigo-100 text-indigo-700 font-bold py-3 px-4 rounded-lg border border-indigo-300 hover:bg-indigo-200">
                ➕ แอดโจทย์/ด่านใหม่ เพื่อเล่นเป็นด่านถัดไป
              </button>
            )}
            {(isHost || isSinglePlayer) && showCustomForm && renderCustomForm()}
          </div>
        )}

        {/* --- Finished Screen --- */}
        {appState === 'finished' && (
          <div className="space-y-6 text-center">
            
            {me && (() => {
              let hap = me.happiness !== undefined ? me.happiness : 50;
              let debtPenalty = 0;
              if (me.money < 0) {
                 debtPenalty = Math.floor(Math.abs(me.money) / 10000);
                 hap = Math.max(0, hap - debtPenalty);
              }
              let endingImg = 'end_balance.jpg';
              let endingTitle = '⚖️ ใช้ชีวิตได้สมดุล';
              if (me.money >= 1000000 && hap >= 70) { endingImg = 'end_rich_happy.jpg'; endingTitle = '🌟 เศรษฐีผู้เปี่ยมสุข'; }
              else if (me.money >= 1000000 && hap < 50) { endingImg = 'end_rich_sad.jpg'; endingTitle = '💼 รวยแต่เครียด'; }
              else if (me.money <= 200000 && hap >= 70) { endingImg = 'end_poor_happy.jpg'; endingTitle = '💖 เงินน้อยแต่สุขใจ'; }
              else if (me.money <= 200000 && hap < 50) { endingImg = 'end_poor_sad.jpg'; endingTitle = '📉 ล้มละลายและอมทุกข์'; }

              return (
                <div className="mb-6 bg-white p-4 rounded-xl shadow-lg border-2 border-yellow-300">
                  <h3 className="text-xl font-bold mb-2 text-gray-700">ชีวิตในวัยเกษียณของคุณ:</h3>
                  <h4 className={`text-2xl font-bold mb-4 ${me.money < 0 ? 'text-red-600' : 'text-blue-600'}`}>{endingTitle}</h4>
                  <img src={endingImg} alt={endingTitle} className="w-full h-auto max-h-72 mx-auto rounded-lg object-contain" />
                </div>
              );
            })()}

            <Trophy size={64} className="mx-auto text-yellow-500" />
            <h2 className="text-3xl font-bold text-gray-800">จบเกม!</h2>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-4">ตารางคะแนนและบทสรุปชีวิต</h3>
              <ul className="space-y-4">
                {[...(roomData?.players || [])].sort((a,b) => b.money - a.money).map((p, i) => {
                  let hap = p.happiness !== undefined ? p.happiness : 50;
                  
                  let debtPenalty = 0;
                  if (p.money < 0) {
                     debtPenalty = Math.floor(Math.abs(p.money) / 10000);
                     hap = Math.max(0, hap - debtPenalty);
                  }

                  let ending = { title: '⚖️ ใช้ชีวิตได้สมดุล', color: 'text-green-600' };
                  if (p.money >= 1000000 && hap >= 70) ending = { title: '🌟 เศรษฐีผู้เปี่ยมสุข', color: 'text-yellow-600' };
                  else if (p.money >= 1000000 && hap < 50) ending = { title: '💼 รวยแต่เครียด', color: 'text-blue-600' };
                  else if (p.money <= 200000 && hap >= 70) ending = { title: '💖 เงินน้อยแต่สุขใจ', color: 'text-pink-600' };
                  else if (p.money <= 200000 && hap < 50) ending = { title: '📉 ล้มละลายและอมทุกข์', color: 'text-red-600' };

                  return (
                    <li key={i} className="flex flex-col bg-white p-3 rounded-lg shadow-sm border border-yellow-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold flex items-center gap-2">
                          {i === 0 && '🥇'} {i === 1 && '🥈'} {i === 2 && '🥉'}
                          {p.name}
                        </span>
                        <span className={`font-bold ${ending.color}`}>{ending.title}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={`flex items-center gap-1 ${p.money < 0 ? 'text-red-600' : 'text-green-700'}`}>
                          <Coins size={16}/> ฿{p.money.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-pink-500">
                          <Smile size={16}/> สุข {hap}/100 {debtPenalty > 0 && <span className="text-red-500 text-xs">(หนี้ลดสุข -{debtPenalty})</span>}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-300"
            >
              กลับหน้าแรก
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
