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
    const forwarder = searchParams.get("forwarder") as Address;

    if (!forwarder) {
      return NextResponse.json(
        { error: "Missing forwarder address" },
        { status: 400 }
      );
    }

    const domain = await publicClient.readContract({
      address: forwarder,
      abi: MINIMAL_FORWARDER_ABI,
      functionName: "eip712Domain",
    });

    // eip712Domain returns: [fields, name, version, chainId, verifyingContract, salt, extensions]
    return NextResponse.json({
      name: domain[1] as string,
      version: domain[2] as string,
      chainId: domain[3].toString(),
      verifyingContract: domain[4] as Address,
      salt: domain[5],
      extensions: domain[6],
    });
  } catch (error) {
    console.error("Error getting EIP-712 domain:", error);
    return NextResponse.json(
      { error: "Failed to get EIP-712 domain" },
      { status: 500 }
    );
  }
}
