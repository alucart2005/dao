"use client";

import { useState } from "react";

export function DaemonTrigger() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const runDaemon = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      const response = await fetch("/api/daemon");
      const data = await response.json();
      if (response.ok) {
        setResult(
          `Daemon ejecutado. Propuestas ejecutadas: ${data.executed.length}`
        );
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : "Unknown"}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div
      className="p-3 rounded"
      style={{ backgroundColor: "var(--color-muted-teal-900)" }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={runDaemon}
          disabled={isRunning}
          className="px-4 py-2 rounded transition-colors disabled:opacity-50 whitespace-nowrap"
          style={{ backgroundColor: "var(--color-muted-teal)", color: "white" }}
          onMouseEnter={(e) =>
            !e.currentTarget.disabled &&
            (e.currentTarget.style.backgroundColor =
              "var(--color-muted-teal-600)")
          }
          onMouseLeave={(e) =>
            !e.currentTarget.disabled &&
            (e.currentTarget.style.backgroundColor = "var(--color-muted-teal)")
          }
        >
          {isRunning ? "Ejecutando..." : "Ejecutar Daemon"}
        </button>
        <p
          className="text-xs flex-1"
          style={{ color: "var(--color-carbon-black-600)" }}
        >
          El daemon verifica y ejecuta propuestas aprobadas automáticamente
        </p>
        {result && (
          <div
            className="text-sm whitespace-nowrap"
            style={{ color: "var(--color-carbon-black-700)" }}
          >
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
