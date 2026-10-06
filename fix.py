import io  
with io.open(r'frontend\src\App.tsx', 'r', encoding='utf-8') as f:  
    content = f.read()  
replacements = [  
    ('\" "id\: \event_temple_real\,', '\id\: \event_temple_real\,\n    \imageUrl\: \temple_real.jpg\,'),  
    ('\id\: \event_temple_scam\,', '\id\: \event_temple_scam\,\n    \imageUrl\: \temple_scam.jpg\,'),  
    ('\id\: \event_child_sick\,', '\id\: \event_child_sick\,\n    \imageUrl\: \child_sick.jpg\,'),  
    ('\id\: \event_house_repair\,', '\id\: \event_house_repair\,\n    \imageUrl\: \house_fire.jpg\,')  
]  
for old, new in replacements:  
    content = content.replace(old, new)  
with io.open(r'frontend\src\App.tsx', 'w', encoding='utf-8') as f:  
    f.write(content)  
with io.open(r'backend\index.js', 'r', encoding='utf-8') as f:  
    content2 = f.read()  
for old, new in replacements:  
    content2 = content2.replace(old, new)  
with io.open(r'backend\index.js', 'w', encoding='utf-8') as f:  
    f.write(content2)  
