# School Portal — Project Overview

## เป้าหมาย
หน้า Portal กลางสำหรับโรงเรียนบ้านท่าชะอม ใช้เปิดระบบต่างๆ โดยไม่ต้องล็อกอิน เน้นความง่ายและสวยงาม

## URL
- **Portal**: เปิดจากไฟล์ `School Portal/index.html` ในเครื่อง (ยังไม่ได้ host บน web)

## Stack
| ส่วน | Technology |
|------|-----------|
| Frontend | HTML + CSS + Vanilla JS (single file, ไม่มี build step) |
| Font | Sarabun จาก Google Fonts |
| Design System | Notion-inspired (ดู `DESIGN-notion.md`) |
| Hosting | ยังไม่ได้ deploy (เปิดจาก local) |

## ระบบที่เชื่อมต่อ
| ระบบ | URL | สถานะ |
|------|-----|--------|
| บริหารงาน | https://pamjyh.github.io/School-Management-System/ | ✅ Active |
| ออมทรัพย์ | https://pamjyh.github.io/School-Savings/ | ✅ Active |
| ลงเวลาทำงาน | `../ระบบเช็คชื่อมาทำงาน/index.html` | ✅ Active (local) |
| สารบัญ | — | 🚧 Coming Soon (disabled) |

## ไฟล์หลัก
| ไฟล์ | หน้าที่ |
|------|--------|
| `index.html` | Portal ทั้งหมด รวม HTML + CSS + JS (~500 บรรทัด) |
| `assets/` | รูปโลโก้โรงเรียน |
| `project.md` | ไฟล์นี้ |
| `architecture.md` | โครงสร้างระบบ |
| `decisions.md` | เหตุผลการตัดสินใจ |
| `known-bugs.md` | bugs และวิธีแก้ |
| `tests/checklist.md` | checklist ทดสอบ |

## ข้อมูลโรงเรียน
- **ชื่อ**: โรงเรียนบ้านท่าชะอม
- **ที่อยู่**: ต.เขากวางทอง อ.หนองฉาง จ.อุทัยธานี
- **เครดิต**: พัฒนาโดย Pamjyh_ & Claude by Anthropic

## สถานะปัจจุบัน (มิ.ย. 2569)
- ✅ Portal ใช้งานได้ เปิดระบบทั้ง 3 ในหน้าเดิม (iframe overlay)
- ✅ นาฬิกา + วันที่ + คำทักทายภาษาไทยแบบเรียลไทม์ (พ.ศ.)
- ✅ Card animation (fade-in + slide-up) พร้อม prefers-reduced-motion
- ✅ ARIA roles + focus management + Escape key ครบ
- ✅ Logo fallback เมื่อโหลดรูปไม่ได้
- ✅ Error modal สำหรับ iframe load fail
- 🚧 สารบัญ — ยังไม่มีระบบ (disabled card)
- 🚧 Portal ยังไม่ได้ host บน web (เปิดจาก local เท่านั้น)

## วิธีเปิดใช้งาน
เปิดไฟล์ `School Portal/index.html` ด้วย browser โดยตรง ไม่ต้องการ server
