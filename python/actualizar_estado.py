import pandas as pd
import requests
import os
import time
import pickle
from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By
from pathlib import Path

def descargar_con_selenium():
    SHEET_ID = '1h5d1JEzCuR5qjjMmrILrjGSItCO15mGVM2Vfd3qFedU'
    GID = '325415643'
    CSV_URL = f'https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}'
    COOKIES_FILE = 'google_cookies.pkl'
    
    download_dir = os.path.abspath(os.path.join(os.getcwd(), 'descargas_temp'))
    os.makedirs(download_dir, exist_ok=True)
    
    edge_options = Options()
    edge_options.add_argument('--no-sandbox')
    edge_options.add_argument('--disable-dev-shm-usage')
    edge_options.add_argument('--disable-gpu')
    
    edge_options.add_experimental_option('prefs', {
        "download.default_directory": download_dir,
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": False,
        "profile.default_content_settings.popups": 0,
        "profile.default_content_setting_values.automatic_downloads": 1
    })
    
    driver_path = r'C:\edgedriver\msedgedriver.exe'
    
    if not os.path.exists(driver_path):
        print(f"❌ ERROR: No se encuentra el driver en: {driver_path}")
        return None
    
    service = Service(executable_path=driver_path)
    driver = webdriver.Edge(service=service, options=edge_options)
    
    try:
        driver.get('https://accounts.google.com')
        time.sleep(2)
        
        if os.path.exists(COOKIES_FILE):
            print("🍪 Cargando cookies guardadas...")
            with open(COOKIES_FILE, 'rb') as f:
                cookies = pickle.load(f)
                for cookie in cookies:
                    try:
                        driver.add_cookie(cookie)
                    except:
                        pass
            print("   ✅ Cookies cargadas")
        
        # Limpiar carpeta de descargas
        for file in os.listdir(download_dir):
            file_path = os.path.join(download_dir, file)
            try:
                os.remove(file_path)
            except:
                pass
        
        print("📥 Descargando CSV...")
        driver.get(CSV_URL)
        time.sleep(3)
        
        if 'accounts.google.com' in driver.current_url:
            print("\n⚠️  Inicia sesión en Edge...")
            input("👉 Presiona ENTER cuando hayas iniciado sesión...")
            
            cookies = driver.get_cookies()
            with open(COOKIES_FILE, 'wb') as f:
                pickle.dump(cookies, f)
            
            driver.get(CSV_URL)
            time.sleep(3)
        
        # Esperar descarga
        max_wait = 30
        waited = 0
        csv_file = None
        
        while waited < max_wait:
            files = os.listdir(download_dir)
            csv_files = [f for f in files if f.endswith('.csv')]
            temp_files = [f for f in files if f.endswith('.crdownload') or f.endswith('.tmp')]
            
            if csv_files and not temp_files:
                csv_file = os.path.join(download_dir, csv_files[0])
                break
            
            time.sleep(1)
            waited += 1
        
        if not csv_file or not os.path.exists(csv_file):
            print("❌ No se descargó el archivo CSV")
            return None
        
        df = pd.read_csv(csv_file)
        print(f"✅ CSV descargado: {len(df)} filas")
        
        return df
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None
        
    finally:
        driver.quit()

def revisar_y_enviar():
    ENDPOINT_URL = 'http://10.13.46.195:8080/actualizar-estado'
    
    # ========================================
    # DESCARGAR CSV
    # ========================================
    df = descargar_con_selenium()
    
    if df is None:
        print("❌ No se pudo descargar la hoja")
        return
    
    print(f"\n📋 DATOS DESCARGADOS:")
    print(f"   Total de filas: {len(df)}")
    print(f"   Columnas: {list(df.columns)}")
    
    if 'Station' not in df.columns:
        print(f"\n⚠️  Columna 'Station' no encontrada")
        print(f"   Columnas disponibles: {list(df.columns)}")
        return
    
    # ========================================
    # ENVIAR TODOS LOS DATOS (SIN COMPARAR)
    # ========================================
    print(f"\n📤 ENVIANDO TODOS LOS {len(df)} REGISTROS...")
    print(f"   Endpoint: {ENDPOINT_URL}")
    
    enviados = 0
    errores = 0
    
    for index, row in df.iterrows():
        try:
            station = str(row['Station']).strip()
            
            if not station or station == 'nan':
                print(f'   ⚠️  Fila {index}: Station vacío, omitiendo...')
                continue
            
            payload = {
                'station': station,
                'nuevoEstado': 'Reaccion'
            }
            
            response = requests.post(ENDPOINT_URL, json=payload, timeout=10)
            
            if response.status_code == 200:
                print(f'   ✅ {station}: OK')
                enviados += 1
            elif response.status_code == 404:
                print(f'   ❌ {station}: Error 404 - Endpoint no encontrado')
                print(f'      Verifica que la URL sea correcta: {ENDPOINT_URL}')
                errores += 1
            else:
                print(f'   ⚠️  {station}: Error {response.status_code}')
                print(f'      Respuesta: {response.text[:100]}')
                errores += 1
                
        except requests.exceptions.ConnectionError:
            print(f'   ❌ {station}: No se puede conectar al servidor')
            errores += 1
        except requests.exceptions.Timeout:
            print(f'   ❌ {station}: Timeout (servidor no responde)')
            errores += 1
        except Exception as e:
            print(f'   ❌ {station}: {e}')
            errores += 1
    
    print(f"\n" + "=" * 60)
    print(f"✅ PROCESO COMPLETADO")
    print(f"   📤 Enviados exitosamente: {enviados}")
    print(f"   ❌ Errores: {errores}")
    print(f"   📊 Total procesados: {len(df)}")
    print("=" * 60)

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 MONITOREO DE GOOGLE SHEETS")
    print("=" * 60)
    
    # Primera ejecución
    revisar_y_enviar()
    
    # Loop continuo
    continuar = input("\n¿Ejecutar cada 5 minutos? (s/n): ").lower()
    
    if continuar == 's':
        intervalo = input("¿Cada cuántos minutos? (default: 5): ").strip()
        intervalo = int(intervalo) if intervalo.isdigit() else 5
        
        print(f"\n✅ Ejecutando cada {intervalo} minutos")
        print("   Presiona Ctrl+C para detener\n")
        
        while True:
            try:
                print("─" * 60)
                print(f"⏳ Esperando {intervalo} minutos... ({time.strftime('%H:%M:%S')})")
                print("─" * 60)
                time.sleep(intervalo * 60)
                
                revisar_y_enviar()
                
            except KeyboardInterrupt:
                print("\n\n⛔ Detenido por el usuario")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
                import traceback
                traceback.print_exc()