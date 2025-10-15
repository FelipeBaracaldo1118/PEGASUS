import os
import re
import pandas as pd
import matplotlib.pyplot as plt

# Paso 1: Leer todos los archivos de log en la carpeta
def parse_logs(log_folder):
    log_pattern = re.compile(
        r'(?P<date>\d{4}-\d{2}-\d{2}) (?P<time>\d{2}:\d{2}:\d{2}) '
        r'(?P<server_ip>\d+\.\d+\.\d+\.\d+) (?P<method>\w+) '
        r'(?P<resource>[^\s]+) .* (?P<client_ip>\d+\.\d+\.\d+\.\d+) '
        r'.* (?P<status_code>\d{3}) .* (?P<processing_time>\d+)$'
    )
    data = []
    for filename in os.listdir(log_folder):
        file_path = os.path.join(log_folder, filename)
        if os.path.isfile(file_path):
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
                for line in file:
                    match = log_pattern.match(line)
                    if match:
                        data.append(match.groupdict())
    return pd.DataFrame(data)

# Paso 2: Procesar los datos
def process_data(df):
    df['datetime'] = pd.to_datetime(df['date'] + ' ' + df['time'])
    df['hour'] = df['datetime'].dt.hour
    df['status_code'] = df['status_code'].astype(int)
    df['processing_time'] = df['processing_time'].astype(int)
    df['file_name'] = df['resource'].apply(lambda x: x.split('/')[-1])
    return df

# Paso 3: Crear las gráficas
def plot_graphs(df):
    fig, axes = plt.subplots(2, 2, figsize=(18, 12))

    requests_by_ip = df['client_ip'].value_counts()
    axes[0, 0].bar(requests_by_ip.index[:10], requests_by_ip.values[:10], color='skyblue')
    axes[0, 0].set_title('Número de Solicitudes por Dirección IP', fontsize=14)
    axes[0, 0].set_xlabel('Direcciones IP', fontsize=12)
    axes[0, 0].set_ylabel('Número de Solicitudes', fontsize=12)
    axes[0, 0].tick_params(axis='x', rotation=90)
    axes[0, 0].grid(axis='y', linestyle='--', alpha=0.7)

    requests_by_hour = df['hour'].value_counts().sort_index()
    axes[0, 1].plot(requests_by_hour.index, requests_by_hour.values, marker='o', color='lightcoral', linestyle='-')
    axes[0, 1].set_title('Distribución de Solicitudes por Hora', fontsize=14)
    axes[0, 1].set_xlabel('Hora del Día', fontsize=12)
    axes[0, 1].set_ylabel('Número de Solicitudes', fontsize=12)
    axes[0, 1].grid(axis='y', linestyle='--', alpha=0.7)
    if not requests_by_hour.empty:
        max_hour = requests_by_hour.idxmax()
        max_requests = requests_by_hour.max()
        axes[0, 1].annotate(f'Hora Pico: {max_hour}:00\nSolicitudes: {max_requests}', 
                            xy=(max_hour, max_requests), 
                            xytext=(max_hour + 0.5, max_requests + 500),
                            arrowprops=dict(facecolor='black', arrowstyle='->'),
                            fontsize=12, color='black')

    files_requested = df['file_name'].value_counts()
    truncated_files = files_requested.index[:10].map(lambda x: x[:15] + '...' if len(x) > 15 else x)
    axes[1, 0].bar(truncated_files, files_requested.values[:10], color='gold')
    axes[1, 0].set_title('Paquetes Solicitados (Archivos Descargados)', fontsize=14)
    axes[1, 0].set_xlabel('Archivos', fontsize=
12)
    axes[1, 0].set_ylabel('Número de Solicitudes', fontsize=12)
    axes[1, 0].tick_params(axis='x', rotation=90)
    axes[1, 0].grid(axis='y', linestyle='--', alpha=0.7)

    status_codes = df['status_code'].value_counts()
    axes[1, 1].bar(status_codes.index, status_codes.values, color='purple')
    axes[1, 1].set_title('Respuestas del Servidor (Códigos HTTP)', fontsize=14)
    axes[1, 1].set_xlabel('Códigos HTTP', fontsize=12)
    axes[1, 1].set_ylabel('Número de Respuestas', fontsize=12)
    axes[1, 1].grid(axis='y', linestyle='--', alpha=0.7)

    plt.tight_layout()
    plt.show()

# Carpeta de logs
log_folder = r'C:\filesServer\Logs\W3SVC2'

# Ejecutar el programa
try:
    df = parse_logs(log_folder)
    if df.empty:
        print("No se encontraron registros válidos en los archivos de log.")
    else:
        df = process_data(df)
        plot_graphs(df)
except FileNotFoundError:
    print(f"Error: No se encontró la carpeta '{log_folder}'. Asegúrate de que la ruta sea correcta.")
except Exception as e:
    print(f"Se produjo un error: {e}")