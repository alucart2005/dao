"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useUserBalance, useTotalBalance, useFundDAO } from "@/hooks/useDAO";

// Helper para detectar si el error es porque el contrato no existe
function isContractNotDeployedError(error: unknown): boolean {
  if (!error) return false;
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    errorMessage.includes("returned no data") ||
    errorMessage.includes("0x") ||
    errorMessage.includes("contract does not have the function") ||
    errorMessage.includes("address is not a contract")
  );
}

export function FundingPanel() {
  const { isConnected } = useAccount();
  const {
    balance,
    refetch: refetchBalance,
    error: balanceError,
  } = useUserBalance();
  const {
    totalBalance,
    refetch: refetchTotal,
    error: totalBalanceError,
  } = useTotalBalance();
  const { fundDAO, isPending, isSuccess, error } = useFundDAO();
  const [amount, setAmount] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [anvilStatus, setAnvilStatus] = useState<{
    running: boolean;
    checking: boolean;
  }>({ running: false, checking: true });
  const [isStartingAnvil, setIsStartingAnvil] = useState(false);
  const [isStoppingAnvil, setIsStoppingAnvil] = useState(false);
  const [deployStatus, setDeployStatus] = useState<{
    type: "idle" | "deploying" | "success" | "error";
    message?: string;
  }>({ type: "idle" });
  const [showHelp, setShowHelp] = useState(false);

  // Verificar si el contrato no está desplegado
  const contractNotDeployed =
    (balanceError && isContractNotDeployedError(balanceError)) ||
    (totalBalanceError && isContractNotDeployedError(totalBalanceError));

  // Check Anvil status on mount and periodically
  useEffect(() => {
    const checkAnvilStatus = async () => {
      try {
        const response = await fetch("/api/anvil/status");
        const data = await response.json();
        setAnvilStatus({ running: data.running || false, checking: false });
      } catch (error) {
        setAnvilStatus({ running: false, checking: false });
      }
    };

    checkAnvilStatus();
    const interval = setInterval(checkAnvilStatus, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleFund = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    fundDAO(amount);
    setAmount("");
  };

  const handleStartAnvil = async () => {
    setIsStartingAnvil(true);
    try {
      const response = await fetch("/api/anvil/start", { method: "POST" });
      const data = await response.json();

      if (data.success) {
        setAnvilStatus({ running: true, checking: false });
        if (data.alreadyRunning) {
          setDeployStatus({
            type: "success",
            message: "Anvil ya está corriendo",
          });
        } else {
          setDeployStatus({
            type: "success",
            message: "Anvil iniciado exitosamente",
          });
        }
        setTimeout(() => setDeployStatus({ type: "idle" }), 3000);
      } else {
        setDeployStatus({
          type: "error",
          message: data.error || "Error al iniciar Anvil",
        });
      }
    } catch (error: any) {
      setDeployStatus({
        type: "error",
        message: error.message || "Error al iniciar Anvil",
      });
    } finally {
      setIsStartingAnvil(false);
    }
  };

  const handleStopAnvil = async () => {
    setIsStoppingAnvil(true);
    try {
      const response = await fetch("/api/anvil/stop", { method: "POST" });
      const data = await response.json();

      if (data.success) {
        setAnvilStatus({ running: false, checking: false });
        setDeployStatus({
          type: "success",
          message: "Anvil detenido exitosamente",
        });
        setTimeout(() => setDeployStatus({ type: "idle" }), 3000);
      } else {
        setDeployStatus({
          type: "error",
          message: data.error || "Error al detener Anvil",
        });
      }
    } catch (error: any) {
      setDeployStatus({
        type: "error",
        message: error.message || "Error al detener Anvil",
      });
    } finally {
      setIsStoppingAnvil(false);
    }
  };

  const handleDeploy = async () => {
    // Check Anvil first
    if (!anvilStatus.running) {
      setDeployStatus({
        type: "error",
        message: "Anvil no está corriendo. Por favor, inicia Anvil primero.",
      });
      return;
    }

    setIsDeploying(true);
    setDeployStatus({ type: "deploying", message: "Desplegando contratos..." });

    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setDeployStatus({
          type: "success",
          message: "¡Contratos desplegados exitosamente!",
        });

        // Sync contract addresses
        try {
          const syncResponse = await fetch("/api/sync-contracts?force=true", {
            method: "GET",
          });
          const syncData = await syncResponse.json();
          if (syncData.success) {
            setDeployStatus({
              type: "success",
              message:
                "¡Contratos desplegados y direcciones sincronizadas! Recargando...",
            });
            // Reload page after a short delay to pick up new addresses
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } else {
            setDeployStatus({
              type: "success",
              message: "Contratos desplegados. Sincronizando direcciones...",
            });
            // Try again with POST
            try {
              const syncPostResponse = await fetch("/api/sync-contracts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ force: true }),
              });
              const syncPostData = await syncPostResponse.json();
              if (syncPostData.success) {
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
              }
            } catch (syncPostError) {
              console.error("Error syncing contracts:", syncPostError);
            }
          }
        } catch (syncError) {
          console.error("Error syncing contracts:", syncError);
          setDeployStatus({
            type: "success",
            message:
              "Contratos desplegados. Por favor, ejecuta 'npm run sync-contracts' manualmente.",
          });
        }

        // Refetch balances after a delay
        setTimeout(() => {
          refetchBalance();
          refetchTotal();
        }, 3000);
      } else {
        // Show more detailed error message
        const errorMsg =
          data.message || data.error || "Error al desplegar contratos";
        setDeployStatus({
          type: "error",
          message: errorMsg,
        });
      }
    } catch (error: any) {
      console.error("Deployment error:", error);
      const errorMsg =
        error.message ||
        "Error al desplegar contratos. Verifica que Anvil esté corriendo.";
      setDeployStatus({
        type: "error",
        message: errorMsg,
      });
    } finally {
      setIsDeploying(false);
    }
  };

  if (isSuccess) {
    refetchBalance();
    refetchTotal();
  }

  if (!isConnected) {
    return (
      <div
        className="p-6 rounded-lg shadow"
        style={{ backgroundColor: "var(--color-alabaster-grey)" }}
      >
        <h2
          className="text-xl font-bold mb-4"
          style={{ color: "var(--color-carbon-black)" }}
        >
          Panel de Financiación
        </h2>
        <p style={{ color: "var(--color-carbon-black-600)" }}>
          Please connect your wallet to fund the DAO
        </p>
      </div>
    );
  }

  return (
    <div
      className="p-6 rounded-lg shadow"
      style={{ backgroundColor: "var(--color-alabaster-grey)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-xl font-bold"
          style={{ color: "var(--color-carbon-black)" }}
        >
          Panel de Financiación
        </h2>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2"
          style={{
            backgroundColor: showHelp
              ? "var(--color-seaweed)"
              : "var(--color-seaweed-900)",
            color: showHelp ? "white" : "var(--color-seaweed-200)",
          }}
          onMouseEnter={(e) => {
            if (!showHelp) {
              e.currentTarget.style.backgroundColor =
                "var(--color-seaweed-800)";
            }
          }}
          onMouseLeave={(e) => {
            if (!showHelp) {
              e.currentTarget.style.backgroundColor =
                "var(--color-seaweed-900)";
            }
          }}
        >
          <span>❓</span>
          <span>{showHelp ? "Ocultar Ayuda" : "Ayuda"}</span>
        </button>
      </div>

      {/* Help Modal - Floating Window with Enhanced Blur Background */}
      {showHelp && (
        <>
          {/* Backdrop with enhanced blur and transparency */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowHelp(false)}
            style={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />

          {/* Modal Window */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowHelp(false)}
          >
            <div
              className="relative w-full max-w-3xl max-h-[90vh] rounded-lg shadow-2xl border overflow-hidden flex flex-col"
              style={{
                backgroundColor: "var(--color-alabaster-grey-900)",
                borderColor: "var(--color-seaweed-300)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-4 border-b"
                style={{
                  backgroundColor: "var(--color-seaweed-900)",
                  borderColor: "var(--color-seaweed-300)",
                }}
              >
                <h3
                  className="text-xl font-bold flex items-center gap-2"
                  style={{ color: "var(--color-seaweed-200)" }}
                >
                  <span>📚</span>
                  <span>Guía del Panel de Financiación</span>
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-1.5 rounded transition-colors hover:bg-opacity-80"
                  style={{
                    backgroundColor: "var(--color-seaweed-800)",
                    color: "var(--color-seaweed-200)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-seaweed-700)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-seaweed-800)";
                  }}
                >
                  <span className="text-lg">×</span>
                </button>
              </div>

              {/* Scrollable Content */}
              <div
                className="flex-1 overflow-y-auto p-6"
                style={{ backgroundColor: "var(--color-alabaster-grey-900)" }}
              >
                <div
                  className="space-y-4 text-sm"
                  style={{ color: "var(--color-carbon-black-700)" }}
                >
                  <section>
                    <h4
                      className="font-semibold mb-2"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      ¿Qué es este panel?
                    </h4>
                    <p className="mb-2">
                      El Panel de Financiación te permite depositar fondos (ETH)
                      en el DAO. Estos fondos se utilizan para financiar las
                      propuestas que son aprobadas por la comunidad mediante
                      votación.
                    </p>
                  </section>

                  <section>
                    <h4
                      className="font-semibold mb-2"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      💰 Balance en el DAO
                    </h4>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <strong>Tu balance:</strong> Muestra la cantidad de ETH
                        que has depositado en el DAO. Este balance determina tu
                        poder de voto y tu capacidad para crear propuestas.
                      </li>
                      <li>
                        <strong>Balance total del DAO:</strong> Es la suma de
                        todos los fondos depositados por todos los miembros del
                        DAO. Este es el presupuesto disponible para ejecutar
                        propuestas aprobadas.
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h4
                      className="font-semibold mb-2"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      💵 Cómo Depositar Fondos
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>
                        <strong>Conecta tu wallet:</strong> Asegúrate de tener
                        tu wallet conectada (MetaMask, etc.) y que tenga ETH
                        disponible.
                      </li>
                      <li>
                        <strong>Ingresa la cantidad:</strong> En el campo
                        "Cantidad de ETH a depositar", ingresa la cantidad que
                        deseas depositar en el DAO.
                      </li>
                      <li>
                        <strong>Confirma la transacción:</strong> Haz clic en
                        "Enviar fondos al DAO" y confirma la transacción en tu
                        wallet. Necesitarás pagar gas para esta transacción.
                      </li>
                      <li>
                        <strong>Espera la confirmación:</strong> Una vez
                        confirmada, tus fondos estarán disponibles en el DAO y
                        tu balance se actualizará automáticamente.
                      </li>
                    </ol>
                  </section>

                  <section>
                    <h4
                      className="font-semibold mb-2"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      🚀 Desplegar Contratos
                    </h4>
                    <p className="mb-2">
                      Si es la primera vez que usas el DAO, necesitarás
                      desplegar los contratos inteligentes en la blockchain
                      local (Anvil).
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <strong>Anvil:</strong> Es la blockchain local de
                        desarrollo. Debe estar corriendo antes de desplegar
                        contratos.
                      </li>
                      <li>
                        <strong>Iniciar Anvil:</strong> Si Anvil no está
                        corriendo, verás un botón "▶ Iniciar Anvil" que lo
                        iniciará automáticamente.
                      </li>
                      <li>
                        <strong>Desplegar:</strong> Una vez que Anvil esté
                        corriendo, puedes usar el botón "🚀 Desplegar Contratos
                        Automáticamente" para desplegar los contratos sin usar
                        la terminal.
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h4
                      className="font-semibold mb-2"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      ⚠️ Requisitos para Crear Propuestas
                    </h4>
                    <p className="mb-2">
                      Para crear propuestas en el DAO, necesitas tener al menos
                      el 10% del balance total del DAO en tu balance personal.
                      Esto asegura que solo los miembros comprometidos puedan
                      proponer cambios.
                    </p>
                    <p className="text-xs italic">
                      Ejemplo: Si el balance total del DAO es 10 ETH, necesitas
                      tener al menos 1 ETH en tu balance para crear propuestas.
                    </p>
                  </section>

                  <section>
                    <h4
                      className="font-semibold mb-2"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      💡 Consejos
                    </h4>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        Los fondos depositados en el DAO se utilizan para
                        ejecutar propuestas aprobadas. Asegúrate de entender
                        cómo funciona el sistema de votación antes de depositar
                        grandes cantidades.
                      </li>
                      <li>
                        Tu balance en el DAO determina tu poder de voto. A mayor
                        balance, mayor influencia en las decisiones del DAO.
                      </li>
                      <li>
                        Si el contrato no está desplegado, verás una advertencia
                        y opciones para desplegarlo automáticamente.
                      </li>
                      <li>
                        Las transacciones de depósito requieren gas. Asegúrate
                        de tener suficiente ETH en tu wallet para cubrir las
                        comisiones.
                      </li>
                    </ul>
                  </section>
                </div>
              </div>

              {/* Footer */}
              <div
                className="p-4 border-t flex justify-end"
                style={{
                  backgroundColor: "var(--color-alabaster-grey-800)",
                  borderColor: "var(--color-carbon-black-300)",
                }}
              >
                <button
                  onClick={() => setShowHelp(false)}
                  className="px-4 py-2 rounded font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--color-seaweed)",
                    color: "white",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-seaweed-600)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-seaweed)";
                  }}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="space-y-4">
        {/* Anvil Status and Controls - Only show when Anvil is not running */}
        {!anvilStatus.running && (
          <div
            className="p-4 rounded-lg mb-4"
            style={{
              backgroundColor: "#fee2e2",
              border: "1px solid #ef4444",
              color: "#991b1b",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔴</span>
                <div>
                  <p className="font-semibold text-sm">Anvil: Detenido</p>
                  <p className="text-xs opacity-75">
                    Blockchain local no disponible
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleStartAnvil}
                  disabled={isStartingAnvil || anvilStatus.checking}
                  className="px-3 py-1.5 rounded text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "#10b981",
                    color: "white",
                  }}
                  onMouseEnter={(e) =>
                    !e.currentTarget.disabled &&
                    (e.currentTarget.style.backgroundColor = "#059669")
                  }
                  onMouseLeave={(e) =>
                    !e.currentTarget.disabled &&
                    (e.currentTarget.style.backgroundColor = "#10b981")
                  }
                >
                  {isStartingAnvil ? "Iniciando..." : "▶ Iniciar Anvil"}
                </button>
              </div>
            </div>
          </div>
        )}

        {contractNotDeployed && (
          <div
            className="p-4 rounded-lg mb-4"
            style={{
              backgroundColor: "#fef3c7",
              border: "1px solid #fbbf24",
              color: "#92400e",
            }}
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold mb-1">Contrato no desplegado</p>
                <p className="text-sm">
                  El contrato inteligente no está desplegado en la dirección
                  configurada.
                </p>
              </div>
            </div>

            {deployStatus.type === "idle" && (
              <div className="mt-3 space-y-2">
                {!anvilStatus.running && (
                  <div className="mb-2 p-2 rounded bg-red-50 border border-red-200">
                    <p className="text-xs text-red-800 font-medium">
                      ⚠️ Anvil debe estar corriendo antes de desplegar
                    </p>
                  </div>
                )}
                <button
                  onClick={handleDeploy}
                  disabled={isDeploying || !anvilStatus.running}
                  className="w-full px-4 py-2 rounded font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "#f59e0b",
                    color: "white",
                  }}
                  onMouseEnter={(e) =>
                    !e.currentTarget.disabled &&
                    (e.currentTarget.style.backgroundColor = "#d97706")
                  }
                  onMouseLeave={(e) =>
                    !e.currentTarget.disabled &&
                    (e.currentTarget.style.backgroundColor = "#f59e0b")
                  }
                >
                  {!anvilStatus.running
                    ? "⏸ Inicia Anvil primero"
                    : isDeploying
                    ? "Desplegando..."
                    : "🚀 Desplegar Contratos Automáticamente"}
                </button>
                <details className="text-xs mt-2">
                  <summary className="cursor-pointer font-semibold hover:underline">
                    Ver instrucciones manuales
                  </summary>
                  <div className="mt-2 p-2 bg-white rounded">
                    <code className="block text-xs">
                      cd sc
                      <br />
                      forge script script/DeployLocal.s.sol:DeployLocal
                      --rpc-url http://localhost:8545 --broadcast
                    </code>
                  </div>
                </details>
              </div>
            )}

            {deployStatus.type === "deploying" && (
              <div className="mt-3 p-3 rounded bg-white">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-600 border-t-transparent"></div>
                  <p className="text-sm font-medium">{deployStatus.message}</p>
                </div>
                <p className="text-xs mt-2 text-amber-700">
                  Esto puede tomar unos segundos...
                </p>
              </div>
            )}

            {deployStatus.type === "success" && (
              <div className="mt-3 p-3 rounded bg-green-50 border border-green-200">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <p className="text-sm font-medium text-green-800">
                    {deployStatus.message}
                  </p>
                </div>
              </div>
            )}

            {deployStatus.type === "error" && (
              <div className="mt-3 p-3 rounded bg-red-50 border border-red-200">
                <div className="flex items-center gap-2">
                  <span className="text-red-600">✗</span>
                  <p className="text-sm font-medium text-red-800">
                    {deployStatus.message}
                  </p>
                </div>
                <details className="text-xs mt-2">
                  <summary className="cursor-pointer text-red-700 hover:underline">
                    Ver detalles del error
                  </summary>
                  <div className="mt-2 p-2 bg-white rounded">
                    <p className="text-xs">
                      Asegúrate de que Anvil esté corriendo en
                      http://localhost:8545
                    </p>
                  </div>
                </details>
              </div>
            )}
          </div>
        )}

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--color-carbon-black-700)" }}
          >
            Tu balance en el DAO
          </label>
          {balanceError && isContractNotDeployedError(balanceError) ? (
            <div className="text-sm text-amber-700">Contrato no desplegado</div>
          ) : (
            <div
              className="text-2xl font-semibold"
              style={{ color: "var(--color-seaweed)" }}
            >
              {balance} ETH
            </div>
          )}
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--color-carbon-black-700)" }}
          >
            Balance total del DAO
          </label>
          {totalBalanceError &&
          isContractNotDeployedError(totalBalanceError) ? (
            <div className="text-sm text-amber-700">Contrato no desplegado</div>
          ) : (
            <div
              className="text-2xl font-semibold"
              style={{ color: "var(--color-stormy-teal)" }}
            >
              {totalBalance} ETH
            </div>
          )}
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--color-carbon-black-700)" }}
          >
            Cantidad de ETH a depositar
          </label>
          <input
            type="number"
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full px-4 py-2 rounded disabled:opacity-50"
            style={{
              borderColor: "var(--color-carbon-black-300)",
              borderWidth: "1px",
              backgroundColor: "white",
              color: "var(--color-carbon-black)",
            }}
            disabled={isPending}
          />
        </div>

        <button
          onClick={handleFund}
          disabled={isPending || !amount || contractNotDeployed}
          className="w-full px-4 py-2 rounded transition-colors disabled:opacity-50"
          style={{ backgroundColor: "var(--color-seaweed)", color: "white" }}
          onMouseEnter={(e) =>
            !e.currentTarget.disabled &&
            (e.currentTarget.style.backgroundColor = "var(--color-seaweed-600)")
          }
          onMouseLeave={(e) =>
            !e.currentTarget.disabled &&
            (e.currentTarget.style.backgroundColor = "var(--color-seaweed)")
          }
          title={
            contractNotDeployed ? "El contrato no está desplegado" : undefined
          }
        >
          {isPending
            ? "Enviando..."
            : contractNotDeployed
            ? "Contrato no desplegado"
            : "Enviar fondos al DAO"}
        </button>

        {error && !contractNotDeployed && (
          <div
            className="text-sm"
            style={{ color: "var(--color-stormy-teal)" }}
          >
            Error: {error.message}
          </div>
        )}

        {isSuccess && (
          <div className="text-sm" style={{ color: "var(--color-seaweed)" }}>
            ¡Fondos depositados exitosamente!
          </div>
        )}
      </div>
    </div>
  );
}
