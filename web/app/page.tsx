"use client";

import { useState } from "react";
import { ConnectWallet } from "@/components/ConnectWallet";
import { FundingPanel } from "@/components/FundingPanel";
import { CreateProposal } from "@/components/CreateProposal";
import { ProposalList } from "@/components/ProposalList";
import { DaemonTrigger } from "@/components/DaemonTrigger";

export default function Home() {
  const [proposalRefreshTrigger, setProposalRefreshTrigger] = useState(0);

  const handleProposalCreated = () => {
    // Trigger refresh of proposal list
    setProposalRefreshTrigger((prev) => prev + 1);
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
