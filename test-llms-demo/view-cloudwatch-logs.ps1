# PowerShell script to view CloudWatch logs
# Usage: .\view-cloudwatch-logs.ps1 [function-name] [minutes-ago]

param(
    [string]$FunctionName = "multi-llm-rag-chat",
    [int]$MinutesAgo = 60
)

$LogGroupName = "/aws/lambda/$FunctionName"
$Region = "us-east-1"

Write-Host "Viewing logs for: $LogGroupName" -ForegroundColor Cyan
Write-Host "From last $MinutesAgo minutes..." -ForegroundColor Cyan
Write-Host "---" -ForegroundColor Gray

# Calculate start time (current time - minutes in milliseconds)
$StartTime = [DateTimeOffset]::UtcNow.AddMinutes(-$MinutesAgo).ToUnixTimeMilliseconds()

# Get log events
$events = aws logs filter-log-events `
    --log-group-name $LogGroupName `
    --region $Region `
    --start-time $StartTime `
    --query 'events[*].[timestamp,message]' `
    --output json | ConvertFrom-Json

if ($events.Count -eq 0) {
    Write-Host "No log events found in the last $MinutesAgo minutes" -ForegroundColor Yellow
    exit
}

# Display logs
foreach ($event in $events) {
    $timestamp = $event[0]
    $message = $event[1]

    # Convert timestamp to readable format
    $dateTime = [DateTimeOffset]::FromUnixTimeMilliseconds($timestamp).LocalDateTime
    $dateStr = $dateTime.ToString("yyyy-MM-dd HH:mm:ss")

    # Color code based on message content
    if ($message -match "ERROR|Exception|Error") {
        Write-Host "[$dateStr] " -NoNewline -ForegroundColor Gray
        Write-Host $message -ForegroundColor Red
    }
    elseif ($message -match "WARN|Warning") {
        Write-Host "[$dateStr] " -NoNewline -ForegroundColor Gray
        Write-Host $message -ForegroundColor Yellow
    }
    elseif ($message -match "START|END|REPORT") {
        Write-Host "[$dateStr] " -NoNewline -ForegroundColor Gray
        Write-Host $message -ForegroundColor DarkGray
    }
    else {
        Write-Host "[$dateStr] " -NoNewline -ForegroundColor Gray
        Write-Host $message -ForegroundColor White
    }
}

Write-Host "`n---" -ForegroundColor Gray
Write-Host "Total events: $($events.Count)" -ForegroundColor Cyan
