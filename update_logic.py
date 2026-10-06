import io
import re

def update_file(path, is_frontend=True):
    with io.open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update roles in frontend
    if is_frontend:
        match = re.search(r'const roles = \{.*?\};', content, re.DOTALL)
        if match:
            old_roles = match.group(0)
            new_roles = '''const roles = {
  wealthy: { id: "wealthy", name: "คนรวย", startMoney: 2000000, perRound: 100000, bonus: 0, description: "มีรายได้จากธุรกิจ 100,000 บาท ทุกด่าน", img: imgWealthy },
  pensioner: { id: "pensioner", name: "ข้าราชการเกษียณ", startMoney: 500000, perRound: -10000, bonus: 20000, description: "เสียค่าใช้จ่าย 10,000/ด่าน และรับบำนาญ 20,000 ทุกๆ 3 ด่าน", img: imgPensioner },
  salary: { id: "salary", name: "พนักงานระดับสูง", startMoney: 800000, perRound: 0, bonus: 50000, description: "รับเงินเดือน 50,000 บาท ทุกๆ 3 ด่าน", img: imgSalary }
};'''
            content = content.replace(old_roles, new_roles)

        # 2. Update single-player logic in App.tsx
        old_bonus = '''      if ((room.currentStageIndex + 1) % 2 === 0 && p.role.income > 0) {
         p.money += p.role.income;
         p.lastSalaryBonus = p.role.income;
      }'''
        new_bonus = '''      if (p.role.perRound !== 0) {
         p.money += p.role.perRound;
      }
      
      if ((room.currentStageIndex + 1) % 3 === 0 && p.role.bonus > 0) {
         p.money += p.role.bonus;
         p.lastSalaryBonus = p.role.bonus;
      } else {
         p.lastSalaryBonus = 0;
      }'''
        content = content.replace(old_bonus, new_bonus)
        
        # 3. Add UI display for perRound on Result screen
        # Find where lastSalaryBonus is rendered
        old_ui = '''                  {me.lastSalaryBonus > 0 && (
                    <div className="bg-green-100 border border-green-300 p-3 mt-4 rounded-lg text-green-800 font-bold animate-pulse">
                       💰 คุณได้รับรายได้ประจำรอบนี้: +฿{me.lastSalaryBonus.toLocaleString()}
                    </div>
                  )}'''
        
        new_ui = '''                  {me.role.perRound !== 0 && (
                    <div className={`p-2 mt-3 rounded-lg font-bold text-sm text-center ${me.role.perRound > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                       {me.role.perRound > 0 ? '📈 รายได้จากธุรกิจ: +฿' : '📉 ค่าใช้จ่ายประจำ: -฿'}{Math.abs(me.role.perRound).toLocaleString()}
                    </div>
                  )}
                  {me.lastSalaryBonus > 0 && (
                    <div className="bg-green-100 border border-green-300 p-3 mt-2 rounded-lg text-green-800 font-bold animate-pulse text-sm text-center">
                       💰 คุณได้รับโบนัส/บำนาญรอบนี้: +฿{me.lastSalaryBonus.toLocaleString()}
                    </div>
                  )}'''
        content = content.replace(old_ui, new_ui)

    else:
        # Update backend logic
        old_backend = '''          if ((room.currentStageIndex + 1) % 2 === 0 && p.role.income > 0) {
             p.money += p.role.income;
             earned += p.role.income;
             p.lastSalaryBonus = p.role.income;
          }'''
        
        new_backend = '''          if (p.role.perRound !== 0) {
             p.money += (p.role.perRound || 0);
          }
          if ((room.currentStageIndex + 1) % 3 === 0 && p.role.bonus > 0) {
             p.money += p.role.bonus;
             p.lastSalaryBonus = p.role.bonus;
          } else {
             p.lastSalaryBonus = 0;
          }'''
        content = content.replace(old_backend, new_backend)


    with io.open(path, 'w', encoding='utf-8') as f:
        f.write(content)

update_file(r'd:\scam-defender-game\frontend\src\App.tsx', True)
update_file(r'd:\scam-defender-game\backend\index.js', False)
print('All files updated correctly!')
