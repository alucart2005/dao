"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { formatEther } from "viem";
import { useProposal } from "@/hooks/useDAO";
import { getProposalStatus } from "@/lib/utils";

interface VotingSummaryProps {
  proposalIds: bigint[];
}

interface ProposalData {
  votesFor: bigint;
  votesAgainst: bigint;
  votesAbstain: bigint;
  executed: boolean;
  deadline: bigint;
  status: string;
}

function ProposalDataLoader({
  proposalId,
  onLoad,
}: {
  proposalId: bigint;
  onLoad: (proposalId: bigint, data: ProposalData | null) => void;
}) {
  const { proposal, isLoading, error } = useProposal(proposalId);

  useEffect(() => {
    if (isLoading) {
      return; // Wait for loading to complete
    }

    if (error) {
      onLoad(proposalId, null);
      return;
    }

    if (!proposal || proposal.id === 0n) {
      onLoad(proposalId, null);
      return;
    }

    const status = getProposalStatus(proposal);
    onLoad(proposalId, {
      votesFor: proposal.votesFor,
      votesAgainst: proposal.votesAgainst,
      votesAbstain: proposal.votesAbstain,
      executed: proposal.executed,
      deadline: proposal.deadline,
      status,
    });
  }, [proposal, isLoading, error, proposalId, onLoad]);

  return null;
}

export function VotingSummary({ proposalIds }: VotingSummaryProps) {
  const [proposalsData, setProposalsData] = useState<Map<bigint, ProposalData>>(
    new Map()
  );

  const handleProposalLoad = useCallback(
    (proposalId: bigint, data: ProposalData | null) => {
      if (data) {
        setProposalsData((prev) => {
          const next = new Map(prev);
          next.set(proposalId, data);
          return next;
        });
      } else {
        // Remove if data is null (error or doesn't exist)
        setProposalsData((prev) => {
          const next = new Map(prev);
          next.delete(proposalId);
          return next;
        });
      }
    },
    []
  );

  // Calculate aggregated statistics
  const stats = useMemo(() => {
    const dataArray = Array.from(proposalsData.values());

    if (dataArray.length === 0) {
      return {
        totalVotesFor: 0n,
        totalVotesAgainst: 0n,
        totalVotesAbstain: 0n,
        totalVotes: 0n,
        activeProposals: 0,
        executedProposals: 0,
        approvedProposals: 0,
        rejectedProposals: 0,
        forPercentage: 0,
        againstPercentage: 0,
        abstainPercentage: 0,
      };
    }

    const totalVotesFor = dataArray.reduce((sum, p) => sum + p.votesFor, 0n);
    const totalVotesAgainst = dataArray.reduce(
      (sum, p) => sum + p.votesAgainst,
      0n
    );
    const totalVotesAbstain = dataArray.reduce(
      (sum, p) => sum + p.votesAbstain,
      0n
    );
    const totalVotes = totalVotesFor + totalVotesAgainst + totalVotesAbstain;

    const now = BigInt(Math.floor(Date.now() / 1000));
    const activeProposals = dataArray.filter(
      (p) => !p.executed && now <= p.deadline
    ).length;
    const executedProposals = dataArray.filter((p) => p.executed).length;
    const approvedProposals = dataArray.filter(
      (p) => p.status === "Aprobada"
    ).length;
    const rejectedProposals = dataArray.filter(
      (p) => p.status === "Rechazada"
    ).length;

    // Calculate percentages
    const forPercentage =
      totalVotes > 0n ? Number((totalVotesFor * 10000n) / totalVotes) / 100 : 0;
    const againstPercentage =
      totalVotes > 0n
        ? Number((totalVotesAgainst * 10000n) / totalVotes) / 100
        : 0;
    const abstainPercentage =
      totalVotes > 0n
        ? Number((totalVotesAbstain * 10000n) / totalVotes) / 100
        : 0;

    return {
      totalVotesFor,
      totalVotesAgainst,
      totalVotesAbstain,
      totalVotes,
      activeProposals,
      executedProposals,
      approvedProposals,
      rejectedProposals,
      forPercentage,
      againstPercentage,
      abstainPercentage,
    };
  }, [proposalsData]);

  if (proposalIds.length === 0) {
    return null;
  }

  return (
    <>
      {/* Load proposal data */}
      {proposalIds.map((id) => (
        <ProposalDataLoader
          key={id.toString()}
          proposalId={id}
          onLoad={handleProposalLoad}
        />
      ))}

      {/* Summary Display */}
      <div
        className="p-6 rounded-lg shadow"
        style={{ backgroundColor: "var(--color-alabaster-grey)" }}
      >
        <h3
          className="text-xl font-bold mb-4"
          style={{ color: "var(--color-carbon-black)" }}
        >
          📊 Resumen de Votaciones
        </h3>

        {/* Vote Totals */}
        <div className="mb-6">
          <h4
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--color-carbon-black-700)" }}
          >
            Total de Votos
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div
              className="p-4 rounded"
              style={{ backgroundColor: "var(--color-seaweed-900)" }}
            >
              <div
                className="text-xs mb-1"
                style={{ color: "var(--color-seaweed-200)" }}
              >
                A FAVOR
              </div>
              <div
                className="text-2xl font-bold"
                style={{ color: "var(--color-seaweed-200)" }}
              >
                {formatEther(stats.totalVotesFor)}
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: "var(--color-seaweed-300)" }}
              >
                {stats.forPercentage.toFixed(1)}%
              </div>
            </div>
            <div
              className="p-4 rounded"
              style={{ backgroundColor: "var(--color-stormy-teal-900)" }}
            >
              <div
                className="text-xs mb-1"
                style={{ color: "var(--color-stormy-teal-200)" }}
              >
                EN CONTRA
              </div>
              <div
                className="text-2xl font-bold"
                style={{ color: "var(--color-stormy-teal-200)" }}
              >
                {formatEther(stats.totalVotesAgainst)}
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: "var(--color-stormy-teal-300)" }}
              >
                {stats.againstPercentage.toFixed(1)}%
              </div>
            </div>
            <div
              className="p-4 rounded"
              style={{ backgroundColor: "var(--color-carbon-black-900)" }}
            >
              <div
                className="text-xs mb-1"
                style={{ color: "var(--color-carbon-black-600)" }}
              >
                ABSTENCIÓN
              </div>
              <div
                className="text-2xl font-bold"
                style={{ color: "var(--color-carbon-black-600)" }}
              >
                {formatEther(stats.totalVotesAbstain)}
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: "var(--color-carbon-black-500)" }}
              >
                {stats.abstainPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Proposal Status Summary */}
        <div>
          <h4
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--color-carbon-black-700)" }}
          >
            Estado de Propuestas
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div
              className="p-3 rounded text-center"
              style={{ backgroundColor: "var(--color-stormy-teal-900)" }}
            >
              <div
                className="text-lg font-bold"
                style={{ color: "var(--color-stormy-teal-200)" }}
              >
                {stats.activeProposals}
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: "var(--color-stormy-teal-300)" }}
              >
                Activas
              </div>
            </div>
            <div
              className="p-3 rounded text-center"
              style={{ backgroundColor: "var(--color-seaweed-900)" }}
            >
              <div
                className="text-lg font-bold"
                style={{ color: "var(--color-seaweed-200)" }}
              >
                {stats.approvedProposals}
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: "var(--color-seaweed-300)" }}
              >
                Aprobadas
              </div>
            </div>
            <div
              className="p-3 rounded text-center"
              style={{ backgroundColor: "var(--color-stormy-teal-900)" }}
            >
              <div
                className="text-lg font-bold"
                style={{ color: "var(--color-stormy-teal-200)" }}
              >
                {stats.rejectedProposals}
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: "var(--color-stormy-teal-300)" }}
              >
                Rechazadas
              </div>
            </div>
            <div
              className="p-3 rounded text-center"
              style={{ backgroundColor: "var(--color-carbon-black-900)" }}
            >
              <div
                className="text-lg font-bold"
                style={{ color: "var(--color-carbon-black-600)" }}
              >
                {stats.executedProposals}
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: "var(--color-carbon-black-500)" }}
              >
                Ejecutadas
              </div>
            </div>
          </div>
        </div>

        {/* Total Votes Bar */}
        {stats.totalVotes > 0n && (
          <div className="mt-6">
            <div
              className="text-xs mb-2"
              style={{ color: "var(--color-carbon-black-600)" }}
            >
              Distribución de Votos
            </div>
            <div className="h-4 rounded-full overflow-hidden flex">
              {stats.forPercentage > 0 && (
                <div
                  style={{
                    width: `${stats.forPercentage}%`,
                    backgroundColor: "var(--color-seaweed)",
                  }}
                  title={`A Favor: ${stats.forPercentage.toFixed(1)}%`}
                />
              )}
              {stats.againstPercentage > 0 && (
                <div
                  style={{
                    width: `${stats.againstPercentage}%`,
                    backgroundColor: "var(--color-stormy-teal)",
                  }}
                  title={`En Contra: ${stats.againstPercentage.toFixed(1)}%`}
                />
              )}
              {stats.abstainPercentage > 0 && (
                <div
                  style={{
                    width: `${stats.abstainPercentage}%`,
                    backgroundColor: "var(--color-carbon-black-600)",
                  }}
                  title={`Abstención: ${stats.abstainPercentage.toFixed(1)}%`}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
