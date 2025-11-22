import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Anvil management is only allowed in development mode" },
        { status: 403 }
      );
    }

    // Check if Anvil is running by trying to connect to it
    try {
      const response = await fetch("http://localhost:8545", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        }),
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          running: true,
          message: "Anvil is running",
          blockNumber: data.result,
        });
      }
    } catch (error) {
      // Connection failed, Anvil is not running
      return NextResponse.json({
        running: false,
        message: "Anvil is not running",
      });
    }

    return NextResponse.json({
      running: false,
      message: "Anvil is not running",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        running: false,
        error: error.message || "Failed to check Anvil status",
      },
      { status: 500 }
    );
  }
}
