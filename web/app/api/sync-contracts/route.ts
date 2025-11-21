import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

/**
 * API Route para sincronizar direcciones de contratos manualmente
 *
 * GET /api/sync-contracts - Sincroniza las direcciones
 * GET /api/sync-contracts?force=true - Fuerza la actualización
 * GET /api/sync-contracts?verbose=true - Muestra logs detallados
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const force = searchParams.get("force") === "true";
    const verbose = searchParams.get("verbose") === "true";

    // Construir comando
    const scriptPath = path.join(process.cwd(), "scripts", "sync-contracts.js");
    let command = `node "${scriptPath}"`;

    if (force) {
      command += " --force";
    }
    if (verbose) {
      command += " --verbose";
    }

    // Ejecutar script
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });

    // Determinar si fue exitoso
    const success = !stderr || stderr.length === 0;

    return NextResponse.json({
      success,
      message: success
        ? "Direcciones sincronizadas exitosamente"
        : "Error al sincronizar direcciones",
      output: stdout,
      error: stderr || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error al sincronizar contratos:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Error al ejecutar el script de sincronización",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sync-contracts - Sincroniza con opciones en el body
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { force = false, verbose = false } = body;

    const scriptPath = path.join(process.cwd(), "scripts", "sync-contracts.js");
    let command = `node "${scriptPath}"`;

    if (force) {
      command += " --force";
    }
    if (verbose) {
      command += " --verbose";
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 10,
    });

    const success = !stderr || stderr.length === 0;

    return NextResponse.json({
      success,
      message: success
        ? "Direcciones sincronizadas exitosamente"
        : "Error al sincronizar direcciones",
      output: stdout,
      error: stderr || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error al sincronizar contratos:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Error al ejecutar el script de sincronización",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
