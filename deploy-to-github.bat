@echo off
cd /d "%~dp0"
echo =======================================================
echo   Deploying COGL News to GitHub (Rkn45602/cogl-news)
echo =======================================================
echo.
echo 1. Ensure you have created the repository on GitHub:
echo    https://github.com/new (Repository name: cogl-news)
echo.
pause
echo.
echo Pushing to main branch...
"C:\Users\DELL\mingit\cmd\git.exe" push -u origin main
echo.
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Push failed. If the repository does not exist yet,
    echo create it at https://github.com/new with name "cogl-news".
    echo.
) else (
    echo.
    echo [SUCCESS] Files successfully pushed to GitHub!
    echo Your site will deploy via GitHub Pages:
    echo https://rkn45602.github.io/cogl-news/
    echo.
)
pause
