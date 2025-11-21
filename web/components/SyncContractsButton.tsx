"use client";

import { useState } from "react";

/**
 * Componente para sincronizar direcciones de contratos manualmente
 * Útil para desarrollo y debugging
 */
export function SyncContractsButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    error?: string;
  } | null>(null);

  const handleSync = async (force = false) => {
    setIsSyncing(true);
    setResult(null);

    try {
      const response = await fetch(
        `/api/sync-contracts?force=${force}&verbose=true`
      );
      const data = await response.json();

      setResult({
        success: data.success,
        message: data.message,
        error: data.error || undefined,
      });
    } catch (error) {
      setResult({
        success: false,
        message: "Error al sincronizar contratos",
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div
      className="p-4 rounded-lg border"
      style={{ borderColor: "var(--color-carbon-black-300)" }}
    >
      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: "var(--color-carbon-black)" }}
      >
        Sincronizar Contratos
      </h3>
      <p
        className="text-sm mb-4"
        style={{ color: "var(--color-carbon-black-600)" }}
      >
        Sincroniza las direcciones de los contratos desde los archivos de
        deployment
      </p>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleSync(false)}
          disabled={isSyncing}
          className="px-4 py-2 rounded transition-colors disabled:opacity-50"
          style={{
            backgroundColor: "var(--color-seaweed)",
            color: "white",
          }}
        >
          {isSyncing ? "Sincronizando..." : "Sincronizar"}
        </button>

        <button
          onClick={() => handleSync(true)}
          disabled={isSyncing}
          className="px-4 py-2 rounded transition-colors disabled:opacity-50"
          style={{
            backgroundColor: "var(--color-stormy-teal)",
            color: "white",
          }}
        >
          {isSyncing ? "Sincronizando..." : "Forzar Actualización"}
        </button>
      </div>

      {result && (
        <div
          className={`p-3 rounded text-sm ${
            result.success
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          <p className="font-semibold">{result.message}</p>
          {result.error && (
            <pre className="mt-2 text-xs overflow-auto">{result.error}</pre>
          )}
        </div>
      )}
    </div>
  );
}
