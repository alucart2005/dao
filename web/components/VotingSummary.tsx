"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { formatEther } from "viem";
import { useProposal, useUserVote } from "@/hooks/useDAO";
import { getProposalStatus } from "@/lib/utils";
import { useAccount } from "wagmi";
import { useGaslessVote } from "@/hooks/useGaslessVote";
import { VoteType } from "@/lib/config/contracts";

interface VotingSummaryProps {
  proposalIds: bigint[];
  isLoading?: boolean;
  onToggleProposalCards?: () => void;
  showProposalCards?: boolean;
}

interface ProposalData {
  id: bigint;
  name?: string;
  votesFor: bigint;
  votesAgainst: bigint;
  votesAbstain: bigint;
  executed: boolean;
  deadline: bigint;
  status: string;
  totalVotes: bigint;
  forPercentage: number;
  againstPercentage: number;
  abstainPercentage: number;
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
    const totalVotes =
      proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
    const forPercentage =
      totalVotes > 0n
        ? Number((proposal.votesFor * 10000n) / totalVotes) / 100
        : 0;
    const againstPercentage =
      totalVotes > 0n
        ? Number((proposal.votesAgainst * 10000n) / totalVotes) / 100
        : 0;
    const abstainPercentage =
      totalVotes > 0n
        ? Number((proposal.votesAbstain * 10000n) / totalVotes) / 100
        : 0;

    onLoad(proposalId, {
      id: proposal.id,
      name: (proposal as any).name,
      votesFor: proposal.votesFor,
      votesAgainst: proposal.votesAgainst,
      votesAbstain: proposal.votesAbstain,
      executed: proposal.executed,
      deadline: proposal.deadline,
      status,
      totalVotes,
      forPercentage,
      againstPercentage,
      abstainPercentage,
    });
  }, [proposal, isLoading, error, proposalId, onLoad]);

  return null;
}

function ProposalVoteCard({
  proposalId,
  proposalData,
  statusColors,
  isActive,
}: {
  proposalId: bigint;
  proposalData: ProposalData;
  statusColors: { bg: string; text: string };
  isActive: boolean;
}) {
  const { isConnected } = useAccount();
  const { vote, isPending, error, txHash } = useGaslessVote();
  const userVote = useUserVote(proposalId);

  const handleVote = async (voteType: number) => {
    await vote(proposalId, voteType);
    // Refresh will be handled by the parent component's data loading
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  return (
    <div
      className="mt-2 p-2.5 rounded border"
      style={{
        backgroundColor: "var(--color-alabaster-grey-700)",
        borderColor: "var(--color-carbon-black-300)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--color-carbon-black-700)" }}
            >
              #{proposalData.id.toString()}
            </span>
            <span
              className="text-sm font-bold truncate"
              style={{ color: "var(--color-carbon-black)" }}
            >
              {proposalData.name || `Propuesta #${proposalData.id.toString()}`}
            </span>
          </div>
        </div>
        <span
          className="px-2 py-0.5 rounded text-[10px] font-semibold flex-shrink-0"
          style={{
            backgroundColor: statusColors.bg,
            color: statusColors.text,
          }}
        >
          {proposalData.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 mb-2">
        {/* A FAVOR Button */}
        <div className="text-center">
          <button
            onClick={() => handleVote(VoteType.FOR)}
            disabled={isPending || !isActive || !isConnected}
            className="w-full px-2 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-medium mb-0.5"
            style={{
              backgroundColor:
                userVote === VoteType.FOR
                  ? "var(--color-seaweed)"
                  : "var(--color-seaweed-900)",
              color:
                userVote === VoteType.FOR
                  ? "white"
                  : "var(--color-seaweed-200)",
            }}
            onMouseEnter={(e) =>
              !e.currentTarget.disabled &&
              userVote !== VoteType.FOR &&
              (e.currentTarget.style.backgroundColor =
                "var(--color-seaweed-800)")
            }
            onMouseLeave={(e) =>
              !e.currentTarget.disabled &&
              userVote !== VoteType.FOR &&
              (e.currentTarget.style.backgroundColor =
                "var(--color-seaweed-900)")
            }
          >
            A FAVOR
          </button>
          <div
            className="text-xs font-bold"
            style={{ color: "var(--color-seaweed)" }}
          >
            {formatEther(proposalData.votesFor)}
          </div>
          {proposalData.totalVotes > 0n && (
            <div
              className="text-[9px] mt-0.5"
              style={{ color: "var(--color-carbon-black-500)" }}
            >
              {proposalData.forPercentage.toFixed(1)}%
            </div>
          )}
        </div>

        {/* EN CONTRA Button */}
        <div className="text-center">
          <button
            onClick={() => handleVote(VoteType.AGAINST)}
            disabled={isPending || !isActive || !isConnected}
            className="w-full px-2 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-medium mb-0.5"
            style={{
              backgroundColor:
                userVote === VoteType.AGAINST
                  ? "var(--color-stormy-teal)"
                  : "var(--color-stormy-teal-900)",
              color:
                userVote === VoteType.AGAINST
                  ? "white"
                  : "var(--color-stormy-teal-200)",
            }}
            onMouseEnter={(e) =>
              !e.currentTarget.disabled &&
              userVote !== VoteType.AGAINST &&
              (e.currentTarget.style.backgroundColor =
                "var(--color-stormy-teal-800)")
            }
            onMouseLeave={(e) =>
              !e.currentTarget.disabled &&
              userVote !== VoteType.AGAINST &&
              (e.currentTarget.style.backgroundColor =
                "var(--color-stormy-teal-900)")
            }
          >
            EN CONTRA
          </button>
          <div
            className="text-xs font-bold"
            style={{ color: "var(--color-stormy-teal)" }}
          >
            {formatEther(proposalData.votesAgainst)}
          </div>
          {proposalData.totalVotes > 0n && (
            <div
              className="text-[9px] mt-0.5"
              style={{ color: "var(--color-carbon-black-500)" }}
            >
              {proposalData.againstPercentage.toFixed(1)}%
            </div>
          )}
        </div>

        {/* ABSTENCIÓN Button */}
        <div className="text-center">
          <button
            onClick={() => handleVote(VoteType.ABSTAIN)}
            disabled={isPending || !isActive || !isConnected}
            className="w-full px-2 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-medium mb-0.5"
            style={{
              backgroundColor:
                userVote === VoteType.ABSTAIN
                  ? "var(--color-carbon-black-600)"
                  : "var(--color-carbon-black-900)",
              color:
                userVote === VoteType.ABSTAIN
                  ? "white"
                  : "var(--color-carbon-black-600)",
            }}
            onMouseEnter={(e) =>
              !e.currentTarget.disabled &&
              userVote !== VoteType.ABSTAIN &&
              (e.currentTarget.style.backgroundColor =
                "var(--color-carbon-black-800)")
            }
            onMouseLeave={(e) =>
              !e.currentTarget.disabled &&
              userVote !== VoteType.ABSTAIN &&
              (e.currentTarget.style.backgroundColor =
                "var(--color-carbon-black-900)")
            }
          >
            ABSTENCIÓN
          </button>
          <div
            className="text-xs font-bold"
            style={{ color: "var(--color-carbon-black-600)" }}
          >
            {formatEther(proposalData.votesAbstain)}
          </div>
          {proposalData.totalVotes > 0n && (
            <div
              className="text-[9px] mt-0.5"
              style={{ color: "var(--color-carbon-black-500)" }}
            >
              {proposalData.abstainPercentage.toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      {/* Status messages */}
      {isPending && (
        <div
          className="text-[10px] mb-1"
          style={{ color: "var(--color-stormy-teal)" }}
        >
          Firmando y enviando voto...
        </div>
      )}
      {error && (
        <div
          className="text-[10px] mb-1"
          style={{ color: "var(--color-stormy-teal)" }}
        >
          Error: {error.message}
        </div>
      )}
      {txHash && (
        <div
          className="text-[10px] mb-1"
          style={{ color: "var(--color-seaweed)" }}
        >
          Voto enviado! TX: {txHash.slice(0, 10)}...
        </div>
      )}
      {!isConnected && isActive && (
        <div
          className="text-[10px] mb-1"
          style={{ color: "var(--color-carbon-black-600)" }}
        >
          Conecta tu wallet para votar
        </div>
      )}

      {proposalData.totalVotes > 0n && (
        <div className="h-1.5 rounded-full overflow-hidden flex mt-1">
          {proposalData.forPercentage > 0 && (
            <div
              style={{
                width: `${proposalData.forPercentage}%`,
                backgroundColor: "var(--color-seaweed)",
              }}
            />
          )}
          {proposalData.againstPercentage > 0 && (
            <div
              style={{
                width: `${proposalData.againstPercentage}%`,
                backgroundColor: "var(--color-stormy-teal)",
              }}
            />
          )}
          {proposalData.abstainPercentage > 0 && (
            <div
              style={{
                width: `${proposalData.abstainPercentage}%`,
                backgroundColor: "var(--color-carbon-black-600)",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function VotingSummary({
  proposalIds,
  isLoading = false,
  onToggleProposalCards,
  showProposalCards = false,
}: VotingSummaryProps) {
  const [proposalsData, setProposalsData] = useState<Map<bigint, ProposalData>>(
    new Map()
  );
  const [showGeneralSummary, setShowGeneralSummary] = useState(false);

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
        className="p-4 rounded-lg shadow"
        style={{ backgroundColor: "var(--color-alabaster-grey)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3
              className="text-lg font-bold"
              style={{ color: "var(--color-carbon-black)" }}
            >
              📊 Resumen de Votaciones
            </h3>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                backgroundColor: "var(--color-carbon-black-900)",
                color: "var(--color-carbon-black-500)",
              }}
            >
              {proposalIds.length}{" "}
              {proposalIds.length === 1 ? "propuesta" : "propuestas"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <span
                className="text-xs"
                style={{ color: "var(--color-carbon-black-500)" }}
              >
                Actualizando...
              </span>
            )}
            <button
              onClick={() => setShowGeneralSummary(!showGeneralSummary)}
              className="px-2.5 py-1 rounded text-xs font-medium transition-colors"
              style={{
                backgroundColor: showGeneralSummary
                  ? "var(--color-carbon-black-900)"
                  : "var(--color-carbon-black-700)",
                color: "var(--color-carbon-black-200)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-carbon-black-800)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = showGeneralSummary
                  ? "var(--color-carbon-black-900)"
                  : "var(--color-carbon-black-700)";
              }}
            >
              {showGeneralSummary ? "▼" : "▶"} Resumen General
            </button>
            {onToggleProposalCards && (
              <button
                onClick={onToggleProposalCards}
                className="px-2.5 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  backgroundColor: showProposalCards
                    ? "var(--color-seaweed-900)"
                    : "var(--color-seaweed-700)",
                  color: "var(--color-seaweed-200)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = showProposalCards
                    ? "var(--color-seaweed-800)"
                    : "var(--color-seaweed-600)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = showProposalCards
                    ? "var(--color-seaweed-900)"
                    : "var(--color-seaweed-700)";
                }}
              >
                {showProposalCards ? "▼" : "▶"} Ver Propuestas
              </button>
            )}
          </div>
        </div>

        {/* General Summary - Collapsible */}
        {showGeneralSummary && (
          <>
            {/* Vote Totals */}
            <div className="mb-3">
              <div className="grid grid-cols-3 gap-2">
                <div
                  className="p-2.5 rounded"
                  style={{ backgroundColor: "var(--color-seaweed-900)" }}
                >
                  <div
                    className="text-[10px] mb-0.5 font-medium"
                    style={{ color: "var(--color-seaweed-200)" }}
                  >
                    A FAVOR
                  </div>
                  <div
                    className="text-lg font-bold leading-tight"
                    style={{ color: "var(--color-seaweed-200)" }}
                  >
                    {formatEther(stats.totalVotesFor)}
                  </div>
                  <div
                    className="text-[10px] mt-0.5"
                    style={{ color: "var(--color-seaweed-300)" }}
                  >
                    {stats.forPercentage.toFixed(1)}%
                  </div>
                </div>
                <div
                  className="p-2.5 rounded"
                  style={{ backgroundColor: "var(--color-stormy-teal-900)" }}
                >
                  <div
                    className="text-[10px] mb-0.5 font-medium"
                    style={{ color: "var(--color-stormy-teal-200)" }}
                  >
                    EN CONTRA
                  </div>
                  <div
                    className="text-lg font-bold leading-tight"
                    style={{ color: "var(--color-stormy-teal-200)" }}
                  >
                    {formatEther(stats.totalVotesAgainst)}
                  </div>
                  <div
                    className="text-[10px] mt-0.5"
                    style={{ color: "var(--color-stormy-teal-300)" }}
                  >
                    {stats.againstPercentage.toFixed(1)}%
                  </div>
                </div>
                <div
                  className="p-2.5 rounded"
                  style={{ backgroundColor: "var(--color-carbon-black-900)" }}
                >
                  <div
                    className="text-[10px] mb-0.5 font-medium"
                    style={{ color: "var(--color-carbon-black-600)" }}
                  >
                    ABSTENCIÓN
                  </div>
                  <div
                    className="text-lg font-bold leading-tight"
                    style={{ color: "var(--color-carbon-black-600)" }}
                  >
                    {formatEther(stats.totalVotesAbstain)}
                  </div>
                  <div
                    className="text-[10px] mt-0.5"
                    style={{ color: "var(--color-carbon-black-500)" }}
                  >
                    {stats.abstainPercentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Proposal Status Summary */}
            <div className="mb-3">
              <div className="grid grid-cols-4 gap-2">
                <div
                  className="p-2 rounded text-center"
                  style={{ backgroundColor: "var(--color-stormy-teal-900)" }}
                >
                  <div
                    className="text-base font-bold leading-tight"
                    style={{ color: "var(--color-stormy-teal-200)" }}
                  >
                    {stats.activeProposals}
                  </div>
                  <div
                    className="text-[10px] mt-0.5"
                    style={{ color: "var(--color-stormy-teal-300)" }}
                  >
                    Activas
                  </div>
                </div>
                <div
                  className="p-2 rounded text-center"
                  style={{ backgroundColor: "var(--color-seaweed-900)" }}
                >
                  <div
                    className="text-base font-bold leading-tight"
                    style={{ color: "var(--color-seaweed-200)" }}
                  >
                    {stats.approvedProposals}
                  </div>
                  <div
                    className="text-[10px] mt-0.5"
                    style={{ color: "var(--color-seaweed-300)" }}
                  >
                    Aprobadas
                  </div>
                </div>
                <div
                  className="p-2 rounded text-center"
                  style={{ backgroundColor: "var(--color-stormy-teal-900)" }}
                >
                  <div
                    className="text-base font-bold leading-tight"
                    style={{ color: "var(--color-stormy-teal-200)" }}
                  >
                    {stats.rejectedProposals}
                  </div>
                  <div
                    className="text-[10px] mt-0.5"
                    style={{ color: "var(--color-stormy-teal-300)" }}
                  >
                    Rechazadas
                  </div>
                </div>
                <div
                  className="p-2 rounded text-center"
                  style={{ backgroundColor: "var(--color-carbon-black-900)" }}
                >
                  <div
                    className="text-base font-bold leading-tight"
                    style={{ color: "var(--color-carbon-black-600)" }}
                  >
                    {stats.executedProposals}
                  </div>
                  <div
                    className="text-[10px] mt-0.5"
                    style={{ color: "var(--color-carbon-black-500)" }}
                  >
                    Ejecutadas
                  </div>
                </div>
              </div>
            </div>

            {/* Total Votes Bar */}
            {stats.totalVotes > 0n && (
              <div className="mt-2 mb-3">
                <div className="h-2.5 rounded-full overflow-hidden flex">
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
                      title={`En Contra: ${stats.againstPercentage.toFixed(
                        1
                      )}%`}
                    />
                  )}
                  {stats.abstainPercentage > 0 && (
                    <div
                      style={{
                        width: `${stats.abstainPercentage}%`,
                        backgroundColor: "var(--color-carbon-black-600)",
                      }}
                      title={`Abstención: ${stats.abstainPercentage.toFixed(
                        1
                      )}%`}
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Individual Proposal Details */}
        {Array.from(proposalsData.entries())
          .sort((a, b) => Number(b[0] - a[0])) // Sort by ID descending
          .map(([proposalId, proposalData]) => {
            const getStatusColor = () => {
              switch (proposalData.status) {
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
            const now = BigInt(Math.floor(Date.now() / 1000));
            const isActive =
              !proposalData.executed && now <= proposalData.deadline;

            return (
              <ProposalVoteCard
                key={proposalId.toString()}
                proposalId={proposalId}
                proposalData={proposalData}
                statusColors={statusColors}
                isActive={isActive}
              />
            );
          })}
      </div>
    </>
  );
}
