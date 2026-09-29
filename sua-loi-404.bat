@echo off
REM ==========================================================
REM  SUA LOI 404 - bat che do tu dong dua website len GitHub Pages
REM  Nhan dup vao file nay de chay (chi can 1 lan).
REM ==========================================================
cd /d "%~dp0"

echo Buoc 1: Bat GitHub Pages
echo   - Trinh duyet se mo trang Settings ^> Pages cua repo.
echo   - Muc "Build and deployment" ^> "Source": chon "GitHub Actions".
echo   - (Neu da chon roi thi bo qua.)
start "" "https://github.com/Vudinhdat02/Vudinhdat02.github.io/settings/pages"
echo.
echo Chon xong thi quay lai day va
pause

REM dua file tu dong deploy vao dung cho GitHub can: .github\workflows\deploy.yml
if not exist ".github\workflows" mkdir ".github\workflows"
copy /y "github-config\workflows\deploy.yml" ".github\workflows\deploy.yml" >nul
if not exist ".github\workflows\deploy.yml" (
  echo [!] Khong tao duoc file .github\workflows\deploy.yml - chup man hinh gui lai.
  pause
  exit /b
)
rmdir /s /q github-config

echo.
echo Buoc 2: Day len GitHub
git add -A
git commit -m "Bat tu dong deploy GitHub Pages"
git pull --rebase --autostash origin main
git push
if errorlevel 1 (
  echo [!] Day len that bai - chup man hinh gui lai.
  pause
  exit /b
)

echo.
echo Buoc 3: Trinh duyet se mo tab Actions. Doi dong "Deploy to GitHub Pages" co dau tick xanh (1-2 phut).
echo   Neu bi do: bam vao no ^> "Re-run all jobs".
echo Sau do mo: https://vudinhdat02.github.io   (dang nhap quan tri: https://vudinhdat02.github.io/#admin)
start "" "https://github.com/Vudinhdat02/Vudinhdat02.github.io/actions"
pause
