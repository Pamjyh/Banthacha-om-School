# School Portal — Architecture

## ภาพรวม
Portal เป็นไฟล์ HTML ไฟล์เดียว ไม่มี backend ไม่มี framework เปิดระบบย่อยผ่าน iframe overlay แบบ full-screen ในหน้าเดิม

## โครงสร้าง HTML

```
<body>
  <div id="page-wrapper">         ← หน้า Portal หลัก
    <header>                       ← นาฬิกา + ชื่อโรงเรียน
    <main>
      <section.hero>               ← คำทักทาย + วันที่
      <section.systems-grid>       ← card grid (4 ระบบ)
    </main>
    <footer>                       ← เครดิต
  </div>

  <div id="system-overlay">        ← overlay สำหรับ sub-system
    <div.system-bar>               ← top bar + ปุ่มกลับ
    <iframe id="system-frame">     ← โหลด sub-system ที่นี่
  </div>

  <div id="error-modal">           ← modal แสดง error
  <div id="logo-placeholder">      ← fallback เมื่อโลโก้โหลดไม่ได้
```

## iframe Overlay Pattern

### การเปิดระบบ
```js
function openSystem(url, title) {
  _lastFocused = document.activeElement;          // จำ focus เดิม
  document.getElementById('system-frame').src = url;
  document.getElementById('system-overlay').classList.add('active');
  document.getElementById('page-wrapper').classList.add('hidden');
  document.getElementById('back-btn').focus();    // focus ที่ปุ่มกลับ
}
```

### การปิด / กลับหน้าหลัก
```js
function closeSystem() {
  document.getElementById('system-frame').src = 'about:blank'; // clear iframe
  document.getElementById('system-overlay').classList.remove('active');
  document.getElementById('page-wrapper').classList.remove('hidden');
  if (_lastFocused) { _lastFocused.focus(); _lastFocused = null; }
}
```

### CSS toggle
```css
#page-wrapper.hidden { display: none; }
#system-overlay { display: none; }
#system-overlay.active { display: flex; flex-direction: column; }
```

## Card System

### โครงสร้าง card
```html
<div class="sys-card" 
     role="button" 
     tabindex="0"
     data-url="URL"
     data-title="ชื่อระบบ"
     aria-label="เปิดระบบ...">
  <div class="card-icon">emoji</div>
  <div class="card-body">
    <h3 class="card-title">ชื่อ</h3>
    <p class="card-desc">คำอธิบาย</p>
  </div>
  <div class="card-arrow">→</div>
</div>
```

### Card ที่ inactive (Coming Soon)
```html
<div class="sys-card sys-card--inactive"
     role="button"
     aria-disabled="true"
     tabindex="0">
```
- ไม่มี `data-url` — click handler ตรวจ `aria-disabled` แล้ว return
- CSS opacity ลดลง, cursor: not-allowed

### Card Animation
```js
function animateCards() {
  document.querySelectorAll('.sys-card').forEach((card, i) => {
    setTimeout(() => card.classList.add('animate'), 60 + i * 80);
  });
}
```
- CSS `@keyframes cardSlideUp`: opacity 0→1, translateY 18px→0
- `prefers-reduced-motion`: ข้าม animation (class 'animate' ยังถูกเพิ่ม แต่ CSS ไม่เล่น)

## Design Tokens (Notion-inspired)

```css
:root {
  --canvas-soft: #f6f5f4;    /* พื้นหลัง */
  --white: #ffffff;
  --text-primary: #1e1e1e;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --primary: #0075de;        /* สี primary (สีน้ำเงิน) */
  --primary-hover: #005bb5;
  --border: #e5e4e2;
  --border-light: #f0ede8;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --font: 'Sarabun', sans-serif;

  /* สีประจำ card แต่ละระบบ */
  --teal: #0d9488;
  --green: #16a34a;
  --orange: #ea580c;
  --purple: #7c3aed;
}
```

## Thai Clock & Greeting

```js
// ชื่อวัน/เดือนภาษาไทย
const THAI_DAYS   = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.',
                     'ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

// แปลงปี พ.ศ.
const year = now.getFullYear() + 543;

// สร้าง string วันที่ครั้งเดียว ใช้ทั้ง #greeting-date และ #clock-date
const dateStr = `วันที่ ${day} ${THAI_MONTHS[month]} ${year}`;
document.getElementById('greeting-date').textContent = dateStr;
document.getElementById('clock-date').textContent    = dateStr;
```

### Greeting ตามช่วงเวลา
| ช่วงเวลา | คำทักทาย |
|----------|----------|
| 05:00–11:59 | 🌅 สวัสดีตอนเช้า |
| 12:00–12:59 | ☀️ สวัสดีตอนเที่ยง |
| 13:00–17:59 | 🌤 สวัสดีตอนบ่าย |
| 18:00–20:59 | 🌆 สวัสดีตอนเย็น |
| 21:00–04:59 | 🌙 สวัสดีตอนดึก |

## Error Handling

### iframe load error
```js
document.getElementById('system-frame').onerror = function() {
  showError('ไม่สามารถโหลดระบบได้');
};
```

### Logo fallback
```js
function handleLogoError() {
  document.getElementById('logo-placeholder').style.display = 'flex';
  // ซ่อน img tag, แสดง placeholder div แทน
}
```

## Keyboard / Accessibility
- Cards: `role="button" tabindex="0"` + keydown `Enter`/`Space`
- Overlay: `aria-hidden="true/false"` toggle
- Back button: รับ focus อัตโนมัติเมื่อเปิด overlay
- Escape key: ปิด overlay กลับหน้าหลัก
- Focus restore: `_lastFocused` เก็บ element ก่อนเปิด → restore เมื่อปิด
