# Guía de Instalación y Despliegue en Kubernetes: SolScavenger Frontend

Esta guía detalla el despliegue del frontend de **SolScavenger** en el clúster de Kubernetes (`192.168.0.2`), bajo el namespace centralizado `solana-scavenger`.

---

## 1. Principio de Configuración Dinámica (Zero-Rebuild) y Seguridad

Para evitar tener que construir o subir nuevas imágenes de Docker cada vez que se requiere cambiar una variable de red o endpoint RPC:

* **Configuración en Runtime:** La aplicación carga dinámicamente `/config.json` al inicializarse en el navegador.
* **Inyección vía ConfigMap:** En Kubernetes, el archivo `/config.json` proviene directamente del ConfigMap `solscavenger-frontend-config`, montado como volumen en `/usr/share/nginx/html/config.json`.
* **Cero Información Sensible y Cero Reglas Financieras:**
  * El frontend **no contiene** la billetera de tesorería ni el porcentaje de comisión.
  * Todas las transacciones atómicas de reclamo se compilan en el backend (`/api/v1/solana/build-tx`), protegiendo el cobro del 10% contra cualquier intento de evasión en el cliente.
  * Tampoco contiene llaves privadas ni contraseñas.

---

## 2. Estructura de Manifiestos (`k8s/`)

| Archivo | Tipo | Propósito |
| :--- | :--- | :--- |
| `01-configmap.yaml` | `ConfigMap` | Almacena el `config.json` (red Solana, endpoint RPC, URL del Backend). |
| `02-deployment.yaml` | `Deployment` | Despliega 2 réplicas de Nginx montando `config.json` en runtime. |
| `03-service.yaml` | `Service` | Expone internamente el puerto 80 del frontend en el clúster. |
| `04-ingress.yaml` | `Ingress` | Enruta tráfico externo (`solana.hemaguzahouseapp.com`) vía Cloudflare Tunnel. |

---

## 3. Despliegue Paso a Paso en el Servidor

### Paso 0: Compilación Local y Transferencia de Imágenes (Regla Estricta: No compilar en servidor)
> [!IMPORTANT]
> **NO compilar ni ejecutar npm build dentro del servidor 192.168.0.2**, ya que agota los recursos de CPU/RAM del nodo. El frontend se compila localmente y se empaqueta en una imagen liviana de Nginx.

En tu máquina local (Windows / PowerShell):
```powershell
# 1. Compilar y empaquetar imagen Nginx
npm run build
docker build -t solscavenger-frontend:latest .

# 2. Guardar y transferir al servidor
docker save -o solscavenger-frontend.tar solscavenger-frontend:latest
scp solscavenger-frontend.tar hemaguza@192.168.0.2:/tmp/solscavenger-frontend.tar
Remove-Item solscavenger-frontend.tar

# 3. Cargar en containerd (namespace k8s.io) en el servidor
ssh hemaguza@192.168.0.2 'docker load -i /tmp/solscavenger-frontend.tar && echo "@Hemaguza_z89" | sudo -S ctr -n k8s.io images import /tmp/solscavenger-frontend.tar && echo "@Hemaguza_z89" | sudo -S ctr -n k8s.io images tag docker.io/library/solscavenger-frontend:latest solscavenger-frontend:latest && rm /tmp/solscavenger-frontend.tar'
```

### Paso 1: Asegurar el Namespace
```bash
kubectl get namespace solana-scavenger || kubectl create namespace solana-scavenger
```

### Paso 2: Aplicar Manifiestos
```bash
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-deployment.yaml
kubectl apply -f k8s/03-service.yaml
kubectl apply -f k8s/04-ingress.yaml
```

### Paso 3: Verificar Estado de los Pods
```bash
kubectl get pods -n solana-scavenger -l app=solscavenger-frontend
kubectl get svc -n solana-scavenger solscavenger-frontend
```

---

## 4. Modificación de Configuración sin Generar Imágenes (Rollout Rápido)

Si requieres:
1. Cambiar la red de `devnet` a `mainnet-beta`.
2. Actualizar el endpoint RPC de Solana (por ejemplo, a un nodo privado de QuickNode o Helius).
3. Actualizar la URL del backend (`apiBaseUrl`).

### Procedimiento:
1. Edita el ConfigMap en vivo en el clúster:
```bash
kubectl edit configmap solscavenger-frontend-config -n solana-scavenger
```
O actualiza el archivo `k8s/01-configmap.yaml` y reaplica:
```bash
kubectl apply -f k8s/01-configmap.yaml
```

2. Ejecuta el reinicio suave (rollout):
```bash
kubectl rollout restart deployment/solscavenger-frontend -n solana-scavenger
```

3. Verifica el estado del rollout:
```bash
kubectl rollout status deployment/solscavenger-frontend -n solana-scavenger
```

Los navegadores recibirán el nuevo `/config.json` inmediatamente sin haber recompilado código ni construido imágenes Docker.
