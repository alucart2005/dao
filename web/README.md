<div align="center">

# 💻 Frontend - DAO Voting System

**Next.js 16 web application for decentralized governance**

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Wagmi](https://img.shields.io/badge/Wagmi-v3-orange)](https://wagmi.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<div id="language-selector" style="margin: 20px 0;">
  <button onclick="setLanguage('en')" id="btn-en" style="padding: 8px 16px; margin: 0 5px; background-color: #0070f3; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">English</button>
  <button onclick="setLanguage('es')" id="btn-es" style="padding: 8px 16px; margin: 0 5px; background-color: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">Español</button>
</div>

</div>

---

<div id="content-en">

## 🚀 Features

- ✅ **Wallet Connection**: MetaMask, WalletConnect, and other EIP-1193 compatible wallets
- ✅ **DAO Funding Panel**: Deposit ETH to increase voting power
- ✅ **Proposal Creation**: Create proposals (requires ≥10% of total balance)
- ✅ **Real-time Proposal List**: View all proposals with live status updates
- ✅ **Gasless Voting**: Vote without paying gas fees using meta-transactions
- ✅ **Automatic Execution Daemon**: Execute approved proposals automatically
- ✅ **Responsive Design**: Professional UI that works on all devices
- ✅ **Help System**: Comprehensive help modals and documentation
- ✅ **Contract Auto-Sync**: Automatic synchronization of contract addresses

## 📋 Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Components](#components)
- [Hooks](#hooks)
- [API Routes](#api-routes)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## 🔧 Installation

### Prerequisites

- Node.js 20.x or higher
- npm or yarn

### Install Dependencies

```bash
npm install
```

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the `web/` directory:

```env
# Contract addresses (auto-synced from deployment logs)
NEXT_PUBLIC_DAO_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_FORWARDER_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Chain configuration
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545

# Relayer configuration (server-side only)
RELAYER_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
RELAYER_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

> **Note**: Contract addresses are automatically synchronized when you run `npm run dev`. The sync script reads from `sc/broadcast/` deployment logs.

## 🎯 Usage

### Development Mode

```bash
npm run dev
```

The application will:
- Automatically sync contract addresses from deployment logs
- Start the Next.js development server
- Open at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

### Manual Contract Synchronization

```bash
npm run sync-contracts          # Normal sync
npm run sync-contracts:force    # Force update
npm run sync-contracts:verbose  # Verbose output
```

## 📁 Project Structure

```
web/
├── app/
│   ├── api/                    # API routes
│   │   ├── relay/              # Meta-transaction relay
│   │   ├── nonce/              # Nonce management
│   │   ├── daemon/             # Proposal execution daemon
│   │   ├── eip712-domain/      # EIP-712 domain info
│   │   └── sync-contracts/     # Contract sync API
│   ├── page.tsx                # Home page
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/
│   ├── ConnectWallet.tsx       # Wallet connection
│   ├── FundingPanel.tsx        # DAO funding interface
│   ├── CreateProposal.tsx      # Proposal creation
│   ├── ProposalList.tsx        # Proposal listing
│   ├── ProposalCard.tsx        # Individual proposal card
│   ├── VoteButtons.tsx         # Voting buttons
│   ├── VotingSummary.tsx       # Voting summary
│   ├── DaemonTrigger.tsx       # Daemon execution trigger
│   └── AppHelpModal.tsx        # Application help modal
├── hooks/
│   ├── useDAO.ts               # DAO interaction hooks
│   └── useGaslessVote.ts       # Gasless voting hook
├── lib/
│   ├── config/
│   │   ├── chain.ts            # Wagmi chain configuration
│   │   └── contracts.ts        # Contract ABIs and addresses
│   ├── providers.tsx           # Wagmi and React Query providers
│   └── utils/
│       ├── eip712.ts           # EIP-712 utilities
│       └── index.ts            # General utilities
├── scripts/
│   └── sync-contracts.js       # Auto-sync contract addresses
└── package.json
```

## 🧩 Components

### ConnectWallet

Wallet connection component with disconnect functionality:

```tsx
import { ConnectWallet } from "@/components/ConnectWallet";

<ConnectWallet />;
```

### FundingPanel

Allows users to deposit ETH into the DAO:

```tsx
import { FundingPanel } from "@/components/FundingPanel";

<FundingPanel />;
```

**Features**:
- Display user balance in DAO
- Display total DAO balance
- Deposit ETH to increase voting power
- Help modal with detailed instructions

### CreateProposal

Create new proposals:

```tsx
import { CreateProposal } from "@/components/CreateProposal";

<CreateProposal onProposalCreated={handleProposalCreated} />;
```

**Requirements**:
- User must have at least 10% of total DAO balance
- Valid recipient address
- Amount in ETH
- Deadline timestamp

### ProposalList

Display all proposals with voting summary:

```tsx
import { ProposalList } from "@/components/ProposalList";

<ProposalList refreshTrigger={refreshTrigger} />;
```

**Features**:
- Real-time proposal updates
- Voting summary with statistics
- Expandable proposal cards
- Direct voting from summary
- Daemon execution trigger
- Comprehensive help system

### VoteButtons

Voting interface for proposals:

```tsx
import { VoteButtons } from "@/components/VoteButtons";

<VoteButtons
  proposalId={proposalId}
  isActive={isActive}
  onVoteSuccess={handleVoteSuccess}
/>;
```

**Vote Types**:
- `FOR` (1): Vote in favor
- `AGAINST` (0): Vote against
- `ABSTAIN` (2): Abstain from voting

## 🎣 Hooks

### useDAO

Main hook for DAO interactions:

```typescript
import {
  useUserBalance,
  useTotalBalance,
  useFundDAO,
  useCreateProposal,
  useProposal,
} from "@/hooks/useDAO";

// Get user balance
const { balance, balanceWei, isLoading, error } = useUserBalance();

// Get total DAO balance
const { totalBalance, isLoading, error } = useTotalBalance();

// Fund the DAO
const { fundDAO, isPending, isSuccess, error } = useFundDAO();
fundDAO("1.0"); // Deposit 1 ETH

// Create a proposal
const { createProposal, isPending } = useCreateProposal();
createProposal(recipient, amount, deadline);

// Get proposal data
const { proposal, isLoading, error } = useProposal(proposalId);
```

### useGaslessVote

Vote without paying gas:

```typescript
import { useGaslessVote } from "@/hooks/useGaslessVote";
import { VoteType } from "@/lib/config/contracts";

const { vote, isPending, error, txHash } = useGaslessVote();
vote(proposalId, VoteType.FOR);
```

## 🔌 API Routes

### POST /api/relay

Relay meta-transactions for gasless voting:

```typescript
const response = await fetch("/api/relay", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    request: forwardRequest,
    signature: signature,
  }),
});
```

### GET /api/nonce

Get current nonce for an address:

```typescript
const response = await fetch(
  `/api/nonce?address=${address}&forwarder=${forwarderAddress}`
);
const { nonce } = await response.json();
```

### GET /api/eip712-domain

Get EIP-712 domain information:

```typescript
const response = await fetch(
  `/api/eip712-domain?forwarder=${forwarderAddress}`
);
const { domain } = await response.json();
```

### POST /api/daemon

Trigger automatic proposal execution:

```typescript
const response = await fetch("/api/daemon", { method: "POST" });
const { executed, errors } = await response.json();
```

### GET /api/sync-contracts

Manually trigger contract address synchronization:

```typescript
const response = await fetch("/api/sync-contracts?force=true");
const { success, output } = await response.json();
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run sync-contracts # Sync contract addresses
```

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Web3**: Wagmi v3, viem
- **State Management**: React Query (TanStack Query)
- **Meta-Transactions**: EIP-712, EIP-2771

## 🐛 Troubleshooting

### Contract Not Deployed

**Error**: Contract function returns no data

**Solution**:
1. Ensure contracts are deployed: `cd ../sc && forge script script/DeployLocal.s.sol:DeployLocal --rpc-url http://localhost:8545 --broadcast`
2. Run sync: `npm run sync-contracts:force`

### Address Mismatch

**Problem**: Contract addresses don't match

**Solution**:
```bash
npm run sync-contracts:force
```

### Wallet Connection Issues

**Problem**: Wallet won't connect

**Solution**:
1. Ensure correct network (Chain ID: 31337)
2. Add local network to wallet:
   - Network Name: Local Anvil
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency: ETH

### Meta-Transaction Failures

**Problem**: Gasless voting fails

**Solution**:
1. Check relayer has ETH
2. Verify `RELAYER_PRIVATE_KEY` in `.env.local`
3. Check API route logs

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)
- [React Query](https://tanstack.com/query)

</div>

<div id="content-es" style="display: none;">

## 🚀 Características

- ✅ **Conexión de Wallet**: MetaMask, WalletConnect y otras wallets compatibles con EIP-1193
- ✅ **Panel de Financiación del DAO**: Depositar ETH para aumentar el poder de voto
- ✅ **Creación de Propuestas**: Crear propuestas (requiere ≥10% del balance total)
- ✅ **Lista de Propuestas en Tiempo Real**: Ver todas las propuestas con actualizaciones de estado en vivo
- ✅ **Votación Sin Gas**: Votar sin pagar comisiones usando meta-transacciones
- ✅ **Daemon de Ejecución Automática**: Ejecutar propuestas aprobadas automáticamente
- ✅ **Diseño Responsive**: Interfaz profesional que funciona en todos los dispositivos
- ✅ **Sistema de Ayuda**: Modales de ayuda y documentación completos
- ✅ **Auto-Sincronización de Contratos**: Sincronización automática de direcciones de contratos

## 📋 Tabla de Contenidos

- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Componentes](#componentes)
- [Hooks](#hooks)
- [Rutas API](#rutas-api)
- [Desarrollo](#desarrollo)
- [Solución de Problemas](#solución-de-problemas)

## 🔧 Instalación

### Requisitos Previos

- Node.js 20.x o superior
- npm o yarn

### Instalar Dependencias

```bash
npm install
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env.local` en el directorio `web/`:

```env
# Direcciones de contratos (sincronizadas automáticamente desde logs de despliegue)
NEXT_PUBLIC_DAO_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_FORWARDER_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Configuración de chain
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545

# Configuración del relayer (solo servidor)
RELAYER_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
RELAYER_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

> **Nota**: Las direcciones de contratos se sincronizan automáticamente cuando ejecutas `npm run dev`. El script de sincronización lee desde los logs de despliegue en `sc/broadcast/`.

## 🎯 Uso

### Modo Desarrollo

```bash
npm run dev
```

La aplicación:
- Sincronizará automáticamente las direcciones de contratos desde los logs de despliegue
- Iniciará el servidor de desarrollo de Next.js
- Se abrirá en `http://localhost:3000`

### Build de Producción

```bash
npm run build
npm start
```

### Sincronización Manual de Contratos

```bash
npm run sync-contracts          # Sincronización normal
npm run sync-contracts:force    # Actualización forzada
npm run sync-contracts:verbose  # Salida detallada
```

## 📁 Estructura del Proyecto

```
web/
├── app/
│   ├── api/                    # Rutas API
│   │   ├── relay/              # Relay de meta-transacciones
│   │   ├── nonce/              # Gestión de nonces
│   │   ├── daemon/             # Daemon de ejecución de propuestas
│   │   ├── eip712-domain/      # Información del dominio EIP-712
│   │   └── sync-contracts/     # API de sincronización de contratos
│   ├── page.tsx                # Página principal
│   ├── layout.tsx               # Layout raíz
│   └── globals.css              # Estilos globales
├── components/
│   ├── ConnectWallet.tsx       # Conexión de wallet
│   ├── FundingPanel.tsx        # Interfaz de financiación del DAO
│   ├── CreateProposal.tsx      # Creación de propuestas
│   ├── ProposalList.tsx        # Listado de propuestas
│   ├── ProposalCard.tsx        # Tarjeta individual de propuesta
│   ├── VoteButtons.tsx         # Botones de votación
│   ├── VotingSummary.tsx       # Resumen de votaciones
│   ├── DaemonTrigger.tsx       # Activador del daemon
│   └── AppHelpModal.tsx        # Modal de ayuda de la aplicación
├── hooks/
│   ├── useDAO.ts               # Hooks de interacción con DAO
│   └── useGaslessVote.ts       # Hook de votación sin gas
├── lib/
│   ├── config/
│   │   ├── chain.ts            # Configuración de chain de Wagmi
│   │   └── contracts.ts        # ABIs y direcciones de contratos
│   ├── providers.tsx           # Providers de Wagmi y React Query
│   └── utils/
│       ├── eip712.ts           # Utilidades EIP-712
│       └── index.ts            # Utilidades generales
├── scripts/
│   └── sync-contracts.js       # Auto-sincronización de direcciones
└── package.json
```

## 🧩 Componentes

### ConnectWallet

Componente de conexión de wallet con funcionalidad de desconexión:

```tsx
import { ConnectWallet } from "@/components/ConnectWallet";

<ConnectWallet />;
```

### FundingPanel

Permite a los usuarios depositar ETH en el DAO:

```tsx
import { FundingPanel } from "@/components/FundingPanel";

<FundingPanel />;
```

**Características**:
- Mostrar balance del usuario en el DAO
- Mostrar balance total del DAO
- Depositar ETH para aumentar el poder de voto
- Modal de ayuda con instrucciones detalladas

### CreateProposal

Crear nuevas propuestas:

```tsx
import { CreateProposal } from "@/components/CreateProposal";

<CreateProposal onProposalCreated={handleProposalCreated} />;
```

**Requisitos**:
- El usuario debe tener al menos 10% del balance total del DAO
- Dirección de beneficiario válida
- Monto en ETH
- Timestamp de fecha límite

### ProposalList

Mostrar todas las propuestas con resumen de votación:

```tsx
import { ProposalList } from "@/components/ProposalList";

<ProposalList refreshTrigger={refreshTrigger} />;
```

**Características**:
- Actualizaciones de propuestas en tiempo real
- Resumen de votación con estadísticas
- Tarjetas de propuestas expandibles
- Votación directa desde el resumen
- Activador de ejecución del daemon
- Sistema de ayuda completo

### VoteButtons

Interfaz de votación para propuestas:

```tsx
import { VoteButtons } from "@/components/VoteButtons";

<VoteButtons
  proposalId={proposalId}
  isActive={isActive}
  onVoteSuccess={handleVoteSuccess}
/>;
```

**Tipos de Voto**:
- `FOR` (1): Votar a favor
- `AGAINST` (0): Votar en contra
- `ABSTAIN` (2): Abstenerse de votar

## 🎣 Hooks

### useDAO

Hook principal para interacciones con el DAO:

```typescript
import {
  useUserBalance,
  useTotalBalance,
  useFundDAO,
  useCreateProposal,
  useProposal,
} from "@/hooks/useDAO";

// Obtener balance del usuario
const { balance, balanceWei, isLoading, error } = useUserBalance();

// Obtener balance total del DAO
const { totalBalance, isLoading, error } = useTotalBalance();

// Financiar el DAO
const { fundDAO, isPending, isSuccess, error } = useFundDAO();
fundDAO("1.0"); // Depositar 1 ETH

// Crear una propuesta
const { createProposal, isPending } = useCreateProposal();
createProposal(recipient, amount, deadline);

// Obtener datos de propuesta
const { proposal, isLoading, error } = useProposal(proposalId);
```

### useGaslessVote

Votar sin pagar gas:

```typescript
import { useGaslessVote } from "@/hooks/useGaslessVote";
import { VoteType } from "@/lib/config/contracts";

const { vote, isPending, error, txHash } = useGaslessVote();
vote(proposalId, VoteType.FOR);
```

## 🔌 Rutas API

### POST /api/relay

Relay de meta-transacciones para votación sin gas:

```typescript
const response = await fetch("/api/relay", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    request: forwardRequest,
    signature: signature,
  }),
});
```

### GET /api/nonce

Obtener nonce actual para una dirección:

```typescript
const response = await fetch(
  `/api/nonce?address=${address}&forwarder=${forwarderAddress}`
);
const { nonce } = await response.json();
```

### GET /api/eip712-domain

Obtener información del dominio EIP-712:

```typescript
const response = await fetch(
  `/api/eip712-domain?forwarder=${forwarderAddress}`
);
const { domain } = await response.json();
```

### POST /api/daemon

Activar ejecución automática de propuestas:

```typescript
const response = await fetch("/api/daemon", { method: "POST" });
const { executed, errors } = await response.json();
```

### GET /api/sync-contracts

Activar manualmente la sincronización de direcciones de contratos:

```typescript
const response = await fetch("/api/sync-contracts?force=true");
const { success, output } = await response.json();
```

## 🛠️ Desarrollo

### Scripts Disponibles

```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Build para producción
npm start            # Iniciar servidor de producción
npm run lint         # Ejecutar ESLint
npm run sync-contracts # Sincronizar direcciones de contratos
```

### Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **Biblioteca UI**: React 19
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS 4
- **Web3**: Wagmi v3, viem
- **Gestión de Estado**: React Query (TanStack Query)
- **Meta-Transacciones**: EIP-712, EIP-2771

## 🐛 Solución de Problemas

### Contrato No Desplegado

**Error**: La función del contrato no devuelve datos

**Solución**:
1. Asegúrate de que los contratos estén desplegados: `cd ../sc && forge script script/DeployLocal.s.sol:DeployLocal --rpc-url http://localhost:8545 --broadcast`
2. Ejecuta sincronización: `npm run sync-contracts:force`

### Direcciones No Coinciden

**Problema**: Las direcciones de contratos no coinciden

**Solución**:
```bash
npm run sync-contracts:force
```

### Problemas de Conexión de Wallet

**Problema**: La wallet no se conecta

**Solución**:
1. Asegúrate de la red correcta (Chain ID: 31337)
2. Agrega la red local a tu wallet:
   - Nombre de Red: Local Anvil
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Moneda: ETH

### Fallos de Meta-Transacciones

**Problema**: La votación sin gas falla

**Solución**:
1. Verifica que el relayer tenga ETH
2. Verifica `RELAYER_PRIVATE_KEY` en `.env.local`
3. Revisa los logs de las rutas API

## 📚 Recursos

- [Next.js Documentation](https://nextjs.org/docs)
- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)
- [React Query](https://tanstack.com/query)

</div>

<script>
(function() {
  let currentLang = localStorage.getItem('readme-lang') || 'en';
  
  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('readme-lang', lang);
    
    document.getElementById('content-en').style.display = lang === 'en' ? 'block' : 'none';
    document.getElementById('content-es').style.display = lang === 'es' ? 'block' : 'none';
    
    const btnEn = document.getElementById('btn-en');
    const btnEs = document.getElementById('btn-es');
    
    if (lang === 'en') {
      btnEn.style.backgroundColor = '#0070f3';
      btnEn.style.fontWeight = 'bold';
      btnEs.style.backgroundColor = '#666';
      btnEs.style.fontWeight = 'normal';
    } else {
      btnEs.style.backgroundColor = '#0070f3';
      btnEs.style.fontWeight = 'bold';
      btnEn.style.backgroundColor = '#666';
      btnEn.style.fontWeight = 'normal';
    }
  }
  
  window.setLanguage = setLanguage;
  setLanguage(currentLang);
})();
</script>
