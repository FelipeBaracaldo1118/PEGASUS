# Nombres de los adaptadores a monitorear
$adapters = @(
    "Ethernet 2",
    "Ethernet"
)

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
            $estado = "Reiniciado"
        } else {
            Write-Host "$adapter OK. No se requiere acción."
            $estado = "OK"
        }
    } else {
        Write-Host "$adapter tiene estado desconocido: $($status.Status)"
        $estado = "Desconocido"
    }
    Add-Content -Path "C:\filesServer\monitor_ethernet.log" -Value "$(Get-Date): $adapter - $estado"
    Add-Content -Path "C:\filesServer\monitor_ethernet.log" -Value "$(Get-Date): Script iniciado"
}