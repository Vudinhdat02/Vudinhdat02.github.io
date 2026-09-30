@echo off
REM ==========================================================
REM  LAY BAN MOI NHAT TU GITHUB VE MAY
REM  Chay truoc khi sua tren may, neu ban vua sua / dang bai truc tiep tren web (#admin).
REM ==========================================================
cd /d "%~dp0"
REM xoa file khoa cua Git con sot lai (neu co), de Git chay duoc
if exist ".git\index.lock" del /f /q ".git\index.lock"
git pull --rebase --autostash origin main
if errorlevel 1 (
  git rebase --abort >nul 2>nul
  echo [!] Khong lay ve duoc. Kiem tra ket noi mang, hoac chup man hinh gui lai.
  pause
  exit /b
)
echo.
echo Xong - may ban da co ban moi nhat (ca bai viet va anh da dang tren web).
pause
