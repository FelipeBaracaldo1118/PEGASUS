
import matplotlib
matplotlib.use("Agg")

import requests
import re
import pandas as pd
import matplotlib.pyplot as plt
from flask import Flask, render_template
import os
import json
import numpy as np

app = Flask(__name__)

# === CONFIGURACIÓN DE CARPETAS ===
if not os.path.exists("static"):
    os.makedirs("static")

# === LISTA DE LOGS REMOTOS ===
log_urls = [
    "http://10.13.46.155:8080/W3SVC2/u_ex251016.log",
    "http://10.13.46.195:8080/buildsSharedFolder/u_ex251016.log",
    "http://10.13.46.147:8080/W3SVC2/u_ex251016.log",
    "http://10.13.46.131:8080/W3SVC2/u_ex251016.log",
    "http://10.13.46.139:8080/W3SVC2/u_ex251016.log",
    "http://10.13.46.152:8080/W3SVC2/u_ex251016.log",
]

# === EXPRESIÓN REGULAR PARA PARSEAR LOS LOGS ===
log_pattern = re.compile(
    r"(?P<date>\d{4}-\d{2}-\d{2}) (?P<time>\d{2}:\d{2}:\d{2}) "
    r"(?P<server_ip>\d+\.\d+\.\d+\.\d+) (?P<method>\w+) "
    r"(?P<resource>[^\s]+) .* (?P<client_ip>\d+\.\d+\.\d+\.\d+) "
    r".* (?P<status_code>\d{3}) .* (?P<processing_time>\d+) (?P<bytes_downloaded>\d+)$"
)

ip_mapping_file = "ip_mapping.json"


# === FUNCIONES AUXILIARES ===
def load_ip_mapping():
    try:
        with open(ip_mapping_file, "r") as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"⚠️ No se encontró el archivo '{ip_mapping_file}'. Se usarán IPs directamente.")
        return {}


def download_log(url):
    try:
        print(f"📡 Descargando log desde: {url}")
        response = requests.get(url)
        response.raise_for_status()
        return response.text.splitlines()
    except requests.exceptions.RequestException as e:
        print(f"❌ Error al descargar log desde {url}: {e}")
        return []


def process_log(log_lines, ip_mapping):
    data = []
    for line in log_lines:
        match = log_pattern.match(line)
        if match:
            log_data = match.groupdict()
            client_ip = log_data["client_ip"]
            log_data["client_name"] = ip_mapping.get(client_ip, client_ip)
            data.append(log_data)
    return pd.DataFrame(data)


def process_multiple_logs():
    ip_mapping = load_ip_mapping()
    combined_data = pd.DataFrame()
    for url in log_urls:
        log_lines = download_log(url)
        if log_lines:
            df = process_log(log_lines, ip_mapping)
            if not df.empty:
                combined_data = pd.concat([combined_data, df], ignore_index=True)
            else:
                print(f"⚠️ Log vacío o sin datos válidos desde: {url}")
        else:
            print(f"⚠️ No se pudo descargar: {url}")
    return combined_data


# === FUNCIÓN BASE PARA GENERAR GRÁFICOS ===
def generate_pkg_nsp_graph():
    print("Generando gráfica para .pkg/.nsp...")
    df = process_multiple_logs()
    if df.empty:
        print("No hay datos en los archivos de log.")
        return

    df["bytes_downloaded"] = df["bytes_downloaded"].astype(int)

    # Aseguramos que todos los usuarios aparezcan (incluso si tienen 0%)
    usuarios = sorted(df["client_name"].unique().tolist())

    # Filtrar solo archivos .pkg/.nsp
    mask_pkg_nsp = df["resource"].str.endswith(".pkg") | df["resource"].str.endswith(".nsp")
    paquetes_pkg_nsp = sorted(df[mask_pkg_nsp]["resource"].unique().tolist())

    # Generar colores distintos para cada archivo (automático)
    import matplotlib.colors as mcolors
    import random
    colores = random.sample(list(mcolors.TABLEAU_COLORS.values()), len(paquetes_pkg_nsp))

    porcentaje_pkg_nsp = []
    for user in usuarios:
        user_row = []
        for paquete in paquetes_pkg_nsp:
            user_bytes = df[(df["client_name"] == user) & (df["resource"] == paquete)]["bytes_downloaded"].sum()
            total_bytes = df[df["resource"] == paquete]["bytes_downloaded"].sum()
            pct = (user_bytes / total_bytes * 100) if total_bytes > 0 else 0
            user_row.append(pct)
        porcentaje_pkg_nsp.append(user_row)

    porcentaje_pkg_nsp = np.array(porcentaje_pkg_nsp)

    # === Generar JSON para Chart.js ===
    output_data = {
        "usuarios": usuarios,
        "archivos": [
            {"nombre": paquete, "color": color}
            for paquete, color in zip(paquetes_pkg_nsp, colores)
        ],
        "porcentajes": [
            {paquete: float(f"{pct:.2f}") for paquete, pct in zip(paquetes_pkg_nsp, user_pcts)}
            for user_pcts in porcentaje_pkg_nsp
        ]
    }

    output_path = "static/output_data.json"
    with open(output_path, "w", encoding="utf-8") as json_file:
        json.dump(output_data, json_file, indent=4, ensure_ascii=False)
    print(f"✅ Archivo JSON '{output_path}' generado correctamente con {len(usuarios)} usuarios y {len(paquetes_pkg_nsp)} archivos.")

    # === (opcional) sigue generando el gráfico estático en PNG ===
    x = np.arange(len(usuarios))
    width = 0.8 / len(paquetes_pkg_nsp) if len(paquetes_pkg_nsp) > 0 else 0.8

    fig, ax = plt.subplots(figsize=(max(10, len(usuarios) * 0.7), 6))
    for i, (paquete, color) in enumerate(zip(paquetes_pkg_nsp, colores)):
        bars = ax.bar(x + i * width, porcentaje_pkg_nsp[:, i], width, label=paquete, color=color)
        for bar, pct in zip(bars, porcentaje_pkg_nsp[:, i]):
            if pct > 0:
                ax.text(
                    bar.get_x() + bar.get_width() / 2,
                    bar.get_height() + 1,
                    f"{pct:.1f}%",
                    ha="center",
                    va="bottom",
                    fontsize=8,
                    color="navy",
                    fontweight="bold",
                )

    ax.set_title("Porcentaje de Descarga de Archivos .pkg/.nsp por Usuario", fontsize=15)
    ax.set_xlabel("Usuario / Dispositivo", fontsize=12)
    ax.set_ylabel("Porcentaje de Descarga (%)", fontsize=12)

    tick_positions = x + width * (len(paquetes_pkg_nsp) - 1) / 2 if paquetes_pkg_nsp else x
    ax.set_xticks(tick_positions)
    ax.set_xticklabels(usuarios, rotation=90, ha="center", fontsize=8)
    ax.set_ylim(0, 110)
    ax.legend(title="Archivo", fontsize=8)
    ax.grid(axis="y", linestyle="--", alpha=0.7)
    plt.tight_layout()

    plt.savefig("static/graphs.png")
    plt.close()
    print("📈 Gráfica 'graphs.png' generada exitosamente.")


# === FUNCIÓN CENTRAL PARA AGREGAR MÁS GRÁFICOS EN EL FUTURO ===
def generate_all_graphs():
    df = process_multiple_logs()
    if df.empty:
        print("❌ No se generaron gráficos (logs vacíos).")
        return

    generate_pkg_nsp_graph(df)
    # 🔹 Aquí puedes agregar más fácilmente otros gráficos
    # generate_traffic_by_user(df)
    # generate_status_code_distribution(df)


@app.route("/")
def index():
    generate_all_graphs()
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True)