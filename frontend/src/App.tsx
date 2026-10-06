import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Shield, ShieldAlert, Coins, Users, Trophy } from 'lucide-react';
import './App.css';

// เชื่อมต่อ Backend
const socket = io('http://localhost:3001');

function App() {
  const [appState, setAppState] = useState('home'); // home, lobby, playing, result, finished
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [roleId, setRoleId] = useState('pensioner');
  const [isHost, setIsHost] = useState(false);
  const [isSinglePlayer, setIsSinglePlayer] = useState(false);
  const [roomData, setRoomData] = useState(null);
  
  const [currentStage, setCurrentStage] = useState(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [stageResult, setStageResult] = useState(null);
  const [stageImage, setStageImage] = useState(null);

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

  const createRoom = () => {
    socket.emit('createRoom', {}, (res) => {
      setRoomId(res.roomId);
      setIsHost(true);
      setAppState('lobby');
    });
  };

  const startSinglePlayer = () => {
    if (!playerName) {
      setPlayerName('ผู้เล่นคนเดียว'); // ตั้งชื่ออัตโนมัติหากไม่พิมพ์
    }
    const finalName = playerName || 'ผู้เล่นคนเดียว';
    
    socket.emit('createRoom', {}, (res) => {
      const newRoomId = res.roomId;
      setRoomId(newRoomId);
      setIsSinglePlayer(true);
      
      socket.emit('joinRoom', { roomId: newRoomId, playerName: finalName, roleId }, (joinRes) => {
        if (joinRes.error) return alert(joinRes.error);
        setRoomData(joinRes.room);
        socket.emit('startGame', newRoomId);
      });
    });
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
    socket.emit('submitAnswer', { roomId, choiceId });
    setHasAnswered(true);
  };

  const nextStage = () => {
    socket.emit('nextStage', roomId);
  };

  // ดึงข้อมูลตัวเอง
  const me = roomData?.players.find(p => p.id === socket.id);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-4 font-sans">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-8 text-blue-600">
          <ShieldAlert size={32} />
          <h1 className="text-3xl font-bold">วัยเก๋า รู้ทันมิจ!</h1>
        </div>

        {/* --- Home Screen --- */}
        {appState === 'home' && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <button 
                onClick={createRoom}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition"
              >
                สร้างห้อง (สำหรับครู/โฮสต์)
              </button>
            </div>

            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="ชื่อผู้เล่น" 
                className="w-full p-3 border rounded-lg border-blue-300 bg-blue-50"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
              
              <div className="space-y-2">
                <label className="font-bold block text-sm text-gray-600">เลือกบทบาท (เงินตั้งต้น):</label>
                <select 
                  className="w-full p-3 border rounded-lg border-blue-300 bg-blue-50"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                >
                  <option value="pensioner">ข้าราชการบำนาญ (มีเงินบำนาญเรื่อยๆ)</option>
                  <option value="wealthy">เศรษฐีวัยเกษียณ (เงินก้อนใหญ่มาก)</option>
                  <option value="salary">พนักงานใกล้เกษียณ (เงินเดือนสูง)</option>
                </select>
              </div>

              <button 
                onClick={startSinglePlayer}
                className="w-full bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-600 transition shadow-md"
              >
                🎮 เล่นคนเดียวทันที (Single Player)
              </button>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400">หรือ เข้าร่วมเกมแบบกลุ่ม</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <input 
                type="text" 
                placeholder="รหัสห้อง 6 หลัก (กรณีเล่นแบบกลุ่ม)" 
                className="w-full p-3 border rounded-lg uppercase"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              />
              <button 
                onClick={joinRoom}
                className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition"
              >
                เข้าร่วมเกม
              </button>
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
          </div>
        )}

        {/* --- Playing Screen --- */}
        {appState === 'playing' && currentStage && (
          <div className="space-y-6">
            {!isHost && me && (
              <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg font-bold text-blue-800">
                <span>{me.name}</span>
                <span className="flex items-center gap-1"><Coins size={18}/> ฿{me.money.toLocaleString()}</span>
              </div>
            )}

            <div className="text-center">
              <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mb-2">
                ด่านที่ {stageIndex + 1} / {roomData.stages.length}
              </span>
              <h2 className="text-2xl font-bold text-red-600">{currentStage.title}</h2>
              <p className="mt-4 text-lg bg-gray-100 p-4 rounded-lg border-l-4 border-red-500">{currentStage.description}</p>
            </div>

            {/* แสดงภาพประกอบ ถ้ามี */}
            {stageImage && (
              <div className="mt-4 text-center bg-white p-2 rounded-lg shadow border">
                <p className="text-sm text-gray-500 mb-2 font-bold flex items-center justify-center gap-1">
                  <ShieldAlert size={16} /> ภาพประกอบจำลองสถานการณ์
                </p>
                <img src={stageImage} alt="ภาพประกอบ" className="max-h-64 mx-auto rounded object-contain" />
              </div>
            )}

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

            {!isHost && me && (
              <div className="bg-blue-100 p-4 rounded-lg text-xl font-bold text-blue-900 flex justify-between items-center">
                <span>ยอดเงินปัจจุบัน:</span>
                <span>฿{me.money.toLocaleString()}</span>
              </div>
            )}

            {isHost || isSinglePlayer ? (
              <button 
                onClick={nextStage}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700"
              >
                {stageIndex + 1 >= roomData.stages.length ? 'ดูสรุปผลคะแนน' : 'ไปด่านถัดไป'}
              </button>
            ) : (
              <p className="text-gray-500 animate-pulse">รอโฮสต์กดไปด่านถัดไป...</p>
            )}
          </div>
        )}

        {/* --- Finished Screen --- */}
        {appState === 'finished' && (
          <div className="space-y-6 text-center">
            <Trophy size={64} className="mx-auto text-yellow-500" />
            <h2 className="text-3xl font-bold text-gray-800">จบเกม!</h2>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-4">ตารางคะแนน (เศรษฐีผู้รู้ทันมิจฉาชีพ)</h3>
              <ul className="space-y-3">
                {[...(roomData?.players || [])].sort((a,b) => b.money - a.money).map((p, i) => (
                  <li key={i} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-yellow-200">
                    <span className="font-bold flex items-center gap-2">
                      {i === 0 && '🥇'} {i === 1 && '🥈'} {i === 2 && '🥉'}
                      {p.name}
                    </span>
                    <span className={`font-bold ${p.money > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      ฿{p.money.toLocaleString()}
                    </span>
                  </li>
                ))}
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
