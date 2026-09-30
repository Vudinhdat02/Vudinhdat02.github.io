@echo off
REM ==========================================================
REM  DUA WEBSITE LEN GITHUB LAN DAU  (chi can chay 1 lan)
REM  Nhan dup vao file nay de chay.
REM ==========================================================
cd /d "%~dp0"
REM xoa file khoa cua Git con sot lai (neu co), de Git chay duoc
if exist ".git\index.lock" del /f /q ".git\index.lock"
set REPO=Vudinhdat02.github.io
set URL=https://github.com/Vudinhdat02/%REPO%.git

where git >nul 2>nul
if errorlevel 1 (
  echo [!] May chua cai Git. Trinh duyet se mo trang tai Git - cai xong hay chay lai file nay.
  start https://git-scm.com/download/win
  pause
  exit /b
)

REM doi ten thu muc cau hinh (Windows khong cho tao ten bat dau bang dau cham tu xa)
if exist github-config (
  if not exist ".github\workflows" mkdir ".github\workflows"
  copy /y "github-config\workflows\deploy.yml" ".github\workflows\deploy.yml" >nul
)
if exist vscode-config if not exist .vscode ren vscode-config .vscode

echo.
echo Buoc 1: Tao repo tren GitHub
echo   - Trinh duyet se mo trang tao repo.
echo   - Ten repo: %REPO%   ^|  Chon: Public   ^|  KHONG tick "Add a README"
echo   - Bam "Create repository".
start "" "https://github.com/new?name=%REPO%&visibility=public"
echo.
echo Tao repo xong thi quay lai day va
pause

git config --global user.name >nul 2>nul || git config --global user.name "Vu Dinh Dat"
git config --global user.email >nul 2>nul || git config --global user.email "vudinhdat02@gmail.com"

if not exist .git git init
git add .
git commit -m "Portfolio"
git branch -M main
git remote get-url origin >nul 2>nul || git remote add origin %URL%

echo.
echo Buoc 2: Day code len GitHub (lan dau se hien cua so dang nhap GitHub - hay dang nhap)
git push -u origin main
if errorlevel 1 (
  echo [!] Day len that bai. Kiem tra da tao repo dung ten %REPO% chua, roi chay lai file nay.
  pause
  exit /b
)

echo.
echo Buoc 3: Bat GitHub Pages
echo   - Trinh duyet se mo trang Settings ^> Pages.
echo   - Muc "Build and deployment" ^> "Source": chon "GitHub Actions".
start "" "https://github.com/Vudinhdat02/%REPO%/settings/pages"
echo.
echo Buoc 4: Vao tab Actions, doi dau tick xanh (1-2 phut). Neu bi do: bam vao ^> "Re-run all jobs".
echo Sau do website chay tai:  https://vudinhdat02.github.io
start "" "https://github.com/Vudinhdat02/%REPO%/actions"
pause
