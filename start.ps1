# Event Management System - Start All Services
Write-Host "🎉 Starting Event Management System..." -ForegroundColor Cyan

$root = $PSScriptRoot

# 1. Start PostgreSQL (Docker)
Write-Host "`n📦 Starting PostgreSQL..." -ForegroundColor Yellow
$pg = docker ps --filter "name=ems-postgres" --format "{{.Names}}" 2>$null
if ($pg -ne "ems-postgres") {
    docker start ems-postgres 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Creating PostgreSQL container..." -ForegroundColor Gray
        docker run -d --name ems-postgres -e POSTGRES_USER=ems_user -e POSTGRES_PASSWORD=ems_password_2026 -e POSTGRES_DB=event_management -p 5432:5432 --health-cmd="pg_isready -U ems_user" --health-interval=5s postgres:16
    }
    Start-Sleep -Seconds 3
}
Write-Host "  ✅ PostgreSQL running on port 5432" -ForegroundColor Green

# 2. Start Redis
Write-Host "`n📦 Starting Redis..." -ForegroundColor Yellow
$redis = Get-Process redis-server -ErrorAction SilentlyContinue
if (-not $redis) {
    $redisPath = Get-Command redis-server -ErrorAction SilentlyContinue
    if ($redisPath) {
        Start-Process redis-server -WindowStyle Hidden
        Start-Sleep -Seconds 2
        Write-Host "  ✅ Redis started on port 6379" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Redis not found - install Redis or start manually" -ForegroundColor DarkYellow
    }
} else {
    Write-Host "  ✅ Redis already running on port 6379" -ForegroundColor Green
}

# 3. Install dependencies if needed
if (-not (Test-Path "$root\backend\node_modules")) {
    Write-Host "`n📥 Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location "$root\backend"
    npm install
    Pop-Location
}
if (-not (Test-Path "$root\frontend\node_modules")) {
    Write-Host "`n📥 Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location "$root\frontend"
    npm install
    Pop-Location
}

# 4. Start Backend
Write-Host "`n🚀 Starting Backend (NestJS)..." -ForegroundColor Yellow
$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm run start:dev" -PassThru
Write-Host "  ✅ Backend starting on http://localhost:3000 (PID: $($backendJob.Id))" -ForegroundColor Green

# 5. Start Frontend
Write-Host "`n🚀 Starting Frontend (React + Vite)..." -ForegroundColor Yellow
$frontendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev" -PassThru
Write-Host "  ✅ Frontend starting on http://localhost:4200 (PID: $($frontendJob.Id))" -ForegroundColor Green

# Summary
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  🎉 All services started!" -ForegroundColor Cyan
Write-Host "  🌐 Frontend:  http://localhost:4200" -ForegroundColor White
Write-Host "  🔌 Backend:   http://localhost:3000" -ForegroundColor White
Write-Host "  📚 API Docs:  http://localhost:3000/api/docs" -ForegroundColor White
Write-Host "  🗄️  Database:  localhost:5432" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "`n  Login: admin@eventms.com / Admin@123" -ForegroundColor Gray
Write-Host "`n  Press Ctrl+C in each window to stop services." -ForegroundColor Gray
