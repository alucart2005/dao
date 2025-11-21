import { useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { Address, encodeFunctionData } from "viem";
import { CONTRACTS, DAO_VOTING_ABI, VoteType } from "@/lib/config/contracts";
import { ForwardRequest } from "@/lib/utils/eip712";

export function useGaslessVote() {
  const { address } = useAccount();
  const { signTypedData, isPending: isSigning } = useSignTypedData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const vote = async (proposalId: bigint, voteType: number) => {
    if (!address) {
      setError(new Error("Wallet not connected"));
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);

      // Get nonce from API
      const nonceResponse = await fetch(
        `/api/nonce?address=${address}&forwarder=${CONTRACTS.MINIMAL_FORWARDER}`
      );
      if (!nonceResponse.ok) {
        throw new Error("Failed to get nonce");
      }
      const { nonce } = await nonceResponse.json();

      // Encode vote function call
      const data = encodeFunctionData({
        abi: DAO_VOTING_ABI,
        functionName: "vote",
        args: [proposalId, voteType],
      });

      // Create forward request
      const forwardRequest: ForwardRequest = {
        from: address,
        to: CONTRACTS.DAO_VOTING,
        value: 0n,
        gas: 500000n,
        nonce: BigInt(nonce),
        data: data as `0x${string}`,
      };

      // Get EIP-712 domain from forwarder
      const domainResponse = await fetch(
        `/api/eip712-domain?forwarder=${CONTRACTS.MINIMAL_FORWARDER}`
      );
      if (!domainResponse.ok) {
        throw new Error("Failed to get EIP-712 domain");
      }
      const domain = await domainResponse.json();

      // Sign typed data
      const signature = await signTypedData({
        domain: {
          name: domain.name,
          version: domain.version,
          chainId: Number(domain.chainId),
          verifyingContract: domain.verifyingContract as Address,
        },
        types: {
          ForwardRequest: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "gas", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "data", type: "bytes" },
          ],
        },
        primaryType: "ForwardRequest",
        message: forwardRequest,
      });

      // Submit to relay API
      const relayResponse = await fetch("/api/relay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request: forwardRequest,
          signature,
        }),
      });

      if (!relayResponse.ok) {
        const errorData = await relayResponse.json();
        throw new Error(errorData.error || "Relay failed");
      }

      const { txHash: hash } = await relayResponse.json();
      setTxHash(hash);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    vote,
    isPending: isSigning || isSubmitting,
    error,
    txHash,
  };
}
