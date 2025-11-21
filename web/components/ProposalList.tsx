"use client";

import { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { CONTRACTS, DAO_VOTING_ABI } from "@/lib/config/contracts";
import { ProposalCard } from "./ProposalCard";
import { createPublicClient, http } from "viem";
import { localChain } from "@/lib/config/chain";

export function ProposalList() {
  const [proposalIds, setProposalIds] = useState<bigint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const findProposals = async () => {
      setLoading(true);
      const found: bigint[] = [];
      const publicClient = createPublicClient({
        chain: localChain,
        transport: http(
          process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"
        ),
      });

      // Check up to 100 proposals
      for (let i = 1; i <= 100; i++) {
        try {
          const proposal = await publicClient.readContract({
            address: CONTRACTS.DAO_VOTING,
            abi: DAO_VOTING_ABI,
            functionName: "getProposal",
            args: [BigInt(i)],
          });
          // If proposal exists (id is not 0), add it
          if (proposal && proposal.id !== 0n) {
            found.push(BigInt(i));
          } else {
            // If we get a proposal with id 0, it means no more proposals exist
            break;
          }
        } catch (error) {
          // If contract call fails, likely no more proposals
          // Continue checking a few more in case of network issues
          if (i > 10) {
            break;
          }
        }
      }
      setProposalIds(found);
      setLoading(false);
    };

    findProposals();
  }, []);

  return (
    <div className="space-y-4">
      <h2
        className="text-2xl font-bold"
        style={{ color: "var(--color-carbon-black)" }}
      >
        Listado de Propuestas
      </h2>
      {loading ? (
        <div style={{ color: "var(--color-carbon-black-600)" }}>
          Cargando propuestas...
        </div>
      ) : proposalIds.length === 0 ? (
        <div style={{ color: "var(--color-carbon-black-600)" }}>
          No hay propuestas disponibles
        </div>
      ) : (
        <div className="space-y-4">
          {proposalIds
            .slice()
            .reverse()
            .map((id) => (
              <ProposalCard key={id.toString()} proposalId={id} />
            ))}
        </div>
      )}
    </div>
  );
}
