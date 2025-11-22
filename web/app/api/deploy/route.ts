import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { findFoundryPath, getFoundryEnv } from "@/lib/utils/foundry";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Deployment is only allowed in development mode" },
        { status: 403 }
      );
    }

    // Check if Anvil is running first
    try {
      const anvilCheck = await fetch("http://localhost:8545", {
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

      if (!anvilCheck.ok) {
        return NextResponse.json(
          {
            success: false,
            error: "Anvil is not running",
            message:
              "Please start Anvil first. You can use the 'Start Anvil' button above.",
          },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Anvil is not running",
          message:
            "Please start Anvil first. You can use the 'Start Anvil' button above.",
        },
        { status: 400 }
      );
    }

    // Get the project root (parent of web directory)
    const projectRoot = path.join(process.cwd(), "..");
    const scDir = path.join(projectRoot, "sc");

    // Check if .env file exists in sc directory
    const envPath = path.join(scDir, ".env");
    let privateKey = process.env.PRIVATE_KEY;

    if (!fs.existsSync(envPath)) {
      // Create .env file with default PRIVATE_KEY from Anvil
      const defaultPrivateKey =
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Anvil default account 0
      fs.writeFileSync(envPath, `PRIVATE_KEY=${defaultPrivateKey}\n`);
      privateKey = defaultPrivateKey;
    } else {
      // Read existing .env file
      const envContent = fs.readFileSync(envPath, "utf8");
      const privateKeyMatch = envContent.match(/PRIVATE_KEY=(.+)/);
      if (privateKeyMatch) {
        privateKey = privateKeyMatch[1].trim();
      } else {
        privateKey =
          "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      }
    }

    // Find forge path
    const { forge: forgePath, found: foundryFound } = await findFoundryPath();

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

    // Verify forge exists
    if (!fs.existsSync(forgePath)) {
      return NextResponse.json(
        {
          success: false,
          error: "Forge executable not found",
          message: `Forge no se encontró en: ${forgePath}. Por favor, verifica la instalación de Foundry.`,
        },
        { status: 500 }
      );
    }

    // Execute deployment command with full path
    // Use forge directly if path has spaces, wrap in quotes
    const forgeCmd = forgePath.includes(" ") ? `"${forgePath}"` : forgePath;
    const command = `${forgeCmd} script script/DeployLocal.s.sol:DeployLocal --rpc-url http://localhost:8545 --broadcast`;

    console.log(`Executing: ${command} in ${scDir}`);

    const { stdout, stderr } = await execAsync(command, {
      cwd: scDir,
      env: {
        ...getFoundryEnv(),
        PRIVATE_KEY: privateKey,
      },
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      shell: true,
    });

    // Parse deployment addresses from output
    const daoAddressMatch = stdout.match(
      /DAOVoting deployed at:\s*(0x[a-fA-F0-9]{40})/
    );
    const forwarderAddressMatch = stdout.match(
      /MinimalForwarder deployed at:\s*(0x[a-fA-F0-9]{40})/
    );

    const daoAddress = daoAddressMatch ? daoAddressMatch[1] : null;
    const forwarderAddress = forwarderAddressMatch
      ? forwarderAddressMatch[1]
      : null;

    // Also try to read from broadcast files
    let broadcastDaoAddress = null;
    let broadcastForwarderAddress = null;

    try {
      const broadcastDir = path.join(
        scDir,
        "broadcast",
        "DeployLocal.s.sol",
        "31337"
      );
      if (fs.existsSync(broadcastDir)) {
        const files = fs.readdirSync(broadcastDir);
        const runLatestFile = files
          .filter((f: string) => f.startsWith("run-latest.json"))
          .sort()
          .pop();

        if (runLatestFile) {
          const runLatestPath = path.join(broadcastDir, runLatestFile);
          const runLatestContent = JSON.parse(
            fs.readFileSync(runLatestPath, "utf8")
          );

          // Find deployed contracts
          if (runLatestContent.transactions) {
            for (const tx of runLatestContent.transactions) {
              if (tx.contractName === "DAOVoting" && tx.contractAddress) {
                broadcastDaoAddress = tx.contractAddress;
              }
              if (
                tx.contractName === "MinimalForwarder" &&
                tx.contractAddress
              ) {
                broadcastForwarderAddress = tx.contractAddress;
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn("Could not read broadcast files:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Contract deployed successfully",
      addresses: {
        dao: daoAddress || broadcastDaoAddress,
        forwarder: forwarderAddress || broadcastForwarderAddress,
      },
      output: stdout,
      error: stderr || undefined,
    });
  } catch (error: any) {
    console.error("Deployment error:", error);

    // Check if error is about command not found
    const errorMessage = error.message || String(error);
    const stderrMessage = error.stderr || "";

    if (
      errorMessage.includes("no se reconoce") ||
      errorMessage.includes("not recognized") ||
      errorMessage.includes("command not found") ||
      stderrMessage.includes("no se reconoce") ||
      stderrMessage.includes("not recognized") ||
      stderrMessage.includes("command not found")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Foundry not found in PATH",
          message:
            "Forge no se encontró. Por favor, asegúrate de que Foundry esté instalado y agregado al PATH. Instalación: curl -L https://foundry.paradigm.xyz | bash && foundryup",
          output: error.stdout || "",
          stderr: stderrMessage,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to deploy contract",
        output: error.stdout || "",
        stderr: stderrMessage,
      },
      { status: 500 }
    );
  }
}
