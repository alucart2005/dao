import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, Address } from "viem";
import { localChain } from "@/lib/config/chain";
import { MINIMAL_FORWARDER_ABI } from "@/lib/config/contracts";

const publicClient = createPublicClient({
  chain: localChain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address") as Address;
    const forwarder = searchParams.get("forwarder") as Address;

    if (!address || !forwarder) {
      return NextResponse.json(
        { error: "Missing address or forwarder" },
        { status: 400 }
      );
    }

    const nonce = await publicClient.readContract({
      address: forwarder,
      abi: MINIMAL_FORWARDER_ABI,
      functionName: "getNonce",
      args: [address],
    });

    return NextResponse.json({ nonce: nonce.toString() });
  } catch (error) {
    console.error("Error getting nonce:", error);
    return NextResponse.json({ error: "Failed to get nonce" }, { status: 500 });
  }
}
