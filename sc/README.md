<div align="center">

# 🔐 Smart Contracts - DAO Voting System

**Solidity smart contracts for decentralized governance using Foundry**

[![Foundry](https://img.shields.io/badge/Foundry-Latest-orange)](https://getfoundry.sh/)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.13-blue)](https://soliditylang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<div id="language-selector" style="margin: 20px 0;">
  <button onclick="setLanguage('en')" id="btn-en" style="padding: 8px 16px; margin: 0 5px; background-color: #0070f3; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">English</button>
  <button onclick="setLanguage('es')" id="btn-es" style="padding: 8px 16px; margin: 0 5px; background-color: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">Español</button>
</div>

</div>

---

<div id="content-en">

## 📋 Overview

This directory contains the smart contracts for the DAO Voting System. The contracts are written in Solidity and use Foundry for development, testing, and deployment.

## 🏗️ Contracts

### DAOVoting.sol

The main DAO contract that implements the voting system:

- **Proposal Management**: Create, vote on, and execute proposals
- **Balance-Weighted Voting**: Voting power is proportional to user's balance in the DAO
- **Fund Management**: Users can deposit ETH to increase their voting power
- **Execution Delay**: 1-day delay after voting deadline before proposals can be executed
- **Meta-Transaction Support**: Inherits from ERC2771Context for gasless voting

**Key Features**:

- Minimum 10% of total DAO balance required to create proposals
- Proposals pass if `votesFor > votesAgainst`
- Automatic execution delay mechanism
- Secure fund transfers

### MinimalForwarder.sol

Meta-transaction forwarder implementing EIP-2771:

- **EIP-712 Signature Verification**: Secure typed data signing
- **Nonce Management**: Prevents replay attacks
- **Gasless Transactions**: Allows users to vote without paying gas
- **Forwarding**: Relays signed transactions to the DAO contract

## 📦 Dependencies

- **OpenZeppelin Contracts**: Secure, audited contract libraries
  - `ERC2771Context`: Meta-transaction support
  - `EIP712`: Typed data signing
  - `ECDSA`: Signature verification

## 🔧 Setup

### Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Install Dependencies

```bash
forge install OpenZeppelin/openzeppelin-contracts
```

### Build Contracts

```bash
forge build
```

### Run Tests

```bash
forge test
forge test -vvv  # Verbose output
```

## 🚀 Deployment

### Local Deployment (Anvil)

1. **Start Anvil**:

```bash
anvil
```

2. **Deploy Contracts**:

```bash
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
forge script script/DeployLocal.s.sol:DeployLocal \
  --rpc-url http://localhost:8545 \
  --broadcast \
  -vvvv
```

### Testnet Deployment (Sepolia)

1. **Configure Environment**:

```bash
export PRIVATE_KEY=your_private_key
export RPC_URL=https://rpc.sepolia.org
```

2. **Deploy**:

```bash
forge script script/DeployTestnet.s.sol:DeployTestnet \
  --rpc-url $RPC_URL \
  --broadcast \
  -vvvv
```

## 📁 Project Structure

```
sc/
├── src/
│   ├── DAOVoting.sol          # Main DAO contract
│   └── MinimalForwarder.sol   # Meta-transaction forwarder
├── script/
│   ├── DeployLocal.s.sol      # Local deployment script
│   └── DeployTestnet.s.sol    # Testnet deployment script
├── test/
│   ├── DAOVoting.t.sol        # DAO contract tests
│   └── MinimalForwarder.t.sol # Forwarder tests
├── lib/
│   ├── forge-std/             # Foundry standard library
│   └── openzeppelin-contracts/ # OpenZeppelin contracts
├── broadcast/                 # Deployment logs
├── out/                       # Compiled artifacts
└── foundry.toml              # Foundry configuration
```

## 🔐 Security

- Contracts use OpenZeppelin's audited libraries
- Reentrancy protection via checks-effects-interactions pattern
- Nonce management prevents replay attacks
- Signature verification using EIP-712 standard
- Access control for proposal execution

## 📝 Contract Functions

### DAOVoting

```solidity
// Fund the DAO
function fundDAO() external payable;

// Create a proposal
function createProposal(
    address recipient,
    uint256 amount,
    uint256 deadline
) external;

// Vote on a proposal
function vote(uint256 proposalId, VoteType voteType) external;

// Execute an approved proposal
function executeProposal(uint256 proposalId) external;

// View functions
function getUserBalance(address user) external view returns (uint256);
function totalBalance() external view returns (uint256);
function getProposal(uint256 proposalId) external view returns (Proposal memory);
```

### MinimalForwarder

```solidity
// Execute a meta-transaction
function execute(
    ForwardRequest calldata req,
    bytes calldata signature
) external payable returns (bool, bytes memory);

// Get nonce for an address
function getNonce(address from) external view returns (uint256);

// Verify a request
function verify(
    ForwardRequest calldata req,
    bytes calldata signature
) external view returns (bool);
```

## 🧪 Testing

### Run All Tests

```bash
forge test
```

### Run Specific Test

```bash
forge test --match-contract DAOVotingTest
```

### Gas Reports

```bash
forge test --gas-report
```

## 📚 Documentation

For detailed deployment instructions, see:
- `script/DEPLOY.md` - Comprehensive deployment guide

## 🔗 Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [EIP-2771](https://eips.ethereum.org/EIPS/eip-2771)
- [EIP-712](https://eips.ethereum.org/EIPS/eip-712)

</div>

<div id="content-es" style="display: none;">

## 📋 Resumen

Este directorio contiene los contratos inteligentes para el Sistema de Votación DAO. Los contratos están escritos en Solidity y usan Foundry para desarrollo, pruebas y despliegue.

## 🏗️ Contratos

### DAOVoting.sol

El contrato principal del DAO que implementa el sistema de votación:

- **Gestión de Propuestas**: Crear, votar y ejecutar propuestas
- **Votación Ponderada por Balance**: El poder de voto es proporcional al balance del usuario en el DAO
- **Gestión de Fondos**: Los usuarios pueden depositar ETH para aumentar su poder de voto
- **Retraso de Ejecución**: Retraso de 1 día después de la fecha límite antes de que las propuestas puedan ejecutarse
- **Soporte de Meta-Transacciones**: Hereda de ERC2771Context para votación sin gas

**Características Principales**:

- Mínimo 10% del balance total del DAO requerido para crear propuestas
- Las propuestas se aprueban si `votesFor > votesAgainst`
- Mecanismo automático de retraso de ejecución
- Transferencias de fondos seguras

### MinimalForwarder.sol

Forwarder de meta-transacciones que implementa EIP-2771:

- **Verificación de Firmas EIP-712**: Firma segura de datos tipados
- **Gestión de Nonces**: Previene ataques de replay
- **Transacciones Sin Gas**: Permite a los usuarios votar sin pagar gas
- **Reenvío**: Relaya transacciones firmadas al contrato DAO

## 📦 Dependencias

- **OpenZeppelin Contracts**: Bibliotecas de contratos seguras y auditadas
  - `ERC2771Context`: Soporte de meta-transacciones
  - `EIP712`: Firma de datos tipados
  - `ECDSA`: Verificación de firmas

## 🔧 Configuración

### Instalar Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Instalar Dependencias

```bash
forge install OpenZeppelin/openzeppelin-contracts
```

### Compilar Contratos

```bash
forge build
```

### Ejecutar Tests

```bash
forge test
forge test -vvv  # Salida detallada
```

## 🚀 Despliegue

### Despliegue Local (Anvil)

1. **Iniciar Anvil**:

```bash
anvil
```

2. **Desplegar Contratos**:

```bash
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
forge script script/DeployLocal.s.sol:DeployLocal \
  --rpc-url http://localhost:8545 \
  --broadcast \
  -vvvv
```

### Despliegue en Testnet (Sepolia)

1. **Configurar Entorno**:

```bash
export PRIVATE_KEY=tu_clave_privada
export RPC_URL=https://rpc.sepolia.org
```

2. **Desplegar**:

```bash
forge script script/DeployTestnet.s.sol:DeployTestnet \
  --rpc-url $RPC_URL \
  --broadcast \
  -vvvv
```

## 📁 Estructura del Proyecto

```
sc/
├── src/
│   ├── DAOVoting.sol          # Contrato principal del DAO
│   └── MinimalForwarder.sol   # Forwarder de meta-transacciones
├── script/
│   ├── DeployLocal.s.sol      # Script de despliegue local
│   └── DeployTestnet.s.sol    # Script de despliegue en testnet
├── test/
│   ├── DAOVoting.t.sol        # Tests del contrato DAO
│   └── MinimalForwarder.t.sol # Tests del forwarder
├── lib/
│   ├── forge-std/             # Biblioteca estándar de Foundry
│   └── openzeppelin-contracts/ # Contratos de OpenZeppelin
├── broadcast/                 # Logs de despliegue
├── out/                       # Artefactos compilados
└── foundry.toml              # Configuración de Foundry
```

## 🔐 Seguridad

- Los contratos usan bibliotecas auditadas de OpenZeppelin
- Protección contra reentrancy mediante patrón checks-effects-interactions
- Gestión de nonces previene ataques de replay
- Verificación de firmas usando estándar EIP-712
- Control de acceso para ejecución de propuestas

## 📝 Funciones de los Contratos

### DAOVoting

```solidity
// Financiar el DAO
function fundDAO() external payable;

// Crear una propuesta
function createProposal(
    address recipient,
    uint256 amount,
    uint256 deadline
) external;

// Votar en una propuesta
function vote(uint256 proposalId, VoteType voteType) external;

// Ejecutar una propuesta aprobada
function executeProposal(uint256 proposalId) external;

// Funciones de lectura
function getUserBalance(address user) external view returns (uint256);
function totalBalance() external view returns (uint256);
function getProposal(uint256 proposalId) external view returns (Proposal memory);
```

### MinimalForwarder

```solidity
// Ejecutar una meta-transacción
function execute(
    ForwardRequest calldata req,
    bytes calldata signature
) external payable returns (bool, bytes memory);

// Obtener nonce para una dirección
function getNonce(address from) external view returns (uint256);

// Verificar una solicitud
function verify(
    ForwardRequest calldata req,
    bytes calldata signature
) external view returns (bool);
```

## 🧪 Testing

### Ejecutar Todos los Tests

```bash
forge test
```

### Ejecutar Test Específico

```bash
forge test --match-contract DAOVotingTest
```

### Reportes de Gas

```bash
forge test --gas-report
```

## 📚 Documentación

Para instrucciones detalladas de despliegue, consulta:
- `script/DEPLOY.md` - Guía completa de despliegue

## 🔗 Recursos

- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [EIP-2771](https://eips.ethereum.org/EIPS/eip-2771)
- [EIP-712](https://eips.ethereum.org/EIPS/eip-712)

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
