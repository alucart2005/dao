"use client";

import { ConnectWallet } from "@/components/ConnectWallet";
import { FundingPanel } from "@/components/FundingPanel";
import { CreateProposal } from "@/components/CreateProposal";
import { ProposalList } from "@/components/ProposalList";
import { DaemonTrigger } from "@/components/DaemonTrigger";
import { useAccount } from "wagmi";
import { useUserBalance } from "@/hooks/useDAO";

export default function Home() {
  const { isConnected } = useAccount();
  const { balance } = useUserBalance();

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
            <p
              className="text-sm"
              style={{ color: "var(--color-stormy-teal-200)" }}
            >
              Balance en el DAO:{" "}
              <span className="font-semibold">{balance} ETH</span>
            </p>
          </div>
        )}

        <div className="mb-6">
          <DaemonTrigger />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <FundingPanel />
          <CreateProposal />
        </div>

        <ProposalList />
      </main>
    </div>
  );
}
