"use client";

import { useState, useEffect, useRef, useMemo, memo } from "react";
import { CONTRACTS, DAO_VOTING_ABI } from "@/lib/config/contracts";
import { ProposalCard } from "./ProposalCard";
import { VotingSummary } from "./VotingSummary";
import { DaemonTrigger } from "./DaemonTrigger";
import { createPublicClient, http, isAddress } from "viem";
import { localChain } from "@/lib/config/chain";

interface ProposalListProps {
  refreshTrigger?: number;
}

// Helper to detect contract not deployed errors
function isContractNotDeployedError(error: unknown): boolean {
  if (!error) return false;
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    errorMessage.includes("returned no data") ||
    errorMessage.includes("0x") ||
    errorMessage.includes("contract does not have the function") ||
    errorMessage.includes("address is not a contract") ||
    errorMessage.includes("Contract code is empty")
  );
}

function ProposalListComponent({ refreshTrigger = 0 }: ProposalListProps) {
  const [proposalIds, setProposalIds] = useState<bigint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contractDeployed, setContractDeployed] = useState<boolean | null>(
    null
  );
  const [showProposalCards, setShowProposalCards] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const isMountedRef = useRef(true);
  const verificationDoneRef = useRef(false);
  const fetchingRef = useRef(false);

  // Memoize public client to avoid recreating it
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: localChain,
        transport: http(
          process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"
        ),
      }),
    []
  );

  // Verify contract is deployed first - ONLY ONCE
  useEffect(() => {
    if (verificationDoneRef.current) return;

    const verifyContract = async () => {
      if (
        !CONTRACTS.DAO_VOTING ||
        CONTRACTS.DAO_VOTING === "0x0" ||
        !isAddress(CONTRACTS.DAO_VOTING)
      ) {
        if (isMountedRef.current) {
          setContractDeployed(false);
          setError("Contract address not configured");
          setLoading(false);
          verificationDoneRef.current = true;
        }
        return;
      }

      try {
        // Check if contract has code
        const code = await publicClient.getBytecode({
          address: CONTRACTS.DAO_VOTING,
        });

        const deployed = code && code !== "0x" && code.length > 2;

        if (isMountedRef.current) {
          setContractDeployed(deployed);
          verificationDoneRef.current = true;

          if (!deployed) {
            setError("Contract not deployed");
            setLoading(false);
          }
          // If deployed, keep loading true - the second useEffect will handle it
        }
      } catch (err) {
        if (isMountedRef.current) {
          setContractDeployed(false);
          setError("Failed to verify contract");
          setLoading(false);
          verificationDoneRef.current = true;
        }
      }
    };

    verifyContract();
  }, [publicClient]); // Only depends on publicClient (memoized)

  // Find proposals only if contract is deployed - DO NOT MODIFY contractDeployed here
  useEffect(() => {
    // Don't run if contract is not deployed or verification is pending
    if (contractDeployed === false || contractDeployed === null) {
      return;
    }

    // Prevent multiple simultaneous executions
    if (fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;
    let cancelled = false;

    const findProposals = async () => {
      if (!isMountedRef.current || cancelled) {
        fetchingRef.current = false;
        return;
      }

      // Only set loading to true if we don't have existing proposals
      // This prevents the list from disappearing during refresh
      if (proposalIds.length === 0) {
        setLoading(true);
      }
      // Don't clear error immediately - keep it until we have new data
      const found: bigint[] = [];

      try {
        // Check up to 100 proposals
        for (let i = 1; i <= 100; i++) {
          if (cancelled || !isMountedRef.current) break;

          try {
            const proposal = await publicClient.readContract({
              address: CONTRACTS.DAO_VOTING,
              abi: DAO_VOTING_ABI,
              functionName: "getProposal",
              args: [BigInt(i)],
            });

            // If proposal exists (id is not 0), add it
            // Handle both old and new contract versions
            if (
              proposal &&
              (proposal as any).id !== undefined &&
              (proposal as any).id !== 0n
            ) {
              found.push(BigInt(i));
            } else {
              // If we get a proposal with id 0, it means no more proposals exist
              break;
            }
          } catch (err: any) {
            // Log error for debugging
            const errorMessage = err?.message || String(err);

            // Check if it's a contract not deployed error
            if (isContractNotDeployedError(err)) {
              // If first call failed, contract might not be deployed
              if (i === 1) {
                // Don't modify contractDeployed here - just set error
                if (!cancelled && isMountedRef.current) {
                  setError("Contract not deployed");
                  setLoading(false);
                }
                fetchingRef.current = false;
                return;
              }
              // Otherwise, likely no more proposals
              break;
            }

            // Check for ABI decoding errors (contract version mismatch)
            if (
              errorMessage.includes("data out-of-bounds") ||
              errorMessage.includes("insufficient data") ||
              errorMessage.includes("AbiError") ||
              errorMessage.includes("decode")
            ) {
              // Contract version mismatch - try to continue with next proposal
              console.warn(
                `Error decoding proposal ${i}, possible contract version mismatch:`,
                errorMessage
              );
              // Continue to next proposal
              continue;
            }

            // For other errors, continue checking a few more in case of network issues
            if (i > 10) {
              break;
            }
          }
        }

        if (!cancelled && isMountedRef.current) {
          // Update proposals and clear loading/error only after successful fetch
          setProposalIds(found);
          setLoading(false);
          setError(null); // Clear error only on success
        }
      } catch (err: any) {
        if (!cancelled && isMountedRef.current) {
          const errorMessage = err?.message || String(err);
          console.error("Error in findProposals:", errorMessage);

          if (isContractNotDeployedError(err)) {
            setError("Contract not deployed");
          } else if (
            errorMessage.includes("data out-of-bounds") ||
            errorMessage.includes("insufficient data") ||
            errorMessage.includes("AbiError")
          ) {
            setError(
              "Error de compatibilidad: El contrato desplegado no coincide con la versión esperada. Por favor, redespliega el contrato."
            );
          } else {
            setError(`Failed to load proposals: ${errorMessage}`);
          }
          setLoading(false);
        }
      } finally {
        fetchingRef.current = false;
      }
    };

    findProposals();

    return () => {
      cancelled = true;
      fetchingRef.current = false;
    };
  }, [refreshTrigger, contractDeployed, publicClient]); // Include publicClient but it's memoized

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Always render the component - never return null or disappear
  // Show appropriate state based on contract deployment status
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2
          className="text-2xl font-bold"
          style={{ color: "var(--color-carbon-black)" }}
        >
          Panel de Votaciones
        </h2>
        <div className="flex items-center gap-4 flex-1 justify-end">
          <DaemonTrigger />
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
            style={{
              backgroundColor: showHelp
                ? "var(--color-stormy-teal)"
                : "var(--color-stormy-teal-900)",
              color: showHelp ? "white" : "var(--color-stormy-teal-200)",
            }}
            onMouseEnter={(e) => {
              if (!showHelp) {
                e.currentTarget.style.backgroundColor =
                  "var(--color-stormy-teal-800)";
              }
            }}
            onMouseLeave={(e) => {
              if (!showHelp) {
                e.currentTarget.style.backgroundColor =
                  "var(--color-stormy-teal-900)";
              }
            }}
          >
            <span>❓</span>
            <span>{showHelp ? "Ocultar Ayuda" : "Ayuda"}</span>
          </button>
        </div>
      </div>

      {/* Help Modal - Floating Window with Blur Background */}
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
                borderColor: "var(--color-stormy-teal-300)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-4 border-b"
                style={{
                  backgroundColor: "var(--color-stormy-teal-900)",
                  borderColor: "var(--color-stormy-teal-300)",
                }}
              >
                <h3
                  className="text-xl font-bold flex items-center gap-2"
                  style={{ color: "var(--color-stormy-teal-200)" }}
                >
                  <span>📚</span>
                  <span>Guía del Panel de Votaciones</span>
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-1.5 rounded transition-colors hover:bg-opacity-80"
                  style={{
                    backgroundColor: "var(--color-stormy-teal-800)",
                    color: "var(--color-stormy-teal-200)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-stormy-teal-700)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-stormy-teal-800)";
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
                      El Panel de Votaciones es tu centro de control para
                      participar en la gobernanza del DAO. Aquí puedes ver todas
                      las propuestas activas, votar sobre ellas y consultar los
                      resultados de las votaciones en tiempo real.
                    </p>
                  </section>

                  <section>
                    <h4
                      className="font-semibold mb-2"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      📊 Resumen de Votaciones
                    </h4>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <strong>Resumen General:</strong> Muestra estadísticas
                        agregadas de todas las propuestas (total de votos,
                        propuestas activas, aprobadas, etc.)
                      </li>
                      <li>
                        <strong>Detalles por Propuesta:</strong> Cada propuesta
                        muestra sus votos individuales (A FAVOR, EN CONTRA,
                        ABSTENCIÓN) con porcentajes y barras de progreso.
                      </li>
                      <li>
                        <strong>Botones de Votación:</strong> Puedes votar
                        directamente desde el resumen haciendo clic en los
                        botones A FAVOR, EN CONTRA o ABSTENCIÓN de cada
                        propuesta.
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h4
                      className="font-semibold mb-2"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      🗳️ Cómo Votar
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>
                        <strong>Conecta tu wallet:</strong> Asegúrate de tener
                        tu wallet conectada (MetaMask, etc.)
                      </li>
                      <li>
                        <strong>Selecciona tu voto:</strong> En el resumen, haz
                        clic en el botón correspondiente (A FAVOR, EN CONTRA o
                        ABSTENCIÓN) de la propuesta que deseas votar.
                      </li>
                      <li>
                        <strong>Firma la transacción:</strong> Tu wallet te
                        pedirá firmar la transacción. Las votaciones son sin gas
                        (gasless), por lo que no pagarás comisiones.
                      </li>
                      <li>
                        <strong>Confirma:</strong> Una vez firmada, tu voto se
                        enviará automáticamente. Verás un mensaje de
                        confirmación con el hash de la transacción.
                      </li>
                    </ol>
                  </section>

                  <section>
                    <h4
                      className="font-semibold mb-2"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      📋 Ver Propuestas Detalladas
                    </h4>
                    <p className="mb-2">
                      Para ver información completa de cada propuesta
                      (beneficiario, monto, fecha límite, etc.), haz clic en el
                      botón <strong>"▶ Ver Propuestas"</strong> en el resumen.
                      Esto mostrará las tarjetas detalladas de cada propuesta.
                    </p>
                  </section>

                  <section>
                    <h4
                      className="font-semibold mb-2"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      🏷️ Estados de las Propuestas
                    </h4>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <strong>Activa:</strong> La propuesta está abierta para
                        votación y aún no ha alcanzado su fecha límite.
                      </li>
                      <li>
                        <strong>Aprobada:</strong> La propuesta recibió más
                        votos a favor que en contra y puede ser ejecutada.
                      </li>
                      <li>
                        <strong>Rechazada:</strong> La propuesta recibió más
                        votos en contra que a favor.
                      </li>
                      <li>
                        <strong>Ejecutada:</strong> La propuesta fue aprobada y
                        ya se ejecutó (se transfirieron los fondos al
                        beneficiario).
                      </li>
                    </ul>
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
                        Solo puedes votar una vez por propuesta. Si cambias de
                        opinión, puedes votar nuevamente y tu voto anterior será
                        reemplazado.
                      </li>
                      <li>
                        Las votaciones son sin gas gracias a las
                        meta-transacciones. No necesitas ETH para votar.
                      </li>
                      <li>
                        El panel se actualiza automáticamente. Si no ves cambios
                        recientes, espera unos segundos o recarga la página.
                      </li>
                      <li>
                        Para crear nuevas propuestas, usa el formulario "Crear
                        Propuesta" en la parte superior de la página.
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
                    backgroundColor: "var(--color-stormy-teal)",
                    color: "white",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-stormy-teal-600)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-stormy-teal)";
                  }}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Contract verification pending */}
      {contractDeployed === null && (
        <div style={{ color: "var(--color-carbon-black-600)" }}>
          Verificando contrato...
        </div>
      )}

      {/* Contract not deployed */}
      {contractDeployed === false && (
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: "#fef3c7",
            border: "1px solid #fbbf24",
            color: "#92400e",
          }}
        >
          <p className="font-semibold mb-2">⚠️ Contrato no desplegado</p>
          <p className="text-sm mb-2">
            El contrato inteligente no está desplegado. Por favor, despliega los
            contratos primero.
          </p>
          <details className="text-xs mt-2">
            <summary className="cursor-pointer font-semibold">
              Ver instrucciones
            </summary>
            <div className="mt-2 p-2 bg-white rounded">
              <code className="block">
                cd sc
                <br />
                forge script script/DeployLocal.s.sol:DeployLocal --rpc-url
                http://localhost:8545 --broadcast
              </code>
            </div>
          </details>
        </div>
      )}

      {/* Contract deployed - show proposals */}
      {contractDeployed === true && (
        <>
          {loading && proposalIds.length === 0 ? (
            <div style={{ color: "var(--color-carbon-black-600)" }}>
              Cargando propuestas...
            </div>
          ) : error && proposalIds.length === 0 ? (
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: "#fee2e2",
                border: "1px solid #fca5a5",
                color: "#991b1b",
              }}
            >
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : proposalIds.length === 0 ? (
            <div
              className="p-6 rounded-lg text-center"
              style={{
                backgroundColor: "var(--color-alabaster-grey)",
                border: "1px dashed var(--color-carbon-black-300)",
              }}
            >
              <p
                className="text-lg font-medium mb-2"
                style={{ color: "var(--color-carbon-black-600)" }}
              >
                No hay propuestas disponibles
              </p>
              <p
                className="text-sm"
                style={{ color: "var(--color-carbon-black-500)" }}
              >
                Crea tu primera propuesta usando el formulario de arriba
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Voting Summary */}
              <VotingSummary
                proposalIds={proposalIds}
                isLoading={loading}
                onToggleProposalCards={() =>
                  setShowProposalCards(!showProposalCards)
                }
                showProposalCards={showProposalCards}
              />

              {/* Proposal Cards - Only show if toggled */}
              {showProposalCards && (
                <div className="space-y-4">
                  {proposalIds
                    .slice()
                    .reverse()
                    .map((id) => (
                      <ProposalCard key={id.toString()} proposalId={id} />
                    ))}
                  {error && (
                    <div
                      className="p-3 rounded-lg text-sm"
                      style={{
                        backgroundColor: "#fee2e2",
                        border: "1px solid #fca5a5",
                        color: "#991b1b",
                      }}
                    >
                      <p className="font-semibold">Error al actualizar</p>
                      <p>{error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export const ProposalList = memo(ProposalListComponent);
