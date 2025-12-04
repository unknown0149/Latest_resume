@echo off
echo ============================================================
echo COMPREHENSIVE TEST SUITE - Resume Genie
echo ============================================================
echo.

echo [1/10] Checking Python Installation...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python not found!
    goto :error
)
echo.

echo [2/10] Checking Python Dependencies...
pip list | findstr "transformers torch sentence-transformers"
echo.

echo [3/10] Testing Python NER Service...
cd python
python ner_service.py "I have 5 years experience with React, Node.js, MongoDB, AWS, Docker"
if %errorlevel% neq 0 (
    echo ERROR: NER service failed!
    cd ..
    goto :error
)
echo.

echo [4/10] Testing Python Classification Service...
python classification_service.py "Full stack developer with React TypeScript Node.js" 0.5
if %errorlevel% neq 0 (
    echo ERROR: Classification service failed!
    cd ..
    goto :error
)
echo.

echo [5/10] Testing Python Embedding Service...
python embedding_service.py "Senior Software Engineer with React"
if %errorlevel% neq 0 (
    echo ERROR: Embedding service failed!
    cd ..
    goto :error
)
cd ..
echo.

echo [6/10] Checking .env Configuration...
if exist .env (
    echo ✓ .env file exists
) else (
    echo ERROR: .env file missing!
    goto :error
)
echo.

echo [7/10] Checking Critical Files...
if exist src\server.js (echo ✓ server.js) else (echo ERROR: server.js missing! & goto :error)
if exist src\services\aiRouter.js (echo ✓ aiRouter.js) else (echo ERROR: aiRouter.js missing! & goto :error)
if exist src\services\resumeProcessingService.js (echo ✓ resumeProcessingService.js) else (echo ERROR: resumeProcessingService.js missing! & goto :error)
if exist src\routes\roadmap.routes.js (echo ✓ roadmap.routes.js) else (echo ERROR: roadmap.routes.js missing! & goto :error)
echo.

echo [8/10] Checking Database Connection...
node check-db.js
if %errorlevel% neq 0 (
    echo WARNING: Database check failed - MongoDB may not be running
)
echo.

echo [9/10] Testing Job Import...
node init-jobs.js
echo.

echo [10/10] Testing Resume Flow...
node test-resume-flow.js
echo.

echo ============================================================
echo ✓ ALL TESTS COMPLETED!
echo ============================================================
echo.
echo Next steps:
echo 1. Start server: npm start
echo 2. Test APIs with Postman or curl
echo 3. Upload a resume and check NER extraction
echo 4. Import jobs and verify embeddings
echo.
goto :end

:error
echo.
echo ============================================================
echo ERROR: Test suite failed!
echo ============================================================
echo Please check the error messages above.
echo.
exit /b 1

:end
echo Press any key to exit...
pause > nul
