import re
import pandas as pd
import matplotlib.pyplot as plt
import json

# Paso 1: Leer el archivo de logs
def parse_logs(log_file):
    # Expresión regular para extraer los datos del log
    log_pattern = re.compile(
        r'(?P<date>\d{4}-\d{2}-\d{2}) (?P<time>\d{2}:\d{2}:\d{2}) '
        r'(?P<server_ip>\d+\.\d+\.\d+\.\d+) (?P<method>\w+) '
        r'(?P<resource>[^\s]+) .* (?P<client_ip>\d+\.\d+\.\d+\.\d+) '
        r'.* (?P<status_code>\d{3}) .* (?P<processing_time>\d+)$'
    )
    
    data = []
    with open(log_file, 'r') as file:
        for line in file:
            match = log_pattern.match(line)
            if match:
                data.append(match.groupdict())
    
    return pd.DataFrame(data)

# Paso 2: Procesar los datos
def process_data(df):
    # Convertir columnas a tipos adecuados
    df['datetime'] = pd.to_datetime(df['date'] + ' ' + df['time'])
    df['processing_time'] = df['processing_time'].astype(int)
    df['status_code'] = df['status_code'].astype(int)
    # Extraer solo el nombre final del archivo solicitado
    df['file_name'] = df['resource'].apply(lambda x: x.split('/')[-1])
    # Filtrar solo archivos con extensiones .pkg, .nsp, .xvc
    df = df[df['file_name'].str.endswith(('.pkg', '.nsp', '.xvc'))]
    return df

# Paso extra: Exportar resultados a JSON
def export_to_json(df, output_file='output_data.json'):
    # Contar el número de solicitudes por IP
    requests_by_ip = df['client_ip'].value_counts()

    # Agrupar por IP y obtener archivos únicos descargados
    grouped = df.groupby('client_ip')['file_name'].apply(lambda x: list(x.unique())).reset_index()
    grouped['num_requests'] = grouped['client_ip'].map(requests_by_ip)
    grouped['num_files'] = grouped['file_name'].apply(len)
    grouped['request_to_file_ratio'] = grouped['num_requests'] / grouped['num_files']

    # Ordenar las IPs por número de solicitudes
    grouped = grouped.sort_values(by='num_requests', ascending=False)

    # Convertir a diccionario
    data = grouped.to_dict(orient='records')

    # Guardar como JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    print(f"✅ Datos exportados a '{output_file}'")

# Paso 3: Crear las gráficas mejoradas y la tabla
def plot_improved_graphs_with_table(df):
    # Contar el número de solicitudes por IP
    requests_by_ip = df['client_ip'].value_counts()

    # Agrupar por dirección IP y obtener los archivos únicos descargados
    grouped = df.groupby('client_ip')['file_name'].apply(lambda x: ', '.join(x.unique())).reset_index()
    grouped.columns = ['client_ip', 'files']

    # Calcular la relación entre solicitudes y archivos descargados
    grouped['num_requests'] = grouped['client_ip'].map(requests_by_ip)
    grouped['num_files'] = grouped['files'].apply(lambda x: len(x.split(', ')))
    grouped['request_to_file_ratio'] = grouped['num_requests'] / grouped['num_files']

    # Ordenar las direcciones IP por número de solicitudes
    grouped = grouped.sort_values(by='num_requests', ascending=False)

    # Mostrar solo las 10 principales direcciones IP
    top_ips = grouped.head(10)

    # Crear la figura y los subplots
    fig = plt.figure(figsize=(18, 12))  # Tamaño de la figura

    # Gráfico 1: Número de solicitudes al servidor por IP
    ax1 = fig.add_subplot(2, 3, 1)
    bars1 = ax1.bar(top_ips['client_ip'], top_ips['num_requests'], color='skyblue')
    ax1.set_title('Número de Solicitudes al Servidor por Dirección IP', fontsize=14)
    ax1.set_xlabel('Direcciones IP', fontsize=12)
    ax1.set_ylabel('Número de Solicitudes', fontsize=12)
    ax1.tick_params(axis='x', rotation=90)
    ax1.grid(axis='y', linestyle='--', alpha=0.7)

    for bar in bars1:
        ax1.text(bar.get_x() + bar.get_width() / 2, bar.get_height(),
                 str(int(bar.get_height())), ha='center', va='bottom', fontsize=10, color='black')

    # Gráfico 2: Número de archivos descargados por IP
    ax2 = fig.add_subplot(2, 3, 2)
    bars2 = ax2.bar(top_ips['client_ip'], top_ips['num_files'], color='lightcoral')
    ax2.set_title('Número de Archivos Descargados por Dirección IP', fontsize=14)
    ax2.set_xlabel('Direcciones IP', fontsize=12)
    ax2.set_ylabel('Número de Archivos Descargados', fontsize=12)
    ax2.tick_params(axis='x', rotation=90)
    ax2.grid(axis='y', linestyle='--', alpha=0.7)

    for bar in bars2:
        ax2.text(bar.get_x() + bar.get_width() / 2, bar.get_height(),
                 str(int(bar.get_height())), ha='center', va='bottom', fontsize=10, color='black')

    # Gráfico 3: Relación solicitudes/archivos descargados
    ax3 = fig.add_subplot(2, 3, 3)
    bars3 = ax3.bar(top_ips['client_ip'], top_ips['request_to_file_ratio'], color='gold')
    ax3.set_title('Relación Solicitudes/Archivos por Dirección IP', fontsize=14)
    ax3.set_xlabel('Direcciones IP', fontsize=12)
    ax3.set_ylabel('Relación Solicitudes/Archivos', fontsize=12)
    ax3.tick_params(axis='x', rotation=90)
    ax3.grid(axis='y', linestyle='--', alpha=0.7)

    for bar in bars3:
        ax3.text(bar.get_x() + bar.get_width() / 2, round(bar.get_height(), 2),
                 str(round(bar.get_height(), 2)), ha='center', va='bottom', fontsize=10, color='black')

    # Tabla: Archivos solicitados/descargados por IP
    ax4 = fig.add_subplot(2, 1, 2)
    ax4.axis('off')
    table_data = top_ips[['client_ip', 'files']].values
    table = ax4.table(cellText=table_data,
                      colLabels=['Dirección IP', 'Archivos Solicitados/Descargados'],
                      cellLoc='center', loc='center', colWidths=[0.2, 0.8])
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    table.auto_set_column_width([0, 1])

    plt.tight_layout()
    plt.show()

# Archivo de logs
log_file = 'u_ex251015.log'

# Ejecutar el programa
try:
    df = parse_logs(log_file)
    df = process_data(df)
    export_to_json(df)              # <--- Nuevo paso: genera el JSON
    plot_improved_graphs_with_table(df)
except FileNotFoundError:
    print(f"Error: No se encontró el archivo '{log_file}'. Asegúrate de que el archivo esté en la misma carpeta que este script.")
except Exception as e:
    print(f"Se produjo un error: {e}")
