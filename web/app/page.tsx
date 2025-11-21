"use client";

import { useState, useEffect } from "react";
import { ConnectWallet } from "@/components/ConnectWallet";
import { FundingPanel } from "@/components/FundingPanel";
import { CreateProposal } from "@/components/CreateProposal";
import { ProposalList } from "@/components/ProposalList";
import { DaemonTrigger } from "@/components/DaemonTrigger";
import { useAccount } from "wagmi";
import { useUserBalance } from "@/hooks/useDAO";

export default function Home() {
  const { isConnected } = useAccount();
  const { balance, balanceWei, refetch: refetchBalance } = useUserBalance();
  const [proposalRefreshTrigger, setProposalRefreshTrigger] = useState(0);

  // Format balance with proper decimals
  const formatBalance = (value: string) => {
    if (!value || value === "0" || value === "0.0") return "0.000";
    const num = parseFloat(value);
    if (isNaN(num)) return "0.000";
    if (num < 0.001) return num.toFixed(6);
    return num.toFixed(4);
  };

  // Auto-refresh balance periodically
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      refetchBalance();
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [isConnected, refetchBalance]);

  const handleProposalCreated = () => {
    // Trigger refresh of proposal list
    setProposalRefreshTrigger((prev) => prev + 1);
    // Also refresh balance in case it changed
    refetchBalance();
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-alabaster-grey-900)" }}
    >
      <header
        className="shadow"
        style={{ backgroundColor: "var(--color-carbon-black)" }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1
              className="text-3xl font-bold"
              style={{ color: "var(--color-alabaster-grey)" }}
            >
              DAO Voting System
            </h1>
            <ConnectWallet />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isConnected && (
          <div
            className="mb-6 p-4 rounded"
            style={{
              backgroundColor: "var(--color-stormy-teal-900)",
              borderColor: "var(--color-stormy-teal-700)",
              borderWidth: "1px",
            }}
          >
            <div className="flex justify-between items-center">
              <p
                className="text-sm"
                style={{ color: "var(--color-stormy-teal-200)" }}
              >
                Balance en el DAO:{" "}
                <span className="font-semibold">
                  {formatBalance(balance || "0")} ETH
                </span>
                {balanceWei > 0n && (
                  <span className="text-xs ml-2 opacity-75">
                    ({balanceWei.toString()} wei)
                  </span>
                )}
              </p>
              <button
                onClick={() => refetchBalance()}
                className="text-xs px-2 py-1 rounded"
                style={{
                  backgroundColor: "var(--color-stormy-teal-700)",
                  color: "var(--color-stormy-teal-200)",
                }}
                title="Actualizar balance"
              >
                🔄
              </button>
            </div>
          </div>
        )}

        <div className="mb-6">
          <DaemonTrigger />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <FundingPanel />
          <CreateProposal onProposalCreated={handleProposalCreated} />
        </div>

        <ProposalList refreshTrigger={proposalRefreshTrigger} />
      </main>
    </div>
  );
}
