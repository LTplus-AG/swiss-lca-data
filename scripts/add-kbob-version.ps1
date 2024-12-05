param(
    [Parameter(Mandatory=$true)]
    [string]$DownloadUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [string]$ApiUrl = "http://localhost:3000",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiKey = "SLST#2y9@&T#R^^pm8tJ%ZZerL5@MSXVZ@UnrtgB"
)

$headers = @{
    "x-api-key" = $ApiKey
    "Content-Type" = "application/json"
}

$body = @{
    downloadUrl = $DownloadUrl
    version = $Version
} | ConvertTo-Json

Write-Host "Adding KBOB version $Version with URL: $DownloadUrl"

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/api/kbob/add-version" -Method Post -Headers $headers -Body $body
    Write-Host "Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json)
} catch {
    Write-Host "Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host "Response:" -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message
}
