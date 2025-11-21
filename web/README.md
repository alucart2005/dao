# DAO Voting System - Frontend

Aplicación web Next.js 15 para interactuar con el sistema de votación DAO.

## Características

- ✅ Conexión con MetaMask
- ✅ Panel de financiación del DAO
- ✅ Creación de propuestas (requiere ≥10% del balance total)
- ✅ Listado de propuestas con estado en tiempo real
- ✅ Sistema de votación gasless (sin pagar gas)
- ✅ Daemon de ejecución automática

## Configuración

1. Instalar dependencias:

```bash
npm install
```

2. Crear archivo `.env.local`:

```env
NEXT_PUBLIC_DAO_ADDRESS=0x...
NEXT_PUBLIC_FORWARDER_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
RELAYER_PRIVATE_KEY=0x...
RELAYER_ADDRESS=0x...
```

3. Ejecutar el servidor de desarrollo:

```bash
npm run dev
```

## Estructura del Proyecto

- `app/` - Rutas y páginas de Next.js
  - `api/` - API routes (relay, nonce, daemon)
- `components/` - Componentes React
  - `ConnectWallet.tsx` - Conexión de wallet
  - `FundingPanel.tsx` - Panel de financiación
  - `CreateProposal.tsx` - Creación de propuestas
  - `ProposalList.tsx` - Listado de propuestas
  - `ProposalCard.tsx` - Tarjeta individual de propuesta
  - `VoteButtons.tsx` - Botones de votación
- `hooks/` - Hooks personalizados
  - `useDAO.ts` - Interacciones con el contrato DAO
  - `useGaslessVote.ts` - Votación gasless
- `lib/` - Utilidades y configuración
  - `config/` - Configuración de contratos y chain
  - `providers.tsx` - Providers de Wagmi y React Query
  - `utils/` - Utilidades

## API Routes

### `/api/nonce`

Obtiene el nonce actual de un usuario para meta-transacciones.

### `/api/eip712-domain`

Obtiene el dominio EIP-712 del MinimalForwarder.

### `/api/relay`

Relaya meta-transacciones firmadas. El relayer paga el gas.

### `/api/daemon`

Verifica y ejecuta propuestas aprobadas automáticamente.

## Daemon de Ejecución

El daemon puede ejecutarse de dos formas:

1. **Manual**: Usando el botón en la UI
2. **Automático**: Configurar un cron job o servicio que llame a `/api/daemon` periódicamente

Ejemplo con cron (cada 5 minutos):

```bash
*/5 * * * * curl http://localhost:3000/api/daemon
```

## Tecnologías

- Next.js 16
- React 19
- Wagmi v2
- Viem
- TypeScript
- Tailwind CSS
