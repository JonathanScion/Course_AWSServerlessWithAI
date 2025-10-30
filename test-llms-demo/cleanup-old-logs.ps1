# Clean up orphaned CloudWatch log groups from failed CDK deployment

$OldLogGroups = @(
    "/aws/lambda/MultiLlmRagStack-CustomS3AutoDeleteObjectsCustomRe-m3TjrJENJcJT",
    "/aws/lambda/MultiLlmRagStack-CustomS3AutoDeleteObjectsCustomRe-uiubWrLIlH2J"
)

Write-Host "Found orphaned log groups from old CloudFormation deployment:" -ForegroundColor Yellow
foreach ($LogGroup in $OldLogGroups) {
    Write-Host "  - $LogGroup" -ForegroundColor Yellow
}

Write-Host "`nThese are safe to delete (Lambda functions no longer exist)" -ForegroundColor Cyan
$response = Read-Host "`nDo you want to delete them? (yes/no)"

if ($response -eq "yes") {
    foreach ($LogGroup in $OldLogGroups) {
        Write-Host "`nDeleting: $LogGroup" -ForegroundColor Cyan
        aws logs delete-log-group --log-group-name $LogGroup --region us-east-1

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Deleted successfully" -ForegroundColor Green
        } else {
            Write-Host "✗ Failed to delete" -ForegroundColor Red
        }
    }
    Write-Host "`n✅ Cleanup complete!" -ForegroundColor Green
} else {
    Write-Host "`nCancelled. Log groups remain." -ForegroundColor Yellow
}
