$adapters = @("Ethernet 2", "Ethernet")
$gateway_ip = "8.8.8.8"  # Puedes cambiarlo por la IP de tu puerta de enlace local si lo prefieres

foreach ($adapter in $adapters) {
    $status = Get-NetAdapter -Name $adapter -ErrorAction SilentlyContinue
    if ($status.Status -eq "Disabled") {
        Write-Host "$adapter está deshabilitado. Habilitando..."
        Enable-NetAdapter -Name $adapter -Confirm:$false
        $estado = "Habilitado"
    } elseif ($status.Status -eq "Up") {
        $ip = Get-NetIPAddress -InterfaceAlias $adapter -AddressFamily IPv4 -ErrorAction SilentlyContinue
        if (-not $ip) {
            Write-Host "$adapter está habilitado pero sin IP. Reiniciando..."
            Disable-NetAdapter -Name $adapter -Confirm:$false
            Start-Sleep -Seconds 2
            Enable-NetAdapter -Name $adapter -Confirm:$false
            $estado = "Reiniciado (sin IP)"
        } else {
            # Probar conectividad real
            $ping = Test-Connection -ComputerName $gateway_ip -Count 2 -Quiet
            if (-not $ping) {
                Write-Host "$adapter tiene IP pero no hay acceso a red. Reiniciando..."
                Disable-NetAdapter -Name $adapter -Confirm:$false
                Start-Sleep -Seconds 2
                Enable-NetAdapter -Name $adapter -Confirm:$false
                $estado = "Reiniciado (sin acceso a red)"
            } else {
                Write-Host "$adapter OK. Conectividad confirmada."
                $estado = "OK"
            }
        }
    } else {
        Write-Host "$adapter tiene estado desconocido: $($status.Status)"
        $estado = "Desconocido"
    }
    Add-Content -Path "C:\filesServer\monitor_ethernet.log" -Value "$(Get-Date): $adapter - $estado"
}