import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { CONTRACTS, DAO_VOTING_ABI } from "@/lib/config/contracts";
import { useAccount } from "wagmi";

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
      refetchInterval: 10000, // Auto-refetch every 10 seconds
    },
  });

  // Log errors for debugging
  if (error) {
    console.error("Error reading user balance:", error);
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
      refetchInterval: 10000, // Auto-refetch every 10 seconds
    },
  });

  // Log errors for debugging
  if (error) {
    console.error("Error reading total balance:", error);
  }

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
  const { data: proposal, refetch } = useReadContract({
    address: CONTRACTS.DAO_VOTING,
    abi: DAO_VOTING_ABI,
    functionName: "getProposal",
    args: proposalId !== undefined ? [proposalId] : undefined,
    query: {
      enabled: proposalId !== undefined,
    },
  });

  return { proposal, refetch };
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
    recipient: `0x${string}`,
    amount: string,
    deadline: bigint
  ) => {
    writeContract({
      address: CONTRACTS.DAO_VOTING,
      abi: DAO_VOTING_ABI,
      functionName: "createProposal",
      args: [recipient, parseEther(amount), deadline],
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
