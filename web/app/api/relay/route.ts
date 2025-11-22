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
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Error parsing JSON body:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Debug logging
    console.log("Received body:", JSON.stringify(body, null, 2));
    console.log("Body keys:", Object.keys(body || {}));
    console.log("Body type:", typeof body);

    if (!body || typeof body !== "object") {
      console.error("Body is not an object:", body);
      return NextResponse.json(
        { error: "Request body must be a JSON object" },
        { status: 400 }
      );
    }

    const forwardRequestRaw = body.request;
    const signature = body.signature;

    if (!forwardRequestRaw) {
      console.error(
        "Missing request in body. Body:",
        JSON.stringify(body, null, 2)
      );
      return NextResponse.json(
        {
          error: "Missing 'request' field in body",
          received: Object.keys(body),
          bodyType: typeof body,
        },
        { status: 400 }
      );
    }

    if (!signature) {
      console.error(
        "Missing signature in body. Body:",
        JSON.stringify(body, null, 2)
      );
      return NextResponse.json(
        {
          error: "Missing 'signature' field in body",
          received: Object.keys(body),
          bodyType: typeof body,
        },
        { status: 400 }
      );
    }

    // Convert string values back to BigInt for viem
    const forwardRequest = {
      from: forwardRequestRaw.from as Address,
      to: forwardRequestRaw.to as Address,
      value: BigInt(forwardRequestRaw.value),
      gas: BigInt(forwardRequestRaw.gas),
      nonce: BigInt(forwardRequestRaw.nonce),
      data: forwardRequestRaw.data as `0x${string}`,
    };

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
