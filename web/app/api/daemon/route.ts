import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { localChain } from "@/lib/config/chain";
import { DAO_VOTING_ABI } from "@/lib/config/contracts";

const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
if (!relayerPrivateKey) {
  throw new Error("RELAYER_PRIVATE_KEY environment variable is required");
}

const account = privateKeyToAccount(relayerPrivateKey as `0x${string}`);

const publicClient = createPublicClient({
  chain: localChain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"),
});

const walletClient = createWalletClient({
  account,
  chain: localChain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"),
});

export async function GET(request: NextRequest) {
  try {
    const daoAddress = process.env.NEXT_PUBLIC_DAO_ADDRESS as Address;
    const currentTime = BigInt(Math.floor(Date.now() / 1000));

    // Get total balance to estimate max proposal ID
    const totalBalance = await publicClient.readContract({
      address: daoAddress,
      abi: DAO_VOTING_ABI,
      functionName: "totalBalance",
    });

    // Check proposals (we'll check up to 100 proposals)
    const executedProposals: bigint[] = [];
    const maxProposals = 100;

    for (let i = 1; i <= maxProposals; i++) {
      try {
        const proposal = await publicClient.readContract({
          address: daoAddress,
          abi: DAO_VOTING_ABI,
          functionName: "getProposal",
          args: [BigInt(i)],
        });

        // Check if proposal should be executed
        if (
          proposal &&
          !proposal.executed &&
          currentTime > proposal.deadline &&
          proposal.votesFor > proposal.votesAgainst
        ) {
          // Check execution delay (1 day after deadline)
          const executionTime = proposal.deadline + 86400n; // 1 day in seconds
          if (currentTime >= executionTime) {
            try {
              const hash = await walletClient.writeContract({
                address: daoAddress,
                abi: DAO_VOTING_ABI,
                functionName: "executeProposal",
                args: [BigInt(i)],
              });

              executedProposals.push(BigInt(i));
              console.log(`Executed proposal ${i}, tx: ${hash}`);
            } catch (error) {
              console.error(`Failed to execute proposal ${i}:`, error);
            }
          }
        }
      } catch (error) {
        // Proposal doesn't exist or other error, continue
        break;
      }
    }

    return NextResponse.json({
      executed: executedProposals.map((id) => id.toString()),
      timestamp: currentTime.toString(),
    });
  } catch (error) {
    console.error("Error in daemon:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Daemon failed" },
      { status: 500 }
    );
  }
}
