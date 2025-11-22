import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { findFoundryPath, getFoundryEnv } from "@/lib/utils/foundry";

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

    // Check if Anvil is already running
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
          success: true,
          message: "Anvil is already running",
          alreadyRunning: true,
        });
      }
    } catch (error) {
      // Anvil is not running, proceed to start it
    }

    // Find anvil path
    const { anvil: anvilPath, found: foundryFound } = await findFoundryPath();

    if (!foundryFound) {
      return NextResponse.json(
        {
          success: false,
          error: "Foundry not found",
          message:
            "Foundry no está instalado o no está en el PATH. Por favor, instala Foundry: https://book.getfoundry.sh/getting-started/installation",
        },
        { status: 500 }
      );
    }

    // Get the project root (parent of web directory)
    const projectRoot = path.join(process.cwd(), "..");
    const scDir = path.join(projectRoot, "sc");

    // Start Anvil in background
    // On Windows, use start command; on Unix, use nohup or &
    const isWindows = process.platform === "win32";

    // Verify anvil exists
    if (!fs.existsSync(anvilPath)) {
      return NextResponse.json(
        {
          success: false,
          error: "Anvil executable not found",
          message: `Anvil no se encontró en: ${anvilPath}. Por favor, verifica la instalación de Foundry.`,
        },
        { status: 500 }
      );
    }

    let command: string;
    if (isWindows) {
      // Windows: start in new window with full path
      // Escape quotes properly for Windows
      const anvilCmd = anvilPath.includes(" ") ? `"${anvilPath}"` : anvilPath;
      command = `start "Anvil" cmd /c "cd /d "${scDir}" && ${anvilCmd}"`;
    } else {
      // Unix/Mac: start in background with full path
      const anvilCmd = anvilPath.includes(" ") ? `"${anvilPath}"` : anvilPath;
      command = `cd "${scDir}" && nohup ${anvilCmd} > anvil.log 2>&1 &`;
    }

    console.log(`Starting Anvil: ${command}`);

    try {
      await execAsync(command, {
        cwd: scDir,
        shell: true,
        env: getFoundryEnv(),
      });
    } catch (error: any) {
      // On Windows, start command doesn't wait, so this might error but still work
      if (!isWindows) {
        throw error;
      }
    }

    // Wait a bit for Anvil to start
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Verify Anvil started
    let attempts = 0;
    const maxAttempts = 10;
    while (attempts < maxAttempts) {
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
          signal: AbortSignal.timeout(2000),
        });

        if (response.ok) {
          return NextResponse.json({
            success: true,
            message: "Anvil started successfully",
          });
        }
      } catch (error) {
        // Not ready yet, wait and retry
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      success: false,
      message: "Anvil may have started, but could not verify connection",
    });
  } catch (error: any) {
    console.error("Error starting Anvil:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to start Anvil",
        message: "Please start Anvil manually: cd sc && anvil",
      },
      { status: 500 }
    );
  }
}
