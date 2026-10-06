import re  
with open(r'frontend\src\App.tsx', 'r', encoding='utf-8') as f: content = f.read()  
match = re.search(r'const roles = \{.*?\};', content, re.DOTALL)  
if match:  
    old_roles = match.group(0)  
    new_roles = 'const roles = {\n  wealthy: { id: \" "wealthy\, name: \คนรวย\, startMoney: 2000000, perRound: 100000, bonus: 0, description: \มีรายได้จากธุรกิจ" 100,0 บาท "ทุกด่าน\, img: imgWealthy },\n  pensioner: { id: \pensioner\, name: \ข้าราชการเกษียณ\, startMoney: 500000, perRound: -10000, bonus: 20000, description: \เสียค่าใช้จ่าย" 10,000/ด่าน และรับบำนาญ 20,0 ทุกๆ 3 "ด่าน\, img: imgPensioner },\n  salary: { id: \salary\, name: \พนักงานระดับสูง\, startMoney: 800000, perRound: 0, bonus: 50000, description: \รับเงินเดือน" 50,0 บาท ทุกๆ 3 "ด่าน\, img: imgSalary }\n};'  
    content = content.replace(old_roles, new_roles)  
    with open(r'frontend\src\App.tsx', 'w', encoding='utf-8') as f: f.write(content)  
    print('Done frontend roles')  
