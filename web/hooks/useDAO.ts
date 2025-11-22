import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { CONTRACTS, DAO_VOTING_ABI } from "@/lib/config/contracts";
import { useAccount } from "wagmi";

// Helper para detectar si el error es porque el contrato no existe
function isContractNotDeployedError(error: unknown): boolean {
  if (!error) return false;
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    errorMessage.includes("returned no data") ||
    errorMessage.includes("0x") ||
    errorMessage.includes("contract does not have the function") ||
    errorMessage.includes("address is not a contract")
  );
}

// Variable para evitar logs repetidos
let hasLoggedContractError = false;

export function useUserBalance() {
  const { address } = useAccount();
  const {
    data: balance,
    refetch,
    error,
    isLoading,
  } = useReadContract({
    address: CONTRACTS.DAO_VOTING,
    abi: DAO_VOTING_ABI,
    functionName: "getUserBalance",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && CONTRACTS.DAO_VOTING !== "0x0",
      refetchInterval: (query) => {
        // Si hay error de contrato no desplegado, no refetch automáticamente
        if (
          query.state.error &&
          isContractNotDeployedError(query.state.error)
        ) {
          return false;
        }
        return 10000; // Auto-refetch every 10 seconds
      },
      retry: (failureCount, error) => {
        // No retry si el contrato no está desplegado
        if (isContractNotDeployedError(error)) {
          return false;
        }
        return failureCount < 3;
      },
    },
  });

  // Log errors for debugging (solo una vez)
  if (error && !hasLoggedContractError) {
    if (isContractNotDeployedError(error)) {
      console.warn(
        "⚠️ Contrato no desplegado. Por favor, despliega los contratos primero:",
        "\n  cd sc && forge script script/DeployLocal.s.sol:DeployLocal --rpc-url http://localhost:8545 --broadcast"
      );
      hasLoggedContractError = true;
    } else {
      console.error("Error reading user balance:", error);
    }
  }

  return {
    balance:
      balance !== undefined && balance !== null ? formatEther(balance) : "0",
    balanceWei: balance || 0n,
    isLoading,
    error,
    refetch,
  };
}

export function useTotalBalance() {
  const {
    data: totalBalance,
    refetch,
    error,
    isLoading,
  } = useReadContract({
    address: CONTRACTS.DAO_VOTING,
    abi: DAO_VOTING_ABI,
    functionName: "totalBalance",
    query: {
      enabled: CONTRACTS.DAO_VOTING !== "0x0",
      refetchInterval: (query) => {
        // Si hay error de contrato no desplegado, no refetch automáticamente
        if (
          query.state.error &&
          isContractNotDeployedError(query.state.error)
        ) {
          return false;
        }
        return 10000; // Auto-refetch every 10 seconds
      },
      retry: (failureCount, error) => {
        // No retry si el contrato no está desplegado
        if (isContractNotDeployedError(error)) {
          return false;
        }
        return failureCount < 3;
      },
    },
  });

  // Log errors for debugging (solo una vez, ya se logueó en useUserBalance)
  // No repetir el log si ya se logueó el error de contrato no desplegado

  return {
    totalBalance:
      totalBalance !== undefined && totalBalance !== null
        ? formatEther(totalBalance)
        : "0",
    totalBalanceWei: totalBalance || 0n,
    isLoading,
    error,
    refetch,
  };
}

export function useProposal(proposalId: bigint | undefined) {
  const {
    data: proposal,
    refetch,
    error,
    isLoading,
  } = useReadContract({
    address: CONTRACTS.DAO_VOTING,
    abi: DAO_VOTING_ABI,
    functionName: "getProposal",
    args: proposalId !== undefined ? [proposalId] : undefined,
    query: {
      enabled: proposalId !== undefined && CONTRACTS.DAO_VOTING !== "0x0",
      refetchInterval: (query) => {
        // Disable auto-refetch if contract not deployed
        if (
          query.state.error &&
          isContractNotDeployedError(query.state.error)
        ) {
          return false;
        }
        return false; // Don't auto-refetch proposals (only on manual refresh)
      },
      retry: (failureCount, error) => {
        // Don't retry if contract not deployed
        if (isContractNotDeployedError(error)) {
          return false;
        }
        return failureCount < 2; // Only retry once for network issues
      },
    },
  });

  return { proposal, refetch, error, isLoading };
}

export function useUserVote(proposalId: bigint | undefined) {
  const { address } = useAccount();
  const { data: vote } = useReadContract({
    address: CONTRACTS.DAO_VOTING,
    abi: DAO_VOTING_ABI,
    functionName: "getUserVote",
    args:
      proposalId !== undefined && address ? [proposalId, address] : undefined,
    query: {
      enabled: proposalId !== undefined && !!address,
    },
  });

  return vote;
}

export function useFundDAO() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const fundDAO = (amount: string) => {
    writeContract({
      address: CONTRACTS.DAO_VOTING,
      abi: DAO_VOTING_ABI,
      functionName: "fundDAO",
      value: parseEther(amount),
    });
  };

  return {
    fundDAO,
    hash,
    isPending: isPending || isLoading,
    isSuccess,
    error,
  };
}

export function useCreateProposal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createProposal = (
    name: string,
    recipient: `0x${string}`,
    amount: string,
    deadline: bigint
  ) => {
    writeContract({
      address: CONTRACTS.DAO_VOTING,
      abi: DAO_VOTING_ABI,
      functionName: "createProposal",
      args: [name, recipient, parseEther(amount), deadline],
    });
  };

  return {
    createProposal,
    hash,
    isPending: isPending || isLoading,
    isSuccess,
    error,
  };
}

export function useExecuteProposal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const executeProposal = (proposalId: bigint) => {
    writeContract({
      address: CONTRACTS.DAO_VOTING,
      abi: DAO_VOTING_ABI,
      functionName: "executeProposal",
      args: [proposalId],
    });
  };

  return {
    executeProposal,
    hash,
    isPending: isPending || isLoading,
    isSuccess,
    error,
  };
}
