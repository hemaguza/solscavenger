export interface AppConfig {
  solanaNetwork: 'devnet' | 'mainnet-beta';
  solanaRpc: string;
  apiBaseUrl: string;
}

let currentConfig: AppConfig | null = null;

/**
 * Carga dinámica estricta desde /config.json y sincronización en tiempo real
 * con la API de SolScavenger (PostgreSQL / Consola de Administración).
 */
export async function loadAppConfig(): Promise<AppConfig> {
  try {
    const res = await fetch(`/config.json?t=${Date.now()}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} al solicitar /config.json`);
    }

    const data = await res.json();
    if (!data.solanaNetwork || !data.solanaRpc || data.apiBaseUrl === undefined) {
      throw new Error('El archivo /config.json montado por Kubernetes no contiene los parámetros obligatorios (solanaNetwork, solanaRpc, apiBaseUrl).');
    }

    let dynamicNetwork: 'devnet' | 'mainnet-beta' = data.solanaNetwork;

    // Sincronización viva con el backend / consola de administración
    try {
      const liveRes = await fetch(`${data.apiBaseUrl}/api/v1/solana/config?t=${Date.now()}`);
      if (liveRes.ok) {
        const liveData = await liveRes.json();
        if (liveData.solanaNetwork === 'mainnet-beta' || liveData.solanaNetwork === 'devnet') {
          dynamicNetwork = liveData.solanaNetwork;
        }
      }
    } catch (liveErr) {
      console.warn('[Config] No se pudo consultar configuración viva de la API, usando fallback de config.json:', liveErr);
    }

    const solanaRpc = dynamicNetwork === 'mainnet-beta'
      ? 'https://api.mainnet-beta.solana.com'
      : (data.solanaRpc || 'https://api.devnet.solana.com');

    currentConfig = {
      solanaNetwork: dynamicNetwork,
      solanaRpc,
      apiBaseUrl: data.apiBaseUrl,
    };
    return currentConfig;
  } catch (err) {
    console.error('[Config] Error crítico de configuración: No se pudo cargar /config.json desde el ConfigMap de Kubernetes:', err);
    throw err;
  }
}

export function getAppConfig(): AppConfig {
  if (!currentConfig) {
    throw new Error('[Config] La configuración aún no ha sido cargada desde Kubernetes /config.json');
  }
  return currentConfig;
}
