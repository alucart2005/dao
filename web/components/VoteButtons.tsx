"use client";

import { useAccount } from "wagmi";
import { useGaslessVote } from "@/hooks/useGaslessVote";
import { VoteType } from "@/lib/config/contracts";
import { useUserVote } from "@/hooks/useDAO";

interface VoteButtonsProps {
  proposalId: bigint;
  isActive: boolean;
  onVoteSuccess?: () => void;
}

export function VoteButtons({
  proposalId,
  isActive,
  onVoteSuccess,
}: VoteButtonsProps) {
  const { isConnected } = useAccount();
  const { vote, isPending, error, txHash } = useGaslessVote();
  const userVote = useUserVote(proposalId);

  const handleVote = async (voteType: number) => {
    await vote(proposalId, voteType);
    if (onVoteSuccess) {
      setTimeout(onVoteSuccess, 2000);
    }
  };

  if (!isConnected) {
    return (
      <div
        className="text-sm"
        style={{ color: "var(--color-carbon-black-600)" }}
      >
        Conecta tu wallet para votar
      </div>
    );
  }

  if (!isActive) {
    return (
      <div
        className="text-sm"
        style={{ color: "var(--color-carbon-black-600)" }}
      >
        El período de votación ha terminado
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center justify-between">
        <div className="flex gap-2 items-center">
          <button
            onClick={() => handleVote(VoteType.FOR)}
            disabled={isPending}
            className="px-4 py-2 rounded transition-colors disabled:opacity-50"
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
          <button
            onClick={() => handleVote(VoteType.AGAINST)}
            disabled={isPending}
            className="px-4 py-2 rounded transition-colors disabled:opacity-50"
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
          <button
            onClick={() => handleVote(VoteType.ABSTAIN)}
            disabled={isPending}
            className="px-4 py-2 rounded transition-colors disabled:opacity-50"
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
        </div>
        {(userVote !== undefined || txHash) && (
          <div className="flex gap-4 items-center">
            {userVote !== undefined && (
              <div
                className="text-sm"
                style={{ color: "var(--color-carbon-black-600)" }}
              >
                Tu voto actual:{" "}
                {userVote === VoteType.FOR
                  ? "A FAVOR"
                  : userVote === VoteType.AGAINST
                  ? "EN CONTRA"
                  : "ABSTENCIÓN"}
              </div>
            )}
            {txHash && (
              <div
                className="text-sm"
                style={{ color: "var(--color-seaweed)" }}
              >
                Voto enviado! TX: {txHash.slice(0, 10)}...
              </div>
            )}
          </div>
        )}
      </div>

      {isPending && (
        <div className="text-sm" style={{ color: "var(--color-stormy-teal)" }}>
          Firmando y enviando voto...
        </div>
      )}

      {error && (
        <div className="text-sm" style={{ color: "var(--color-stormy-teal)" }}>
          Error: {error.message}
        </div>
      )}
    </div>
  );
}
