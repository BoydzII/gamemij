import io

with io.open(r'd:\scam-defender-game\frontend\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Change default state
content = content.replace("const [appState, setAppState] = useState('home');", "const [appState, setAppState] = useState('splash');")

# Add conditional returns
old_return = '''  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 sm:p-4">'''

new_return = '''  if (appState === 'splash') {
    return (
      <div className="w-full h-screen bg-[#051c41] relative flex flex-col items-center justify-center overflow-hidden cursor-pointer" onClick={() => {
         setAppState('loading');
         setTimeout(() => setAppState('home'), 2500);
      }}>
         <img src={`${import.meta.env.BASE_URL}cover.jpg`} className="w-full h-full object-cover max-w-md mx-auto shadow-2xl" />
         <div className="absolute bottom-[10%] w-full text-center animate-pulse opacity-80 pointer-events-none">
           <span className="bg-yellow-400 text-yellow-900 px-6 py-2 rounded-full font-bold shadow-lg text-lg">แตะเพื่อเข้าเกม</span>
         </div>
      </div>
    );
  }

  if (appState === 'loading') {
    return (
      <div className="w-full h-screen bg-[#051c41] flex flex-col items-center justify-center overflow-hidden relative">
         <div className="text-white text-3xl font-bold z-10 animate-pulse mb-8 drop-shadow-lg flex flex-col items-center">
            <ShieldAlert size={64} className="text-yellow-400 mb-4" />
            กำลังโหลด...
         </div>
         
         {[...Array(30)].map((_, i) => (
             <div key={i} className="money-particle" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
                fontSize: `${2 + Math.random() * 2}rem`
             }}>
               💸
             </div>
          ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 sm:p-4">'''

content = content.replace(old_return, new_return)

with io.open(r'd:\scam-defender-game\frontend\src\App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
