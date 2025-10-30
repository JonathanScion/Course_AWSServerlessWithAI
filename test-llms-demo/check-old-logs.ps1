# Check what those mysterious log groups contain

$LogGroups = @(
    "/aws/lambda/MultiLlmRagStack-CustomS3AutoDeleteObjectsCustomRe-m3TjrJENJcJT",
    "/aws/lambda/MultiLlmRagStack-CustomS3AutoDeleteObjectsCustomRe-uiubWrLIlH2J"
)

foreach ($LogGroup in $LogGroups) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Log Group: $LogGroup" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan

    # Get recent log events
    $events = aws logs filter-log-events `
        --log-group-name $LogGroup `
        --region us-east-1 `
        --max-items 10 `
        --query 'events[*].message' `
        --output text

    Write-Host $events
}
