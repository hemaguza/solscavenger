# Guía de Instalación y Despliegue en Kubernetes: SolScavenger Core API

Esta guía documenta la instalación, parametrización segura y despliegue del backend de **SolScavenger** en el clúster de Kubernetes (`192.168.0.2`), bajo el namespace centralizado `solana-scavenger`.

---

## 1. Arquitectura de Seguridad y Parametrización en Caliente (Zero-Rebuild)

El backend de Quarkus desacopla completamente el código y las imágenes de contenedor de las configuraciones y credenciales sensibles:

```
+---------------------------------------------------------------------------------+
|                                 Kubernetes                                      |
|                                                                                 |
|  [Secret: solscavenger-core-api-secret]                                         |
|    - Credenciales PostgreSQL (DB_USER, DB_PASSWORD, DB_HOST, DB_NAME)           |
|    - Llaves JWT (privateKey.pem, publicKey.pem)                                 |
|    - Billetera de Tesorería (TREASURY_WALLET)                                   |
|                        |                                                        |
|                        v (Inyección en variables de entorno & montaje seguro)   |
|  [Deployment: solscavenger-core-api] <---+                                      |
|       |                ^                 |                                      |
|       |                | (Montaje en     |                                      |
|       |                  /deployments/config/application.yml)                   |
|       |  [ConfigMap: solscavenger-core-api-config]                              |
|       |    - CORS, Rate Limits, TTLs, Porcentaje Comisión, RPC URL              |
|       |                                                                         |
|       v                                                                         |
|  [POST /api/v1/solana/build-tx]                                                 |
|    - Ensamblado seguro de transacciones Solana (Base64 wire format).            |
|    - Inyección inalterable de CloseAccount + 10% a TREASURY_WALLET.             |
+---------------------------------------------------------------------------------+
```

### Ventajas de Seguridad Financiera y Operación:
1. **Blindaje de Comisiones (Anti-Bypass):**
   - El frontend nunca conoce la dirección de tesorería ni arma las instrucciones de la comisión.
   - El endpoint `POST /api/v1/solana/build-tx` lee `TREASURY_WALLET` y `FEE_PERCENTAGE` directamente del Secret privado del backend y empaqueta la transacción atómica en formato binario de Solana.
   - Si un usuario manipula los bytes de la transacción en su navegador, la firma criptográfica se invalida y la blockchain la rechaza.
2. **Zero-Rebuild:** Para cambiar un límite de peticiones (Rate Limiting), un origen CORS permitido, el porcentaje de comisión o el RPC de Solana, **no se recompila código ni se genera una nueva imagen de Docker**. Se edita el ConfigMap y se aplica un reinicio suave (`rollout restart`).
3. **Protección Anti-Fugas / Anti-Hackeo:**
   - La imagen de Docker no contiene contraseñas de bases de datos ni llaves criptográficas privadas.
   - Las llaves PEM de SmallRye JWT se montan en memoria en `/deployments/keys/` exclusivamente desde el `Secret` de Kubernetes con permisos de solo lectura.
   - El ConfigMap referencia variables mediante `${VARIABLE}`, asegurando que ningún secreto quede visible en texto plano al inspeccionar el ConfigMap.

---

## 2. Inventario de Manifiestos (`k8s/`)

| Archivo | Tipo | Propósito |
| :--- | :--- | :--- |
| `00-namespace.yaml` | `Namespace` | Crea el espacio de nombres aislado `solana-scavenger`. |
| `01-secret.yaml` | `Secret` | Credenciales de base de datos PostgreSQL, wallet de tesorería y llaves RSA para JWT. |
| `02-configmap.yaml` | `ConfigMap` | Contiene el archivo completo `application.yml` parametrizado. |
| `03-deployment.yaml` | `Deployment` | 2 réplicas del contenedor Quarkus JVM con montajes de ConfigMap y Secret. |
| `04-service.yaml` | `Service` | Expone internamente el puerto 8080 del backend. |
| `05-ingress.yaml` | `Ingress` | Enruta el dominio del túnel Cloudflare (`api.solscavenger.hemaguzahouseapp.com`). |

---

## 3. Despliegue Paso a Paso en el Servidor (`192.168.0.2`)

### Paso 0: Compilación Local y Transferencia de Imágenes (Regla Estricta: No compilar en servidor)
> [!IMPORTANT]
> **NO compilar ni ejecutar Maven/Docker build dentro del servidor 192.168.0.2**, ya que agota los recursos de CPU/RAM del nodo. Las imágenes deben compilarse en la máquina local de desarrollo y transferirse al containerd del clúster.

En tu máquina local (Windows / PowerShell):
```powershell
# 1. Empaquetar y construir imagen localmente
./mvnw clean package -DskipTests
docker build -f src/main/docker/Dockerfile.jvm -t solscavenger-core-api:latest .

# 2. Guardar y transferir al servidor
docker save -o solscavenger-core-api.tar solscavenger-core-api:latest
scp solscavenger-core-api.tar hemaguza@192.168.0.2:/tmp/solscavenger-core-api.tar
Remove-Item solscavenger-core-api.tar

# 3. Cargar en containerd (namespace k8s.io) en el servidor
ssh hemaguza@192.168.0.2 'docker load -i /tmp/solscavenger-core-api.tar && echo "@Hemaguza_z89" | sudo -S ctr -n k8s.io images import /tmp/solscavenger-core-api.tar && echo "@Hemaguza_z89" | sudo -S ctr -n k8s.io images tag docker.io/library/solscavenger-core-api:latest solscavenger-core-api:latest && rm /tmp/solscavenger-core-api.tar'
```

### Paso 1: Crear el Namespace Centralizado
```bash
kubectl apply -f k8s/00-namespace.yaml
```

### Paso 2: Configurar y Aplicar el Secret
Edita `k8s/01-secret.yaml` con las contraseñas reales de PostgreSQL y aplica:
```bash
kubectl apply -f k8s/01-secret.yaml
```

### Paso 3: Aplicar el ConfigMap (`application.yml`)
```bash
kubectl apply -f k8s/02-configmap.yaml
```

### Paso 4: Desplegar el Backend y Servicio
```bash
kubectl apply -f k8s/03-deployment.yaml
kubectl apply -f k8s/04-service.yaml
kubectl apply -f k8s/05-ingress.yaml
```

### Paso 5: Verificar Despliegue
```bash
kubectl get pods -n solana-scavenger -l app=solscavenger-core-api
kubectl logs -n solana-scavenger -l app=solscavenger-core-api -f
```

---

## 4. Modificación de Configuración sin Generar Imágenes (Procedimiento de Rollout)

### Escenario A: Ajustar Rate Limiting (Protección Anti-Bot / Anti-DDoS)
Si se detecta un pico de tráfico o ataque y se requiere ajustar los límites por minuto:
1. Edita el ConfigMap en caliente:
```bash
kubectl edit configmap solscavenger-core-api-config -n solana-scavenger
```
O actualiza las líneas en `k8s/02-configmap.yaml`:
```yaml
rate-limit:
  nonce-per-minute: 5      # Reducir de 10 a 5
  scan-per-minute: 3       # Reducir de 5 a 3
  reclaim-per-minute: 3
```
Y reaplica:
```bash
kubectl apply -f k8s/02-configmap.yaml
```

2. Ejecuta el reinicio suave (zero-downtime rollout):
```bash
kubectl rollout restart deployment/solscavenger-core-api -n solana-scavenger
```

3. Confirma la finalización del rollout:
```bash
kubectl rollout status deployment/solscavenger-core-api -n solana-scavenger
```

---

## 5. Endpoints Principales y Pruebas de Salud

### Health Check (Liveness & Readiness):
```bash
curl -I http://api.solscavenger.hemaguzahouseapp.com/api/v1/public/health
```

### Generación de Nonce SIWS:
```bash
curl -X GET "https://api.solscavenger.hemaguzahouseapp.com/api/v1/auth/nonce?wallet=6bFhLqZgQ7d4k6eZ3m2vN9j7K1yX8wP5tS4rA2qD1uC3"
```

### Construcción Segura de Transacción de Reclamo:
```bash
curl -X POST https://api.solscavenger.hemaguzahouseapp.com/api/v1/solana/build-tx \
  -H "Authorization: Bearer <TOKEN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "6bFhLqZgQ7d4k6eZ3m2vN9j7K1yX8wP5tS4rA2qD1uC3",
    "accounts": [
      {
        "pubkey": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
        "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "balance": 0,
        "decimals": 6,
        "reclaimableLamports": 2039280,
        "reclaimableSol": 0.00203928,
        "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
      }
    ]
  }'
```
Respuesta: `HTTP 200 OK` con `transactionsBase64` listas para ser firmadas por la wallet del cliente.
