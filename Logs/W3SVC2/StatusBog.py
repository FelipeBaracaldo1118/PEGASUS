import matplotlib
matplotlib.use('Agg')  # Usar el backend no interactivo
import re
import pandas as pd
import matplotlib.pyplot as plt
from flask import Flask, render_template
import os

# Configurar Flask
app = Flask(__name__)

# Crear la carpeta 'static' si no existe
if not os.path.exists('static'):
    os.makedirs('static')

# Expresión regular para leer el log
log_pattern = re.compile(
    r'(?P<date>\d{4}-\d{2}-\d{2}) (?P<time>\d{2}:\d{2}:\d{2}) '
    r'(?P<server_ip>\d+\.\d+\.\d+\.\d+) (?P<method>\w+) '
    r'(?P<resource>[^\s]+) .* (?P<client_ip>\d+\.\d+\.\d+\.\d+) '
    r'.* (?P<status_code>\d{3}) .* (?P<processing_time>\d+)$'
)

# Ruta del directorio de logs
log_directory = r'C:\filesServer\Logs\W3SVC2'

# Función para obtener el archivo de log más reciente
def get_latest_log_file():
    try:
        # Obtener todos los archivos en el directorio
        files = [os.path.join(log_directory, f) for f in os.listdir(log_directory) if f.endswith('.log')]
        # Ordenar los archivos por fecha de modificación (el más reciente primero)
        latest_file = max(files, key=os.path.getmtime)
        return latest_file
    except ValueError:
        print("No se encontraron archivos de log en el directorio.")
        return None

# Función para leer y procesar el log
def process_log(log_file):
    data = []
    try:
        with open(log_file, 'r') as file:
            for line in file:
                match = log_pattern.match(line)
                if match:
                    data.append(match.groupdict())
    except FileNotFoundError:
        print(f"Error: No se encontró el archivo '{log_file}'.")
    return pd.DataFrame(data)

# Función para generar las gráficas
def generate_graphs():
    log_file = get_latest_log_file()
    if not log_file:
        print("No se encontró un archivo de log válido.")
        return

    df = process_log(log_file)
    if df.empty:
        print("No hay datos en el archivo de log.")
        return

    # Procesar los datos
    df['datetime'] = pd.to_datetime(df['date'] + ' ' + df['time'])
    df['hour'] = df['datetime'].dt.hour
    df['status_code'] = df['status_code'].astype(int)
    df['file_name'] = df['resource'].apply(lambda x: x.split('/')[-1])

    # Crear las gráficas
    fig, axes = plt.subplots(2, 2, figsize=(18, 12))

    # Gráfica 1: Número de solicitudes por dirección IP
    requests_by_ip = df['client_ip'].value_counts()
    axes[0, 0].bar(requests_by_ip.index[:10], requests_by_ip.values[:10], color='skyblue')
    axes[0, 0].set_title('Número de Solicitudes por Dirección IP', fontsize=14)
    axes[0, 0].set_xlabel('Direcciones IP', fontsize=12)
    axes[0, 0].set_ylabel('Número de Solicitudes', fontsize=12)
    axes[0, 0].tick_params(axis='x', rotation=90)
    axes[0, 0].grid(axis='y', linestyle='--', alpha=0.7)

    # Gráfica 2: Distribución de solicitudes por hora
    requests_by_hour = df['hour'].value_counts().sort_index()
    axes[0, 1].bar(requests_by_hour.index, requests_by_hour.values, color='lightcoral')
    axes[0, 1].set_title('Distribución de Solicitudes por Hora', fontsize=14)
    axes[0, 1].set_xlabel('Hora del Día', fontsize=12)
    axes[0, 1].set_ylabel('Número de Solicitudes', fontsize=12)
    axes[0, 1].grid(axis='y', linestyle='--', alpha=0.7)

    # Gráfica 3: Paquetes solicitados (archivos descargados)
    files_requested = df['file_name'].value_counts()
    truncated_files = files_requested.index[:10].map(lambda x: x[:15] + '...' if len(x) > 15 else x)
    axes[1, 0].bar(truncated_files, files_requested.values[:10], color='gold')
    axes[1, 0].set_title('Paquetes Solicitados (Archivos Descargados)', fontsize=14)
    axes[1, 0].set_xlabel('Archivos', fontsize=12)
    axes[1, 0].set_ylabel('Número de Solicitudes', fontsize=12)
    axes[1, 0].tick_params(axis='x', rotation=90)
    axes[1, 0].grid(axis='y', linestyle='--', alpha=0.7)

    # Gráfica 4: Respuestas del servidor (códigos HTTP)
    status_codes = df['status_code'].value_counts()
    axes[1, 1].bar(status_codes.index, status_codes.values, color='purple')
    axes[1, 1].set_title('Respuestas del Servidor (Códigos HTTP)', fontsize=14)
    axes[1, 1].set_xlabel('Códigos HTTP', fontsize=12)
    axes[1, 1].set_ylabel('Número de Respuestas', fontsize=12)
    axes[1, 1].grid(axis='y', linestyle='--', alpha=0.7)

    # Guardar las gráficas como imagen
    plt.tight_layout()
    plt.savefig('static/graphs.png')
    plt.close()

# Ruta principal para mostrar las gráficas
@app.route('/')
def index():
    generate_graphs()  # Generar las gráficas
    return render_template('index.html')

# Ejecutar el servidor Flask
if __name__ == '__main__':
    app.run(debug=True)