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

# CONFIGURACIONES
if not os.path.exists("static"):
    os.makedirs("static")

log_urls = [
    "http://10.13.46.155:8080/W3SVC2/u_ex251016.log",
    "http://10.13.46.195:8080/buildsSharedFolder/u_ex251016.log",
    "http://10.13.46.147:8080/W3SVC2/u_ex251016.log",
    "http://10.13.46.131:8080/W3SVC2/u_ex251016.log",
    "http://10.13.46.139:8080/W3SVC2/u_ex251016.log",
    "http://10.13.46.152:8080/W3SVC2/u_ex251016.log",
]

log_pattern = re.compile(
    r"(?P<date>\d{4}-\d{2}-\d{2}) (?P<time>\d{2}:\d{2}:\d{2}) "
    r"(?P<server_ip>\d+\.\d+\.\d+\.\d+) (?P<method>\w+) "
    r"(?P<resource>[^\s]+) .* (?P<client_ip>\d+\.\d+\.\d+\.\d+) "
    r".* (?P<status_code>\d{3}) .* (?P<processing_time>\d+) (?P<bytes_downloaded>\d+)$"
)

ip_mapping_file = "ip_mapping.json"
archivo_pesos_file = "archivo_pesos.json"
umbral = 80  # Porcentaje mínimo para forzar a 100%

# FUNCIONES
def load_ip_mapping():
    try:
        with open(ip_mapping_file, "r") as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"⚠️ No se encontró '{ip_mapping_file}'")
        return {}

def load_archivo_pesos():
    try:
        with open(archivo_pesos_file, "r") as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"⚠️ No se encontró '{archivo_pesos_file}'")
        return {}

def download_log(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.text.splitlines()
    except requests.exceptions.RequestException as e:
        print(f"❌ Error descargando desde {url}: {e}")
        return []

def process_log(log_lines, ip_mapping):
    data = []
    for line in log_lines:
        match = log_pattern.match(line)
        if match:
            log_data = match.groupdict()
            client_ip = log_data["client_ip"]
            log_data["client_name"] = ip_mapping.get(client_ip, client_ip)
            log_data["resource_base"] = os.path.basename(log_data["resource"])
            data.append(log_data)
    return pd.DataFrame(data)

def process_multiple_logs():
    ip_mapping = load_ip_mapping()
    combined_data = pd.DataFrame()
    for url in log_urls:
        df = process_log(download_log(url), ip_mapping)
        if not df.empty:
            combined_data = pd.concat([combined_data, df], ignore_index=True)
    return combined_data

def generate_pkg_nsp_graph():
    df = process_multiple_logs()
    if df.empty:
        print("❌ No hay datos para procesar")
        return

    df["bytes_downloaded"] = df["bytes_downloaded"].astype(int)
    archivo_pesos = load_archivo_pesos()

    usuarios = sorted(df["client_name"].unique())
    mask_pkg_nsp = df["resource_base"].str.endswith(".pkg") | df["resource_base"].str.endswith(".nsp")
    paquetes_pkg_nsp = sorted(df[mask_pkg_nsp]["resource_base"].unique())

    import matplotlib.colors as mcolors, random
    colores = random.sample(list(mcolors.TABLEAU_COLORS.values()), len(paquetes_pkg_nsp))

    porcentaje_pkg_nsp = []
    for user in usuarios:
        user_row = []
        for archivo in paquetes_pkg_nsp:
            user_bytes = df[(df["client_name"] == user) & (df["resource_base"] == archivo)]["bytes_downloaded"].sum()
            peso_archivo = archivo_pesos.get(archivo, None)
            if peso_archivo and peso_archivo > 0:
                pct = (user_bytes / peso_archivo) * 100
                forzado = False
                if pct >= umbral:
                    pct = 100.0
                    forzado = True
            else:
                pct = 0
                forzado = False
            user_row.append((pct, forzado))
        porcentaje_pkg_nsp.append(user_row)

    porcentaje_pkg_nsp = np.array(porcentaje_pkg_nsp, dtype=object)

    # ✅ GENERAR JSON
    output_data = {
        "usuarios": usuarios,
        "archivos": [{"nombre": p, "color": c} for p, c in zip(paquetes_pkg_nsp, colores)],
        "porcentajes": [
            {arch: {"pct": round(pct, 2), "forzado": forzado}
             for (pct, forzado), arch in zip(user_pcts, paquetes_pkg_nsp)}
            for user_pcts in porcentaje_pkg_nsp
        ],
        "umbral": umbral
    }
    with open("static/output_data.json", "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=4, ensure_ascii=False)
    print("✅ JSON actualizado: static/output_data.json")

    # OPCIONAL: imagen para verificar
    fig, ax = plt.subplots(figsize=(max(10, len(usuarios) * 0.7), 6))
    x = np.arange(len(usuarios))
    width = 0.8 / len(paquetes_pkg_nsp) if paquetes_pkg_nsp else 0.8
    for i, (paquete, color) in enumerate(zip(paquetes_pkg_nsp, colores)):
        pct_values = [porcentaje_pkg_nsp[j, i][0] for j in range(len(usuarios))]
        bars = ax.bar(x + i * width, pct_values, width, label=paquete, color=color)
        for idx, bar in enumerate(bars):
            pct, forzado = porcentaje_pkg_nsp[idx, i]
            if pct > 0:
                label = f"{pct:.1f}%" + ("*" if forzado else "")
                ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+1, label,
                        ha="center", va="bottom", fontsize=8, color="navy", fontweight="bold")

    ax.set_title("Porcentaje de Descarga de Archivos .pkg/.nsp por Usuario")
    ax.legend(title="Archivo", fontsize=8)
    plt.figtext(0.99, 0.01, "* = Porcentaje forzado a 100% por umbral",
                horizontalalignment="right", fontsize=8, color="navy")
    plt.savefig("static/graphs.png")
    plt.close()
    print("📈 Imagen 'graphs.png' generada para verificación")

@app.route("/")
def index():
    generate_pkg_nsp_graph()  # <-- Esto siempre regenera JSON cada vez que se carga
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)