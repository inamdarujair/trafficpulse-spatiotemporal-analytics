@echo off
echo ===================================================
echo Setting up Mumbai Traffic Analytics Dependencies
echo ===================================================
echo [1/3] Setting up Python virtual environment...
if not exist venv (
    python -m venv venv
)
call .\venv\Scripts\activate
python -m pip install --upgrade pip
pip install pyspark pymongo

echo [2/3] Installing Backend dependencies...
cd backend
call npm install
cd ..

echo [3/3] Installing Frontend dependencies...
cd frontend
call npm install
cd ..

echo ===================================================
echo Setup complete!
echo ===================================================
