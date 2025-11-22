import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Anvil management is only allowed in development mode" },
        { status: 403 }
      );
    }

    const isWindows = process.platform === "win32";
    let command: string;

    if (isWindows) {
      // Windows: kill processes listening on port 8545
      // Use PowerShell for better process management
      command = `powershell -Command "Get-NetTCPConnection -LocalPort 8545 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`;
    } else {
      // Unix/Mac: find and kill Anvil process
      command = `pkill -f "anvil" || (lsof -ti:8545 | xargs kill -9) || true`;
    }

    console.log(`Stopping Anvil: ${command}`);

    try {
      await execAsync(command, {
        shell: true,
      });
    } catch (error: any) {
      // Process might not be running, which is fine
      console.warn(
        "Error stopping Anvil (might not be running):",
        error.message
      );
    }

    // Wait a bit and verify it's stopped
    await new Promise((resolve) => setTimeout(resolve, 2000));

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
        signal: AbortSignal.timeout(1000),
      });

      if (response.ok) {
        return NextResponse.json({
          success: false,
          message: "Anvil is still running",
        });
      }
    } catch (error) {
      // Connection failed, Anvil is stopped
      return NextResponse.json({
        success: true,
        message: "Anvil stopped successfully",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Anvil stopped successfully",
    });
  } catch (error: any) {
    console.error("Error stopping Anvil:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to stop Anvil",
        message: "Please stop Anvil manually (Ctrl+C in the terminal)",
      },
      { status: 500 }
    );
  }
}
