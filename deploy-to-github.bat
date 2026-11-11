@echo off
cd /d "%~dp0"
echo =======================================================
echo   Deploying COGL News to GitHub (Rkn45602/cogl-news)
echo =======================================================
echo.
echo Staging and committing updated files...
git add .
git commit -m "Add Autonomous Top 10 World News Bot, Edit/Delete Admin CMS & SEO Hashtags"
echo.
echo Pushing to main branch...
git push -u origin main
echo.
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Push failed. Please check your GitHub credentials or remote repository.
    echo.
) else (
    echo.
    echo [SUCCESS] Files successfully pushed to GitHub!
    echo Your site and daily news bot will deploy automatically.
    echo.
)
pause
