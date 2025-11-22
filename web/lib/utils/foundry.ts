import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";
import fs from "fs";

const execAsync = promisify(exec);

/**
 * Find the path to forge and anvil executables
 */
export async function findFoundryPath(): Promise<{
  forge: string;
  anvil: string;
  found: boolean;
}> {
  const isWindows = process.platform === "win32";
  const homeDir = os.homedir();

  // Common paths where Foundry might be installed
  const possiblePaths: string[] = [];

  if (isWindows) {
    // Windows paths
    possiblePaths.push(
      path.join(homeDir, ".foundry", "bin"),
      path.join(homeDir, ".cargo", "bin"),
      path.join(process.env.LOCALAPPDATA || "", "foundry", "bin"),
      path.join(process.env.APPDATA || "", "foundry", "bin"),
      "C:\\Users\\" + process.env.USERNAME + "\\.foundry\\bin",
      "C:\\Users\\" + process.env.USERNAME + "\\.cargo\\bin"
    );
  } else {
    // Unix/Mac paths
    possiblePaths.push(
      path.join(homeDir, ".foundry", "bin"),
      path.join(homeDir, ".cargo", "bin"),
      "/usr/local/bin",
      "/usr/bin",
      "/opt/homebrew/bin" // Mac M1
    );
  }

  // Try to find forge/anvil in PATH first
  try {
    if (isWindows) {
      // On Windows, try 'where' command (CMD) and 'which' (Git Bash)
      try {
        const { stdout: forgePath } = await execAsync("where forge", {
          shell: true,
        });
        const { stdout: anvilPath } = await execAsync("where anvil", {
          shell: true,
        });

        if (forgePath && anvilPath) {
          const forge = forgePath.trim().split("\n")[0].trim();
          const anvil = anvilPath.trim().split("\n")[0].trim();
          if (forge && anvil) {
            return {
              forge,
              anvil,
              found: true,
            };
          }
        }
      } catch (error) {
        // Try 'which' for Git Bash
        try {
          const { stdout: forgePath } = await execAsync("which forge", {
            shell: true,
          });
          const { stdout: anvilPath } = await execAsync("which anvil", {
            shell: true,
          });

          if (forgePath && anvilPath) {
            return {
              forge: forgePath.trim(),
              anvil: anvilPath.trim(),
              found: true,
            };
          }
        } catch (error2) {
          // Not in PATH, try other locations
        }
      }
    } else {
      // On Unix/Mac, try 'which' command
      const { stdout: forgePath } = await execAsync("which forge");
      const { stdout: anvilPath } = await execAsync("which anvil");

      if (forgePath && anvilPath) {
        return {
          forge: forgePath.trim(),
          anvil: anvilPath.trim(),
          found: true,
        };
      }
    }
  } catch (error) {
    // Not in PATH, try other locations
  }

  // Try common installation paths
  for (const basePath of possiblePaths) {
    const forgePath = path.join(basePath, isWindows ? "forge.exe" : "forge");
    const anvilPath = path.join(basePath, isWindows ? "anvil.exe" : "anvil");

    if (fs.existsSync(forgePath) && fs.existsSync(anvilPath)) {
      return {
        forge: forgePath,
        anvil: anvilPath,
        found: true,
      };
    }
  }

  // If not found, return commands as-is (will fail but give better error)
  return {
    forge: "forge",
    anvil: "anvil",
    found: false,
  };
}

/**
 * Get the PATH environment variable with Foundry paths added
 */
export function getFoundryEnv(): NodeJS.ProcessEnv {
  const isWindows = process.platform === "win32";
  const homeDir = os.homedir();

  const foundryPaths = [
    path.join(homeDir, ".foundry", "bin"),
    path.join(homeDir, ".cargo", "bin"),
  ];

  const currentPath = process.env.PATH || "";
  const pathSeparator = isWindows ? ";" : ":";
  const newPath = [...foundryPaths, currentPath].join(pathSeparator);

  return {
    ...process.env,
    PATH: newPath,
  };
}
