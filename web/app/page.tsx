"use client";

import { useState } from "react";
import { ConnectWallet } from "@/components/ConnectWallet";
import { FundingPanel } from "@/components/FundingPanel";
import { CreateProposal } from "@/components/CreateProposal";
import { ProposalList } from "@/components/ProposalList";
import { AppHelpModal } from "@/components/AppHelpModal";

export default function Home() {
  const [proposalRefreshTrigger, setProposalRefreshTrigger] = useState(0);

  const handleProposalCreated = () => {
    // Trigger refresh of proposal list
    setProposalRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-alabaster-grey-900)" }}
    >
      <header
        className="shadow fixed top-0 left-0 right-0 z-50"
        style={{ backgroundColor: "var(--color-carbon-black)" }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <h1
              className="text-3xl font-bold"
              style={{ color: "var(--color-alabaster-grey)" }}
            >
              DAO Voting System
            </h1>
            <div className="flex items-center gap-3">
              <ConnectWallet />
              <AppHelpModal />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 mt-16 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <FundingPanel />
          <CreateProposal onProposalCreated={handleProposalCreated} />
        </div>

        <ProposalList refreshTrigger={proposalRefreshTrigger} />
      </main>

      <footer
        className="shadow-lg fixed bottom-0 left-0 right-0 z-50"
        style={{ backgroundColor: "var(--color-carbon-black)" }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-center items-center">
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-alabaster-grey-600)" }}
            >
              Crafted with <span className="text-red-500">❤️</span> in Medellín, Colombia | Napoleon Anaya
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
