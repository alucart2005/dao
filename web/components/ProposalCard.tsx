"use client";

import { formatEther } from "viem";
import { formatDate, getProposalStatus } from "@/lib/utils";
import { useProposal } from "@/hooks/useDAO";
import { VoteButtons } from "./VoteButtons";

interface ProposalCardProps {
  proposalId: bigint;
  onUpdate?: () => void;
}

// Helper to detect contract not deployed errors
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

export function ProposalCard({ proposalId, onUpdate }: ProposalCardProps) {
  const { proposal, refetch, error, isLoading } = useProposal(proposalId);

  // Don't render if contract not deployed (let ProposalList handle the error)
  if (error && isContractNotDeployedError(error)) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div
        className="p-6 rounded-lg shadow"
        style={{ backgroundColor: "var(--color-alabaster-grey)" }}
      >
        <div style={{ color: "var(--color-carbon-black-600)" }}>
          Cargando propuesta...
        </div>
      </div>
    );
  }

  // Handle errors gracefully
  if (error) {
    console.error("Error loading proposal:", error);
    return (
      <div
        className="p-6 rounded-lg shadow"
        style={{ backgroundColor: "var(--color-alabaster-grey)" }}
      >
        <div
          className="text-sm"
          style={{ color: "var(--color-carbon-black-600)" }}
        >
          Error al cargar propuesta #{proposalId.toString()}
        </div>
      </div>
    );
  }

  // Don't render if proposal doesn't exist or has id 0
  if (!proposal || proposal.id === 0n) {
    return null;
  }

  const status = getProposalStatus(proposal);
  const now = BigInt(Math.floor(Date.now() / 1000));
  const isActive = !proposal.executed && now <= proposal.deadline;

  const handleVoteSuccess = () => {
    refetch();
    if (onUpdate) onUpdate();
  };

  const getStatusColor = () => {
    switch (status) {
      case "Activa":
        return {
          bg: "var(--color-stormy-teal-900)",
          text: "var(--color-stormy-teal-200)",
        };
      case "Aprobada":
        return {
          bg: "var(--color-seaweed-900)",
          text: "var(--color-seaweed-200)",
        };
      case "Rechazada":
        return {
          bg: "var(--color-stormy-teal-900)",
          text: "var(--color-stormy-teal-200)",
        };
      default:
        return {
          bg: "var(--color-carbon-black-900)",
          text: "var(--color-carbon-black-600)",
        };
    }
  };

  const statusColors = getStatusColor();

  return (
    <div
      className="p-6 rounded-lg shadow"
      style={{ backgroundColor: "var(--color-alabaster-grey)" }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3
            className="text-lg font-bold"
            style={{ color: "var(--color-carbon-black)" }}
          >
            {(proposal as any).name || `Propuesta #${proposal.id.toString()}`}
          </h3>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--color-carbon-black-600)" }}
          >
            Propuesta #{proposal.id.toString()}
          </p>
        </div>
        <span
          className="px-3 py-1 rounded text-sm font-semibold"
          style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
        >
          {status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div>
          <span
            className="font-medium"
            style={{ color: "var(--color-carbon-black-700)" }}
          >
            Beneficiario:{" "}
          </span>
          <span style={{ color: "var(--color-carbon-black-600)" }}>
            {proposal.recipient}
          </span>
        </div>
        <div>
          <span
            className="font-medium"
            style={{ color: "var(--color-carbon-black-700)" }}
          >
            Monto:{" "}
          </span>
          <span style={{ color: "var(--color-carbon-black-600)" }}>
            {formatEther(proposal.amount)} ETH
          </span>
        </div>
        <div>
          <span
            className="font-medium"
            style={{ color: "var(--color-carbon-black-700)" }}
          >
            Fecha límite:{" "}
          </span>
          <span style={{ color: "var(--color-carbon-black-600)" }}>
            {formatDate(proposal.deadline)}
          </span>
        </div>
        <div>
          <span
            className="font-medium"
            style={{ color: "var(--color-carbon-black-700)" }}
          >
            Proponente:{" "}
          </span>
          <span style={{ color: "var(--color-carbon-black-600)" }}>
            {proposal.proposer}
          </span>
        </div>
      </div>

      <div
        className="mb-4 p-3 rounded"
        style={{ backgroundColor: "var(--color-alabaster-grey-700)" }}
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div
              className="text-sm"
              style={{ color: "var(--color-carbon-black-600)" }}
            >
              A FAVOR
            </div>
            <div
              className="text-lg font-bold"
              style={{ color: "var(--color-seaweed)" }}
            >
              {formatEther(proposal.votesFor)}
            </div>
          </div>
          <div>
            <div
              className="text-sm"
              style={{ color: "var(--color-carbon-black-600)" }}
            >
              EN CONTRA
            </div>
            <div
              className="text-lg font-bold"
              style={{ color: "var(--color-stormy-teal)" }}
            >
              {formatEther(proposal.votesAgainst)}
            </div>
          </div>
          <div>
            <div
              className="text-sm"
              style={{ color: "var(--color-carbon-black-600)" }}
            >
              ABSTENCIÓN
            </div>
            <div
              className="text-lg font-bold"
              style={{ color: "var(--color-carbon-black-600)" }}
            >
              {formatEther(proposal.votesAbstain)}
            </div>
          </div>
        </div>
      </div>

      {isActive && (
        <VoteButtons
          proposalId={proposalId}
          isActive={isActive}
          onVoteSuccess={handleVoteSuccess}
        />
      )}

      {proposal.executed && proposal.executionTime > 0n && (
        <div
          className="text-sm mt-2"
          style={{ color: "var(--color-carbon-black-600)" }}
        >
          Ejecutada el: {formatDate(proposal.executionTime)}
        </div>
      )}
    </div>
  );
}
