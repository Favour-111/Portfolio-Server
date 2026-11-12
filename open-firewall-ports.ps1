New-NetFirewallRule -DisplayName "Caddy HTTP 80" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "Caddy HTTPS 443" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
Write-Host "Firewall rules added for ports 80 and 443."
