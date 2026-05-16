@echo off
REM 寿生宝鉴 - 启动后端服务
REM 使用 Python + Flask + SQLite

cd /d %~dp0

echo ================================
echo   寿生宝鉴 后端启动脚本
echo ================================
echo.

REM 检查 Python
python -c "import flask, sqlite3; print('Python OK')" 2>nul
if errorlevel 1 (
    echo [错误] Python 或 Flask 未安装，请先运行：
    echo   python -m pip install flask flask-cors
    pause
    exit /b 1
)

echo [1/2] 正在启动后端服务（http://localhost:5000）...
start "寿生宝鉴后端" /min python server.py

echo [2/2] 等待服务启动（5秒）...
timeout /t 5 /nobreak > nul

echo.
echo ================================
echo  访问地址：<ADDRESS>http://localhost:5000</ADDRESS>
echo ================================
start http://localhost:5000

echo.
pause
