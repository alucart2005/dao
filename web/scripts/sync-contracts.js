#!/usr/bin/env node

/**
 * Script para sincronizar direcciones de contratos desplegados
 *
 * Este script:
 * 1. Lee las direcciones de los contratos desde los archivos de broadcast de Foundry
 * 2. Compara con las direcciones en .env.local
 * 3. Actualiza .env.local si hay diferencias
 * 4. Incluye logging y manejo de errores
 */

const fs = require("fs");
const path = require("path");
const { createPublicClient, http, isAddress } = require("viem");

// Configuración
const CONFIG = {
  // Ruta al directorio de smart contracts
  SC_DIR: path.join(__dirname, "../../sc"),
  // Ruta al archivo .env.local
  ENV_FILE: path.join(__dirname, "../.env.local"),
  // RPC URL por defecto
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545",
  // Chain ID por defecto
  CHAIN_ID: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "31337"),
  // Forzar actualización (usar --force flag)
  FORCE_UPDATE: process.argv.includes("--force"),
  // Modo verbose
  VERBOSE: process.argv.includes("--verbose") || process.argv.includes("-v"),
};

// Colores para logging
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  if (CONFIG.VERBOSE || color !== "reset") {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }
}

function error(message) {
  console.error(`${colors.red}❌ Error: ${message}${colors.reset}`);
}

function success(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function info(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function warn(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

/**
 * Lee las direcciones de los contratos desde los archivos de broadcast de Foundry
 */
function readContractAddressesFromBroadcast() {
  try {
    const broadcastDir = path.join(
      CONFIG.SC_DIR,
      "broadcast",
      "DeployLocal.s.sol",
      String(CONFIG.CHAIN_ID)
    );

    if (!fs.existsSync(broadcastDir)) {
      log(`Directorio de broadcast no encontrado: ${broadcastDir}`, "yellow");
      return null;
    }

    // Buscar el archivo más reciente de broadcast
    const files = fs
      .readdirSync(broadcastDir)
      .filter((file) => file.startsWith("run-") && file.endsWith(".json"))
      .sort()
      .reverse();

    if (files.length === 0) {
      log("No se encontraron archivos de broadcast", "yellow");
      return null;
    }

    const latestFile = path.join(broadcastDir, files[0]);
    log(`Leyendo archivo de broadcast: ${files[0]}`, "cyan");

    const broadcastData = JSON.parse(fs.readFileSync(latestFile, "utf8"));

    // Extraer direcciones de los contratos desplegados
    const transactions = broadcastData.transactions || [];
    const addresses = {};

    for (const tx of transactions) {
      if (tx.contractName === "MinimalForwarder") {
        addresses.MINIMAL_FORWARDER = tx.contractAddress;
      } else if (tx.contractName === "DAOVoting") {
        addresses.DAO_VOTING = tx.contractAddress;
      }
    }

    // Si no encontramos en transactions, buscar en receipts
    if (!addresses.DAO_VOTING || !addresses.MINIMAL_FORWARDER) {
      const receipts = broadcastData.receipts || [];
      for (const receipt of receipts) {
        if (
          receipt.contractName === "MinimalForwarder" &&
          !addresses.MINIMAL_FORWARDER
        ) {
          addresses.MINIMAL_FORWARDER = receipt.contractAddress;
        } else if (
          receipt.contractName === "DAOVoting" &&
          !addresses.DAO_VOTING
        ) {
          addresses.DAO_VOTING = receipt.contractAddress;
        }
      }
    }

    if (addresses.DAO_VOTING && addresses.MINIMAL_FORWARDER) {
      log(`Direcciones encontradas en broadcast:`, "cyan");
      log(`  DAO_VOTING: ${addresses.DAO_VOTING}`, "cyan");
      log(`  MINIMAL_FORWARDER: ${addresses.MINIMAL_FORWARDER}`, "cyan");
      return addresses;
    }

    return null;
  } catch (err) {
    error(`Error al leer archivos de broadcast: ${err.message}`);
    if (CONFIG.VERBOSE) {
      console.error(err);
    }
    return null;
  }
}

/**
 * Verifica si una dirección tiene código de contrato en el blockchain
 */
async function verifyContractOnChain(address) {
  try {
    const client = createPublicClient({
      transport: http(CONFIG.RPC_URL),
    });

    const code = await client.getBytecode({ address });
    return code && code !== "0x" && code.length > 2;
  } catch (err) {
    log(`Error al verificar contrato en blockchain: ${err.message}`, "yellow");
    return false;
  }
}

/**
 * Busca contratos desplegados escaneando direcciones conocidas
 * (Solo para desarrollo local con direcciones determinísticas de Anvil)
 */
async function findContractsOnChain() {
  try {
    info("Buscando contratos en el blockchain...");

    // Direcciones determinísticas comunes de Anvil
    const knownAddresses = [
      "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Primera dirección común
      "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // Segunda dirección común
    ];

    const addresses = {};

    for (const addr of knownAddresses) {
      const hasCode = await verifyContractOnChain(addr);
      if (hasCode) {
        // Intentar determinar qué tipo de contrato es
        // Por ahora, asumimos el orden estándar de deployment
        if (!addresses.MINIMAL_FORWARDER) {
          addresses.MINIMAL_FORWARDER = addr;
        } else if (!addresses.DAO_VOTING) {
          addresses.DAO_VOTING = addr;
        }
      }
    }

    if (addresses.DAO_VOTING && addresses.MINIMAL_FORWARDER) {
      return addresses;
    }

    return null;
  } catch (err) {
    error(`Error al buscar contratos en blockchain: ${err.message}`);
    return null;
  }
}

/**
 * Lee las direcciones actuales del archivo .env.local
 */
function readCurrentAddresses() {
  const addresses = {
    DAO_VOTING: null,
    MINIMAL_FORWARDER: null,
  };

  if (!fs.existsSync(CONFIG.ENV_FILE)) {
    log("Archivo .env.local no existe", "yellow");
    return addresses;
  }

  const envContent = fs.readFileSync(CONFIG.ENV_FILE, "utf8");
  const lines = envContent.split("\n");

  for (const line of lines) {
    if (line.startsWith("NEXT_PUBLIC_DAO_ADDRESS=")) {
      addresses.DAO_VOTING = line.split("=")[1]?.trim();
    } else if (line.startsWith("NEXT_PUBLIC_FORWARDER_ADDRESS=")) {
      addresses.MINIMAL_FORWARDER = line.split("=")[1]?.trim();
    }
  }

  return addresses;
}

/**
 * Actualiza el archivo .env.local con las nuevas direcciones
 */
function updateEnvFile(newAddresses) {
  try {
    let envContent = "";

    if (fs.existsSync(CONFIG.ENV_FILE)) {
      envContent = fs.readFileSync(CONFIG.ENV_FILE, "utf8");
    }

    // Actualizar o agregar las direcciones
    const lines = envContent.split("\n");
    const updatedLines = [];
    let daoFound = false;
    let forwarderFound = false;

    for (const line of lines) {
      if (line.startsWith("NEXT_PUBLIC_DAO_ADDRESS=")) {
        updatedLines.push(`NEXT_PUBLIC_DAO_ADDRESS=${newAddresses.DAO_VOTING}`);
        daoFound = true;
      } else if (line.startsWith("NEXT_PUBLIC_FORWARDER_ADDRESS=")) {
        updatedLines.push(
          `NEXT_PUBLIC_FORWARDER_ADDRESS=${newAddresses.MINIMAL_FORWARDER}`
        );
        forwarderFound = true;
      } else if (line.trim() && !line.startsWith("#")) {
        updatedLines.push(line);
      } else if (line.startsWith("#")) {
        updatedLines.push(line);
      }
    }

    // Agregar las líneas si no existían
    if (!daoFound) {
      updatedLines.push(`NEXT_PUBLIC_DAO_ADDRESS=${newAddresses.DAO_VOTING}`);
    }
    if (!forwarderFound) {
      updatedLines.push(
        `NEXT_PUBLIC_FORWARDER_ADDRESS=${newAddresses.MINIMAL_FORWARDER}`
      );
    }

    // Asegurar que las otras variables estén presentes
    const requiredVars = {
      NEXT_PUBLIC_CHAIN_ID: CONFIG.CHAIN_ID.toString(),
      NEXT_PUBLIC_RPC_URL: CONFIG.RPC_URL,
    };

    for (const [varName, varValue] of Object.entries(requiredVars)) {
      const exists = updatedLines.some((line) =>
        line.startsWith(`${varName}=`)
      );
      if (!exists) {
        updatedLines.push(`${varName}=${varValue}`);
      }
    }

    // Escribir el archivo
    const newContent = updatedLines.join("\n");
    fs.writeFileSync(CONFIG.ENV_FILE, newContent, "utf8");
    success(`Archivo .env.local actualizado`);
    return true;
  } catch (err) {
    error(`Error al actualizar .env.local: ${err.message}`);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  log("🚀 Iniciando sincronización de direcciones de contratos...\n", "bright");

  // Leer direcciones actuales
  const currentAddresses = readCurrentAddresses();
  log("Direcciones actuales en .env.local:", "cyan");
  log(
    `  DAO_VOTING: ${currentAddresses.DAO_VOTING || "No configurada"}`,
    "cyan"
  );
  log(
    `  MINIMAL_FORWARDER: ${
      currentAddresses.MINIMAL_FORWARDER || "No configurada"
    }`,
    "cyan"
  );
  log("");

  // Intentar leer desde broadcast files
  let newAddresses = readContractAddressesFromBroadcast();

  // Si no se encontraron en broadcast, intentar buscar en blockchain
  if (!newAddresses) {
    warn("No se encontraron direcciones en archivos de broadcast");
    info("Intentando buscar contratos en el blockchain...");
    newAddresses = await findContractsOnChain();
  }

  if (
    !newAddresses ||
    !newAddresses.DAO_VOTING ||
    !newAddresses.MINIMAL_FORWARDER
  ) {
    error("No se pudieron encontrar las direcciones de los contratos");
    warn("Asegúrate de que:");
    warn("  1. Anvil esté corriendo");
    warn("  2. Los contratos estén desplegados");
    warn("  3. El script de deployment se haya ejecutado con --broadcast");
    process.exit(1);
  }

  // Validar direcciones
  if (
    !isAddress(newAddresses.DAO_VOTING) ||
    !isAddress(newAddresses.MINIMAL_FORWARDER)
  ) {
    error("Direcciones inválidas encontradas");
    process.exit(1);
  }

  // Normalizar direcciones para comparación (case-insensitive)
  const normalizeAddress = (addr) => (addr ? addr.toLowerCase() : null);

  const currentNormalized = {
    DAO_VOTING: normalizeAddress(currentAddresses.DAO_VOTING),
    MINIMAL_FORWARDER: normalizeAddress(currentAddresses.MINIMAL_FORWARDER),
  };

  const newNormalized = {
    DAO_VOTING: normalizeAddress(newAddresses.DAO_VOTING),
    MINIMAL_FORWARDER: normalizeAddress(newAddresses.MINIMAL_FORWARDER),
  };

  // Verificar si hay cambios
  const hasChanges =
    currentNormalized.DAO_VOTING !== newNormalized.DAO_VOTING ||
    currentNormalized.MINIMAL_FORWARDER !== newNormalized.MINIMAL_FORWARDER;

  if (!hasChanges && !CONFIG.FORCE_UPDATE) {
    success("Las direcciones ya están actualizadas. No se requieren cambios.");
    return;
  }

  if (hasChanges) {
    info("Se detectaron cambios en las direcciones:");
    if (currentNormalized.DAO_VOTING !== newNormalized.DAO_VOTING) {
      log(
        `  DAO_VOTING: ${currentAddresses.DAO_VOTING || "No configurada"} → ${
          newAddresses.DAO_VOTING
        }`,
        "yellow"
      );
    }
    if (
      currentNormalized.MINIMAL_FORWARDER !== newNormalized.MINIMAL_FORWARDER
    ) {
      log(
        `  MINIMAL_FORWARDER: ${
          currentAddresses.MINIMAL_FORWARDER || "No configurada"
        } → ${newAddresses.MINIMAL_FORWARDER}`,
        "yellow"
      );
    }
  } else {
    info("Forzando actualización...");
  }

  // Verificar que los contratos existan en el blockchain (solo advertencia, no bloquea)
  info("Verificando contratos en el blockchain...");
  const daoExists = await verifyContractOnChain(newAddresses.DAO_VOTING);
  const forwarderExists = await verifyContractOnChain(
    newAddresses.MINIMAL_FORWARDER
  );

  if (!daoExists) {
    warn(
      `⚠️  Advertencia: El contrato DAO_VOTING no parece existir en ${newAddresses.DAO_VOTING}`
    );
    warn(
      "   Esto puede ser normal si Anvil se reinició. Despliega los contratos cuando estés listo."
    );
  } else {
    success(`✅ Contrato DAO_VOTING verificado en ${newAddresses.DAO_VOTING}`);
  }

  if (!forwarderExists) {
    warn(
      `⚠️  Advertencia: El contrato MINIMAL_FORWARDER no parece existir en ${newAddresses.MINIMAL_FORWARDER}`
    );
    warn(
      "   Esto puede ser normal si Anvil se reinició. Despliega los contratos cuando estés listo."
    );
  } else {
    success(
      `✅ Contrato MINIMAL_FORWARDER verificado en ${newAddresses.MINIMAL_FORWARDER}`
    );
  }

  // No bloquear la actualización si los contratos no existen (puede ser que aún no se hayan desplegado)
  // Solo advertir al usuario

  // Actualizar archivo
  if (updateEnvFile(newAddresses)) {
    success("\n✅ Sincronización completada exitosamente");
    info("Reinicia el servidor de desarrollo para aplicar los cambios");
  } else {
    error("Error al actualizar el archivo .env.local");
    process.exit(1);
  }
}

// Ejecutar
main().catch((err) => {
  error(`Error fatal: ${err.message}`);
  if (CONFIG.VERBOSE) {
    console.error(err);
  }
  process.exit(1);
});
