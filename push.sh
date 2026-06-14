#!/bin/bash
set -e
cd "$(dirname "$0")"
git init
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/Pamjyh/Banthacha-om-School.git
git branch -M main
git add .
git commit -m "รวมทุกระบบใน repo เดียว: บริหารงาน ออมทรัพย์ ลงเวลา สารบัญ"
git push --force origin main
echo "✅ Push เสร็จแล้ว"
