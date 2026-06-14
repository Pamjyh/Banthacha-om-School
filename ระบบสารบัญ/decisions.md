# ระบบสารบัญ — Decisions

## D1: ใช้ Apps Script แทน Node/Python backend
**เหตุผล**: ไม่ต้องมี server แยก, deploy ฟรีบน Google, ใช้ DriveApp ได้โดยตรง, ทีมคุ้นเคยกับ pattern เดียวกับระบบออมทรัพย์

## D2: ใช้ LINE OA ตัวเดียวกับระบบลงเวลา
**เหตุผล**: ประหยัด, LINE OA 1 ช่องส่งได้หลาย Group และหลายระบบพร้อมกัน แค่ใช้ Channel Access Token เดิม

## D3: ส่ง DM ครูเพิ่มเติมนอกจาก Group message
**เหตุผล**: LINE Messaging API `mentionees` ใน group push message ไม่การันตี notification บนมือถือ การส่ง DM โดยตรงการันตีว่าครูจะเห็น

## D4: ดึงชื่อจริงจาก LINE Profile API ตอนส่ง
**เหตุผล**: ชื่อในระบบ (`TEACHERS[].name`) อาจไม่ตรงกับชื่อ LINE ของครู การดึง displayName จาก API ทำให้ข้อความ @mention ตรงกับที่เห็นในกลุ่มเสมอ

## D5: Base64 file upload ผ่าน JSON body
**เหตุผล**: Apps Script Web App รับ multipart/form-data ได้ไม่ดี, JSON + base64 ทำงานได้เสถียรกว่า ขนาดสูงสุด 20 MB (Drive อนุญาต)

## D6: subfolder ตามปีการศึกษา/ปีปฏิทิน
**เหตุผล**: ง่ายต่อการค้นหาย้อนหลัง, สร้างอัตโนมัติถ้าไม่มี ไม่ต้องสร้างมือ

## D7: ชื่อไฟล์บน Drive = ชื่อเรื่อง + นามสกุลเดิม
**เหตุผล**: ค้นหาได้ง่ายกว่าชื่อไฟล์ต้นฉบับที่มักเป็น `scan001.pdf`
```js
var safeName = title.replace(/[/\\?%*:|"<>\r\n]/g, '_') + '.' + ext;
```

## D8: ไม่มี login / authentication
**เหตุผล**: ระบบใช้ในโรงเรียน network ปิด ผู้ใช้คือเจ้าหน้าที่ธุรการเท่านั้น ความง่ายใช้งานสำคัญกว่า

## D9: Webhook mode ชั่วคราวสำหรับหา userId
**เหตุผล**: ไม่มีเครื่องมืออื่นที่ง่ายกว่า (line-insight.com ปิดแล้ว, Apps Script log ดูยาก) วิธีนี้ส่ง DM กลับหา admin โดยตรง ใช้งานง่ายที่สุด
