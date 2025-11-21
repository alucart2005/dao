import { NextRequest, NextResponse } from "next/server";
import {
  createWalletClient,
  createPublicClient,
  http,
  Address,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { localChain } from "@/lib/config/chain";
import { MINIMAL_FORWARDER_ABI } from "@/lib/config/contracts";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { request: forwardRequest, signature } = body;

    if (!forwardRequest || !signature) {
      return NextResponse.json(
        { error: "Missing request or signature" },
        { status: 400 }
      );
    }

    // Verify the signature first
    const forwarderAddress = process.env
      .NEXT_PUBLIC_FORWARDER_ADDRESS as Address;
    const isValid = await publicClient.readContract({
      address: forwarderAddress,
      abi: MINIMAL_FORWARDER_ABI,
      functionName: "verify",
      args: [forwardRequest, signature],
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Execute the meta-transaction
    const hash = await walletClient.writeContract({
      address: forwarderAddress,
      abi: MINIMAL_FORWARDER_ABI,
      functionName: "execute",
      args: [forwardRequest, signature],
      value: forwardRequest.value || 0n,
    });

    return NextResponse.json({ txHash: hash });
  } catch (error) {
    console.error("Error relaying transaction:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Relay failed" },
      { status: 500 }
    );
  }
}
