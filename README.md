# SolScavenger by Neihec

> **Secure, non-custodial Solana rent optimizer & dormant token account reclaimer.**  
> Built for the Solana ecosystem to reclaim locked SOL from empty, inactive SPL Token and Token-2022 accounts via atomic transactions.

---

## 🚀 Overview

Every time you interact with a token, memecoin, or dApp on Solana, the network allocates an **Associated Token Account (ATA)** requiring approximately **0.00203928 SOL** in rent-exempt storage. When you trade or sell all your tokens, that storage remains locked on-chain forever unless explicitly closed.

**SolScavenger** scans your wallet for empty accounts (balance = 0), builds atomic Solana transactions, and reclaims your locked SOL directly to your wallet in a single click.

---

## 🛡️ Security & Non-Custodial Architecture

SolScavenger is designed with zero-trust and complete transparency:

- **Non-Custodial:** SolScavenger **never** requests or stores your private keys or seed phrases.
- **Inspect Before Signing:** All compiled transactions use standard Solana `TokenProgram.closeAccount` instructions. Your wallet (Phantom, Solflare, etc.) displays the exact balance changes and recipient before you confirm.
- **Atomic Execution:** If any instruction in a batch fails, the entire transaction reverts. Funds cannot be lost or misrouted.
- **Safety Filtering:** Only accounts with a strictly confirmed balance of **zero (0)** are flagged for reclamation. Active tokens with positive balances are never touched.
- **Nominal Protocol Fee:** A transparent 2.5% protocol fee is routed to the platform treasury upon successful rent reclamation, with 97.5% returned directly to the user.

---

## 📂 Repository Structure

```
solscavenger/
├── frontend/             # High-performance React 19 + TypeScript + Vite dApp
│   ├── src/              # UI components, Solana Wallet Adapter, Tailwind CSS
│   ├── public/           # Static assets, runtime config
│   ├── k8s/              # Kubernetes production manifests & Nginx CSP
│   └── Dockerfile        # Multi-stage production container build
│
└── core-api/             # Reactive High-Throughput Quarkus Backend
    ├── src/main/java/    # Mutiny Reactive REST resources, Solana transaction builder
    ├── src/main/resources# Application profiles, JWT validation
    ├── k8s/              # Kubernetes deployments, ConfigMaps, Secrets
    └── Dockerfile        # Optimized Red Hat UBI JVM container
```

---

## ⚡ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, `@solana/web3.js`, `@solana/wallet-adapter`.
- **Backend:** Java 21, Quarkus 3.x, Hibernate Reactive with Panache, Mutiny, SmallRye JWT, PostgreSQL.
- **Infrastructure:** Kubernetes, Nginx (Alpine), Containerd, Caddy reverse proxy, Cloudflare Zero Trust.
- **Solana Cluster Integration:** Dedicated Helius RPC cluster with automated fallbacks.

---

## 🛠️ Quickstart

### Prerequisites

- Node.js 20+ & npm
- Java 21 (JDK) & Maven / `./mvnw`
- Docker Desktop or Containerd

### 1. Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### 2. Running the Core API

```bash
cd core-api
./mvnw quarkus:dev
```

The backend API will start at `http://localhost:8080`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
