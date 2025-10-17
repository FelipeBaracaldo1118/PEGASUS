import matplotlib

matplotlib.use("Agg")
import requests
import pandas as pd
import matplotlib.pyplot as plt
from flask import Flask, render_template
import os
import json
import numpy as np

app = Flask(__name__)

if not os.path.exists("static"):
    os.makedirs("static")

log_urls = [
    "http://10.13.46.155:8080/W3SVC2/u_ex251017.log",
    "http://10.13.46.195:8080/Logs/W3SVC2/u_ex251017.log",
    "http://10.13.46.147:8080/W3SVC2/u_ex251017.log",
    "http://10.13.46.131:8080/W3SVC2/u_ex251017.log",
    "http://10.13.46.139:8080/W3SVC2/u_ex251017.log",
    "http://10.13.46.152:8080/W3SVC2/u_ex251017.log",
]

ip_mapping_file = "ip_mapping.json"
archivo_pesos_file = "archivo_pesos.json"
umbral = 80  # Porcentaje mínimo para forzar a 100%

# Carga el diccionario de pesos de archivos
try:
    with open(archivo_pesos_file, "r") as f:
        archivo_pesos = json.load(f)
except FileNotFoundError:
    print(f"Error: No se encontró el archivo '{archivo_pesos_file}'.")
    archivo_pesos = {}


def load_ip_mapping():
    try:
        with open(ip_mapping_file, "r") as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"Error: No se encontró el archivo '{ip_mapping_file}'.")
        return {}


def download_log(url):
    try:
        print(f"Intentando descargar el archivo de log desde: {url}")
        response = requests.get(url)
        response.raise_for_status()
        print(f"Archivo de log descargado correctamente desde: {url}")
        return response.text.splitlines()
    except requests.exceptions.RequestException as e:
        print(f"Error al descargar el archivo de log desde {url}: {e}")
        return []


def process_log(log_lines, ip_mapping):
    fields = []
    for line in log_lines:
        if line.startswith("#Fields:"):
            fields = line.replace("#Fields:", "").strip().split()
            break
    if not fields:
        print("No se encontró encabezado de campos en el log.")
        return pd.DataFrame()
    data = []
    for line in log_lines:
        if line.startswith("#"):
            continue
        parts = line.strip().split()
        if len(parts) != len(fields):
            continue
        log_data = dict(zip(fields, parts))
        log_data["client_name"] = ip_mapping.get(
            log_data.get("c-ip", ""), log_data.get("c-ip", "")
        )
        log_data["resource"] = log_data.get("cs-uri-stem", "")
        log_data["bytes_downloaded"] = log_data.get("sc-bytes", "0")
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
                print(
                    f"El archivo descargado desde {url} está vacío o no tiene datos válidos."
                )
        else:
            print(f"No se pudo descargar el archivo desde {url}.")
    return combined_data


def generate_pkg_nsp_graph():
    print("Generando gráfica para .pkg/.nsp con umbral y archivo_pesos.json...")

    umbral = 80  # Porcentaje mínimo para forzar a 100
    archivo_pesos_file = "archivo_pesos.json"

    # Cargar pesos de archivos
    try:
        with open(archivo_pesos_file, "r", encoding="utf-8") as f:
            archivo_pesos = json.load(f)
    except FileNotFoundError:
        print(
            f"⚠️ No se encontró el archivo '{archivo_pesos_file}'. Se usará % relativo a todos."
        )
        archivo_pesos = {}

    # Procesar todos los logs
    df = process_multiple_logs()
    if df.empty:
        print("❌ No hay datos en los archivos de log.")
        return

    df["bytes_downloaded"] = df["bytes_downloaded"].astype(int)
    df["resource_base"] = df["resource"].apply(os.path.basename)

    # Lista de usuarios ordenada
    usuarios = sorted(df["client_name"].unique().tolist())

    # Filtrar solo archivos .pkg/.nsp
    mask_pkg_nsp = df["resource_base"].str.endswith(".pkg") | df[
        "resource_base"
    ].str.endswith(".nsp")
    paquetes_pkg_nsp = sorted(df[mask_pkg_nsp]["resource_base"].unique().tolist())

    # Generar colores
    import matplotlib.colors as mcolors
    import random

    colores = random.sample(
        list(mcolors.TABLEAU_COLORS.values()), len(paquetes_pkg_nsp)
    )

    porcentaje_pkg_nsp = []

    for user in usuarios:
        user_row = []
        for archivo in paquetes_pkg_nsp:
            user_bytes = df[
                (df["client_name"] == user) & (df["resource_base"] == archivo)
            ]["bytes_downloaded"].sum()
            peso_archivo = archivo_pesos.get(archivo, None)
            if peso_archivo and peso_archivo > 0:
                pct = (user_bytes / peso_archivo) * 100
                forzado = False
                if pct >= umbral:
                    pct = 100.0
                    forzado = True
            else:
                # Si no hay peso, usamos lógica relativa a lo descargado por todos
                total_bytes = df[df["resource_base"] == archivo][
                    "bytes_downloaded"
                ].sum()
                pct = (user_bytes / total_bytes * 100) if total_bytes > 0 else 0
                forzado = False
            user_row.append((pct, forzado))
        porcentaje_pkg_nsp.append(user_row)

    porcentaje_pkg_nsp = np.array(porcentaje_pkg_nsp, dtype=object)

    # === Generar JSON para Chart.js ===
    output_data = {
        "usuarios": usuarios,
        "archivos": [
            {"nombre": p, "color": c} for p, c in zip(paquetes_pkg_nsp, colores)
        ],
        "porcentajes": [
            {
                archivo: {"pct": round(pct, 2), "forzado": forzado}
                for (pct, forzado), archivo in zip(user_pcts, paquetes_pkg_nsp)
            }
            for user_pcts in porcentaje_pkg_nsp
        ],
        "umbral": umbral,
    }

    output_path = "static/output_data.json"
    with open(output_path, "w", encoding="utf-8") as json_file:
        json.dump(output_data, json_file, indent=4, ensure_ascii=False)
    print(f"✅ Archivo JSON '{output_path}' generado correctamente.")

    # === Generar gráfico PNG como verificación ===
    x = np.arange(len(usuarios))
    width = 0.8 / len(paquetes_pkg_nsp) if paquetes_pkg_nsp else 0.8

    fig, ax = plt.subplots(figsize=(max(10, len(usuarios) * 0.7), 6))
    for i, (paquete, color) in enumerate(zip(paquetes_pkg_nsp, colores)):
        pct_values = [porcentaje_pkg_nsp[j, i][0] for j in range(len(usuarios))]
        bars = ax.bar(x + i * width, pct_values, width, label=paquete, color=color)
        for idx, bar in enumerate(bars):
            pct, forzado = porcentaje_pkg_nsp[idx, i]
            if pct > 0:
                label = f"{pct:.1f}%" + ("*" if forzado else "")
                ax.text(
                    bar.get_x() + bar.get_width() / 2,
                    bar.get_height() + 1,
                    label,
                    ha="center",
                    va="bottom",
                    fontsize=8,
                    color="navy",
                    fontweight="bold",
                )

    ax.set_title(
        "Porcentaje de Descarga de Archivos .pkg/.nsp por Usuario", fontsize=15
    )
    ax.set_xlabel("Usuario / Dispositivo", fontsize=12)
    ax.set_ylabel("Porcentaje de Descarga (%)", fontsize=12)

    tick_positions = (
        x + width * (len(paquetes_pkg_nsp) - 1) / 2 if paquetes_pkg_nsp else x
    )
    ax.set_xticks(tick_positions)
    ax.set_xticklabels(usuarios, rotation=90, ha="center", fontsize=8)
    ax.set_ylim(0, 110)
    ax.legend(title="Archivo", fontsize=8)
    ax.grid(axis="y", linestyle="--", alpha=0.7)
    plt.figtext(
        0.99,
        0.01,
        "* = Porcentaje forzado a 100% por umbral",
        horizontalalignment="right",
        fontsize=8,
        color="navy",
    )
    plt.tight_layout()

    plt.savefig("static/graphs.png")
    plt.close()
    print("📈 Gráfica 'graphs.png' generada exitosamente.")


@app.route("/")
def index():
    generate_pkg_nsp_graph()
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True)
