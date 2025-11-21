# DAO Voting System

A decentralized autonomous organization (DAO) voting system built with Solidity smart contracts and a Next.js web frontend. Features gasless voting via meta-transactions, proposal management, and automatic contract address synchronization.

## 🚀 Features

- **Decentralized Voting**: Create and vote on proposals with balance-weighted voting power
- **Gasless Transactions**: Vote without paying gas fees using meta-transactions (EIP-712)
- **Proposal Management**: Create proposals, vote (FOR/AGAINST/ABSTAIN), and execute approved proposals
- **Automatic Contract Sync**: Contract addresses automatically synchronized from deployment logs
- **Modern Stack**: Built with Next.js 16, React 19, Wagmi v2, and Foundry

## 📋 Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Smart Contracts](#smart-contracts)
- [Frontend](#frontend)
- [API Routes](#api-routes)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🏗️ Architecture

The project consists of two main components:

1. **Smart Contracts** (`sc/`): Solidity contracts deployed using Foundry

   - `DAOVoting.sol`: Main DAO contract with voting and proposal management
   - `MinimalForwarder.sol`: Meta-transaction forwarder for gasless voting

2. **Web Frontend** (`web/`): Next.js application with Web3 integration
   - React components for UI
   - Wagmi hooks for blockchain interactions
   - API routes for meta-transaction relay and contract synchronization

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher
- **Foundry** (for smart contract development)
- **Git**

### Installing Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Verify installation:

```bash
forge --version
anvil --version
```

## 🔧 Installation

1. **Clone the repository**:

```bash
git clone <repository-url>
cd alucart2005
```

2. **Install frontend dependencies**:

```bash
cd web
npm install
```

3. **Install Foundry dependencies** (if not already installed):

```bash
cd ../sc
forge install
```

## ⚙️ Configuration

### 1. Start Anvil (Local Blockchain)

In a terminal, start the local blockchain:

```bash
cd sc
anvil
```

Anvil will start on `http://127.0.0.1:8545` with 10 pre-funded accounts.

### 2. Deploy Smart Contracts

In a new terminal:

```bash
cd sc
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
forge script script/DeployLocal.s.sol:DeployLocal \
  --rpc-url http://localhost:8545 \
  --broadcast \
  -vvvv
```

**Expected output**:

```
Deploying MinimalForwarder...
MinimalForwarder deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Deploying DAOVoting...
DAOVoting deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

### 3. Configure Environment Variables

Contract addresses are **automatically synchronized** from deployment logs to `web/.env.local` when you run `npm run dev`. However, you can also create the file manually:

```bash
cd web
cat > .env.local << 'EOF'
NEXT_PUBLIC_DAO_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_FORWARDER_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
RELAYER_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
RELAYER_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
EOF
```

> **Note**: The relayer private key and address are from Anvil's default accounts. In production, use secure key management.

## 🎯 Usage

### Development Mode

1. **Start Anvil** (if not already running):

```bash
cd sc
anvil
```

2. **Deploy contracts** (if not already deployed):

```bash
cd sc
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
forge script script/DeployLocal.s.sol:DeployLocal --rpc-url http://localhost:8545 --broadcast
```

3. **Start the development server**:

```bash
cd web
npm run dev
```

The application will automatically:

- Sync contract addresses from deployment logs
- Start the Next.js development server
- Open at `http://localhost:3000`

### Production Build

```bash
cd web
npm run build
npm start
```

### Manual Contract Synchronization

If you need to manually sync contract addresses:

```bash
cd web
npm run sync-contracts          # Normal sync
npm run sync-contracts:force    # Force update
npm run sync-contracts:verbose  # Verbose output
```

## 📁 Project Structure

```
alucart2005/
├── sc/                          # Smart contracts (Foundry)
│   ├── src/
│   │   ├── DAOVoting.sol       # Main DAO contract
│   │   └── MinimalForwarder.sol # Meta-transaction forwarder
│   ├── script/
│   │   ├── DeployLocal.s.sol   # Local deployment script
│   │   └── DeployTestnet.s.sol # Testnet deployment script
│   ├── test/                   # Solidity tests
│   ├── broadcast/              # Deployment transaction logs
│   └── foundry.toml            # Foundry configuration
│
├── web/                         # Next.js frontend
│   ├── app/
│   │   ├── api/                # API routes
│   │   │   ├── relay/          # Meta-transaction relay
│   │   │   ├── nonce/          # Nonce management
│   │   │   ├── daemon/         # Proposal execution daemon
│   │   │   └── sync-contracts/ # Contract sync API
│   │   ├── page.tsx            # Home page
│   │   └── layout.tsx          # Root layout
│   ├── components/             # React components
│   │   ├── FundingPanel.tsx   # DAO funding interface
│   │   ├── CreateProposal.tsx  # Proposal creation
│   │   ├── ProposalList.tsx    # Proposal listing
│   │   └── VoteButtons.tsx     # Voting interface
│   ├── hooks/                  # Custom React hooks
│   │   ├── useDAO.ts           # DAO interaction hooks
│   │   └── useGaslessVote.ts   # Gasless voting hook
│   ├── lib/
│   │   ├── config/
│   │   │   ├── chain.ts        # Wagmi chain configuration
│   │   │   └── contracts.ts    # Contract ABIs and addresses
│   │   └── utils/
│   │       └── eip712.ts       # EIP-712 utilities
│   ├── scripts/
│   │   └── sync-contracts.js   # Auto-sync contract addresses
│   └── package.json
│
└── README.md
```

## 🔐 Smart Contracts

### DAOVoting Contract

The main DAO contract that handles:

- Proposal creation and management
- Balance-weighted voting
- Proposal execution
- Fund management

**Key Functions**:

```solidity
// Fund the DAO
function fundDAO() external payable;

// Create a proposal (requires 10% of total balance)
function createProposal(address recipient, uint256 amount, uint256 deadline) external;

// Vote on a proposal
function vote(uint256 proposalId, VoteType voteType) external;

// Execute an approved proposal
function executeProposal(uint256 proposalId) external;

// View functions
function getUserBalance(address user) external view returns (uint256);
function totalBalance() external view returns (uint256);
function getProposal(uint256 proposalId) external view returns (Proposal memory);
```

**Proposal Requirements**:

- Minimum 10% of total DAO balance to create proposals
- 1-day execution delay after voting deadline
- Proposals pass if `votesFor > votesAgainst`

### MinimalForwarder Contract

Handles meta-transactions (ERC-2771) for gasless voting:

- Verifies EIP-712 signatures
- Forwards calls to DAOVoting contract
- Manages nonces to prevent replay attacks

## 💻 Frontend

### Components

#### FundingPanel

Allows users to deposit ETH into the DAO:

```tsx
import { FundingPanel } from "@/components/FundingPanel";

<FundingPanel />;
```

Features:

- Display user balance in DAO
- Display total DAO balance
- Deposit ETH to increase voting power

#### CreateProposal

Create new proposals:

```tsx
import { CreateProposal } from "@/components/CreateProposal";

<CreateProposal onProposalCreated={handleProposalCreated} />;
```

#### ProposalList

Display all proposals:

```tsx
import { ProposalList } from "@/components/ProposalList";

<ProposalList refreshTrigger={refreshTrigger} />;
```

### Hooks

#### useDAO

Main hook for DAO interactions:

```typescript
import { useUserBalance, useTotalBalance, useFundDAO } from "@/hooks/useDAO";

// Get user balance
const { balance, balanceWei, isLoading, error } = useUserBalance();

// Get total DAO balance
const { totalBalance, isLoading, error } = useTotalBalance();

// Fund the DAO
const { fundDAO, isPending, isSuccess, error } = useFundDAO();
fundDAO("1.0"); // Deposit 1 ETH
```

#### useGaslessVote

Vote without paying gas:

```typescript
import { useGaslessVote } from "@/hooks/useGaslessVote";

const { voteGasless, isPending, error } = useGaslessVote();
voteGasless(proposalId, VoteType.FOR);
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

### GET /api/sync-contracts

Manually trigger contract address synchronization:

```typescript
const response = await fetch("/api/sync-contracts?force=true");
const { success, output } = await response.json();
```

### POST /api/daemon

Trigger automatic proposal execution:

```typescript
const response = await fetch("/api/daemon", { method: "POST" });
const { executed } = await response.json();
```

## 📝 Examples

### Example 1: Fund the DAO

```typescript
import { useFundDAO } from "@/hooks/useDAO";

function FundButton() {
  const { fundDAO, isPending, isSuccess, error } = useFundDAO();

  const handleFund = () => {
    fundDAO("1.0"); // Deposit 1 ETH
  };

  return (
    <button onClick={handleFund} disabled={isPending}>
      {isPending ? "Depositing..." : "Fund DAO"}
    </button>
  );
}
```

### Example 2: Create a Proposal

```typescript
import { useCreateProposal } from "@/hooks/useDAO";

function CreateProposalForm() {
  const { createProposal, isPending } = useCreateProposal();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleSubmit = () => {
    const deadlineTimestamp = BigInt(
      Math.floor(new Date(deadline).getTime() / 1000)
    );
    createProposal(recipient, amount, deadlineTimestamp);
  };

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
}
```

### Example 3: Vote on a Proposal

```typescript
import { useGaslessVote } from "@/hooks/useGaslessVote";
import { VoteType } from "@/lib/config/contracts";

function VoteButtons({ proposalId }: { proposalId: bigint }) {
  const { voteGasless, isPending } = useGaslessVote();

  return (
    <div>
      <button onClick={() => voteGasless(proposalId, VoteType.FOR)}>
        Vote FOR
      </button>
      <button onClick={() => voteGasless(proposalId, VoteType.AGAINST)}>
        Vote AGAINST
      </button>
      <button onClick={() => voteGasless(proposalId, VoteType.ABSTAIN)}>
        ABSTAIN
      </button>
    </div>
  );
}
```

### Example 4: Read Contract Data

```typescript
import { useReadContract } from "wagmi";
import { CONTRACTS, DAO_VOTING_ABI } from "@/lib/config/contracts";

function ProposalDetails({ proposalId }: { proposalId: bigint }) {
  const {
    data: proposal,
    isLoading,
    error,
  } = useReadContract({
    address: CONTRACTS.DAO_VOTING,
    abi: DAO_VOTING_ABI,
    functionName: "getProposal",
    args: [proposalId],
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Proposal #{proposal.id.toString()}</h3>
      <p>Amount: {formatEther(proposal.amount)} ETH</p>
      <p>Votes For: {proposal.votesFor.toString()}</p>
      <p>Votes Against: {proposal.votesAgainst.toString()}</p>
    </div>
  );
}
```

## 🐛 Troubleshooting

### Contract Not Deployed Error

**Error**: `The contract function "getUserBalance" returned no data ("0x")`

**Solution**:

1. Ensure Anvil is running: `cd sc && anvil`
2. Deploy contracts: `forge script script/DeployLocal.s.sol:DeployLocal --rpc-url http://localhost:8545 --broadcast`
3. Contract addresses will auto-sync, or run: `npm run sync-contracts`

### Address Mismatch

**Problem**: Contract addresses in `.env.local` don't match deployed contracts

**Solution**:

```bash
cd web
npm run sync-contracts:force
```

### Anvil Restarted

**Problem**: Anvil was restarted and contracts are lost

**Solution**: Redeploy contracts (addresses will be different):

```bash
cd sc
forge script script/DeployLocal.s.sol:DeployLocal --rpc-url http://localhost:8545 --broadcast
```

### Wallet Connection Issues

**Problem**: Wallet won't connect or shows wrong network

**Solution**:

1. Ensure you're connected to the correct network (Chain ID: 31337)
2. Add the local network to your wallet:
   - Network Name: Local Anvil
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

### Meta-Transaction Failures

**Problem**: Gasless voting fails

**Solution**:

1. Check relayer has ETH: `cast balance $RELAYER_ADDRESS --rpc-url http://localhost:8545`
2. Verify relayer configuration in `.env.local`
3. Check API route logs for errors

## 🧪 Testing

### Smart Contract Tests

```bash
cd sc
forge test
```

### Frontend Tests

```bash
cd web
npm test
```

## 📚 Additional Resources

- [Foundry Book](https://book.getfoundry.sh/) - Foundry documentation
- [Wagmi Documentation](https://wagmi.sh/) - Wagmi v2 docs
- [Next.js Documentation](https://nextjs.org/docs) - Next.js 16 docs
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts) - Security patterns

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for secure contract patterns
- [Foundry](https://getfoundry.sh/) for the development framework
- [Wagmi](https://wagmi.sh/) for Web3 React hooks
- [Next.js](https://nextjs.org/) for the React framework

---

**Built with ❤️ for decentralized governance**
