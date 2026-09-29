@echo off
REM ==========================================================
REM  CAP NHAT WEBSITE LEN MANG  (chay moi khi ban them / sua noi dung tren may)
REM  Nhan dup vao file nay de chay.
REM ==========================================================
cd /d "%~dp0"
if exist github-config if not exist .github ren github-config .github
set MSG=
set /p MSG=Noi dung thay doi (vd: Them thanh tich moi) - Enter de bo qua: 
if "%MSG%"=="" set MSG=Cap nhat website
git add .
git commit -m "%MSG%"

REM lay ve nhung gi ban da sua truc tiep tren web (#admin) truoc khi day len
git pull --rebase --autostash origin main
if errorlevel 1 (
  git rebase --abort >nul 2>nul
  echo.
  echo [!] Ban da sua CUNG MOT muc ca tren web va tren may, Git khong tu gop duoc.
  echo     Cach don gian: chay "lay-ban-moi-tu-github.bat" truoc, roi sua lai tren may va chay lai file nay.
  pause
  exit /b
)
git push
if errorlevel 1 (
  echo [!] Chua day len duoc. Neu chua lam lan dau, hay chay file "dang-len-github-lan-dau.bat".
  pause
  exit /b
)
echo.
echo Da day len. Khoang 1-2 phut sau website https://vudinhdat02.github.io se cap nhat.
start "" "https://github.com/Vudinhdat02/Vudinhdat02.github.io/actions"
pause
