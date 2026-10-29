# 🦝 SolScavenger — Strategic Evolution & Backlog

Este documento define la hoja de ruta y visión a largo plazo para la evolución de **SolScavenger**, trascendiendo la fase inicial de recuperación de rent SOL hacia un ecosistema de tesorería y optimización de capital para usuarios de Solana.

---

## 🧭 Visión Estratégica
El modelo actual recupera renta atrapada (~0.00204 SOL por cuenta cerrada) y monetiza un fee del **2%**. 
Sin embargo, el stock de cuentas cerrables de un usuario es finito. La meta de evolución es transformar **SolScavenger** en un centro recurrente de rendimiento, optimización de saldos residuales y seguridad on-chain ("DeFi Janitor & Yield Aggregator").

---

## 📋 Épicas y Funcionalidades del Backlog

### 1. 🌾 SolScavenger Yield & Staking Vaults ("Auto-Compounding")
- **Problema:** El usuario recupera SOL o el protocolo acumula fees en la Tesorería, los cuales quedan ociosos en la wallet.
- **Solución:** Permitir al usuario enviar sus SOL recuperados directamente a pools de Liquid Staking (LSTs) como **JitoSOL**, **bSOL** o **mSOL** en un solo clic.
- **Monetización:** Acuerdos de referidos / revenue share con protocolos LST + staking automático del Treasury de SolScavenger.

### 2. 🔄 Micro-DEX & Zero-Waste Swap (Polvo / Dust Cleaner)
- **Problema:** Los usuarios tienen "dust" (fracciones insignificantes de memecoins o tokens sin liquidez normal) que no pueden vender en DEXs grandes por fees de transacción o slip limits.
- **Solución:** Integración con la API de **Jupiter Swap** o pools de liquidación rápida para barrer todos los tokens de valor residual (< $1 USD) y convertirlos a SOL en una sola transacción en lote, cerrando automáticamente las cuentas tras el swap.

### 3. 🛡️ Suite de Seguridad On-Chain (Revoke & Threat Audit)
- **Problema:** Los usuarios acumulan aprobaciones de gasto (token approvals) infinitas o no deseadas a smart contracts desconocidos o maliciosos.
- **Solución:** 
  - Escáner de delegaciones abiertas (Open Approvals).
  - Botón "Revoke All Risks" para cancelar permisos de terceros sobre tokens en la wallet.
  - Alerta de phishing / tokens falsificados con metadata engañosa.

### 4. 🪙 Tokenomics & Programa de Lealtad ($SCAV)
- **Problema:** Retención y viralidad tras completar el primer scan.
- **Solución:**
  - Token nativo de lealtad / gobernanza o sistema de puntos ("Scavenger Points").
  - Tier de comisión reducida para holders (ej. 1% fee si holdeas o haces stake).
  - Programa de afiliados On-chain: links personalizados donde el promotor gana el 20-30% de los fees generados por sus referidos.

### 5. 🤖 SolScavenger Sentinel (Bot de Monitoreo Automatizado)
- **Problema:** Los traders de memecoins generan decenas de cuentas vacías cada semana pero olvidan entrar a la dApp.
- **Solución:**
  - Bot de Telegram / Discord / Webhook.
  - Alertas automáticas: *"Tu wallet tiene 15 cuentas vacías acumuladas (~0.03 SOL disponibles para reclamar). Haz clic aquí para barrerlas"*.

---

*Documento archivado para planificación y priorización técnica.*

