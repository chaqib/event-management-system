# Event Management System - Stop All Services
Write-Host "🛑 Stopping Event Management System..." -ForegroundColor Red

# Stop Node processes on ports 3000 and 4200
$ports = @(3000, 4200)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "  ✅ Stopped process on port $port (PID: $($conn.OwningProcess))" -ForegroundColor Green
    }
}

Write-Host "`n✅ All services stopped." -ForegroundColor Green
Write-Host "  Note: PostgreSQL and Redis are still running." -ForegroundColor Gray
Write-Host "  To stop PostgreSQL: docker stop ems-postgres" -ForegroundColor Gray
Write-Host "  To stop Redis: Stop-Process -Name redis-server" -ForegroundColor Gray
