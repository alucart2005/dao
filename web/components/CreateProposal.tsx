"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  useCreateProposal,
  useUserBalance,
  useTotalBalance,
} from "@/hooks/useDAO";
import { isAddress, formatEther } from "viem";

interface CreateProposalProps {
  onProposalCreated?: () => void;
}

export function CreateProposal({ onProposalCreated }: CreateProposalProps) {
  const { address, isConnected } = useAccount();
  const { balanceWei, refetch: refetchBalance } = useUserBalance();
  const { totalBalanceWei, refetch: refetchTotal } = useTotalBalance();
  const { createProposal, isPending, isSuccess, error, hash } =
    useCreateProposal();

  const [name, setName] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  // Check if user has >= 10% of total balance
  const minThreshold = totalBalanceWei
    ? (totalBalanceWei * 1000n) / 10000n
    : 0n;
  const canCreateProposal = balanceWei >= minThreshold;

  const handleCreate = async () => {
    if (!name || name.trim().length === 0) {
      alert("Please enter a proposal name");
      return;
    }
    if (!isAddress(recipient)) {
      alert("Invalid recipient address");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    const deadlineTimestamp = BigInt(
      Math.floor(new Date(deadline).getTime() / 1000)
    );
    if (deadlineTimestamp <= BigInt(Math.floor(Date.now() / 1000))) {
      alert("Deadline must be in the future");
      return;
    }

    createProposal(
      name.trim(),
      recipient as `0x${string}`,
      amount,
      deadlineTimestamp
    );
    setName("");
    setRecipient("");
    setAmount("");
    setDeadline("");
  };

  // Refetch balances and notify parent when proposal is created
  useEffect(() => {
    if (isSuccess && hash) {
      // Wait a bit for the transaction to be mined
      const timer = setTimeout(() => {
        refetchBalance();
        refetchTotal();
        if (onProposalCreated) {
          onProposalCreated();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, hash, refetchBalance, refetchTotal, onProposalCreated]);

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
          Crear Propuesta
        </h2>
        <p style={{ color: "var(--color-carbon-black-600)" }}>
          Please connect your wallet to create a proposal
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
          Crear Propuesta
        </h2>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2"
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
                  <span>Guía para Crear Propuestas</span>
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
                      ¿Qué es una propuesta?
                    </h4>
                    <p className="mb-2">
                      Una propuesta es una solicitud para transferir fondos del
                      DAO a una dirección específica. Las propuestas deben ser
                      aprobadas por la comunidad mediante votación antes de
                      ejecutarse.
                    </p>
                  </section>

                  <section>
                    <h4
                      className="font-semibold mb-2"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      📋 Campos del Formulario
                    </h4>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <strong>Nombre de la propuesta:</strong> Un título
                        descriptivo que explique claramente el propósito de la
                        propuesta (ej: "Mejora de infraestructura", "Pago de
                        servicios").
                      </li>
                      <li>
                        <strong>Dirección del beneficiario:</strong> La
                        dirección Ethereum (0x...) que recibirá los fondos si la
                        propuesta es aprobada. Debe ser una dirección válida.
                      </li>
                      <li>
                        <strong>Cantidad de ETH:</strong> La cantidad de ETH que
                        se transferirá al beneficiario si la propuesta es
                        aprobada. Debe ser un número positivo.
                      </li>
                      <li>
                        <strong>Fecha límite de votación:</strong> La fecha y
                        hora hasta la cual los miembros pueden votar. Después de
                        esta fecha, la propuesta se cierra y se determina si fue
                        aprobada o rechazada.
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
                      Para crear una propuesta, necesitas tener al menos el{" "}
                      <strong>10% del balance total del DAO</strong> en tu
                      balance personal. Esto asegura que solo los miembros
                      comprometidos financieramente puedan proponer cambios.
                    </p>
                    <p className="text-xs italic mb-2">
                      Ejemplo: Si el balance total del DAO es 10 ETH, necesitas
                      tener al menos 1 ETH en tu balance para crear propuestas.
                    </p>
                    <p className="mb-2">
                      Si no cumples con este requisito, verás un mensaje
                      indicando cuánto ETH necesitas depositar en el Panel de
                      Financiación.
                    </p>
                  </section>

                  <section>
                    <h4
                      className="font-semibold mb-2"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      🚀 Cómo Crear una Propuesta
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>
                        <strong>Verifica tu balance:</strong> Asegúrate de tener
                        al menos el 10% del balance total del DAO. Si no,
                        deposita fondos en el Panel de Financiación.
                      </li>
                      <li>
                        <strong>Completa el formulario:</strong> Llena todos los
                        campos requeridos con información válida.
                      </li>
                      <li>
                        <strong>Revisa la información:</strong> Verifica que la
                        dirección del beneficiario sea correcta y que la
                        cantidad sea razonable.
                      </li>
                      <li>
                        <strong>Establece la fecha límite:</strong> Elige una
                        fecha futura que dé tiempo suficiente para que los
                        miembros voten.
                      </li>
                      <li>
                        <strong>Confirma la transacción:</strong> Haz clic en
                        "Crear Propuesta" y confirma la transacción en tu
                        wallet. Necesitarás pagar gas para esta transacción.
                      </li>
                    </ol>
                  </section>

                  <section>
                    <h4
                      className="font-semibold mb-2"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      🗳️ Proceso de Votación
                    </h4>
                    <p className="mb-2">
                      Una vez creada, tu propuesta aparecerá en el Panel de
                      Votaciones donde los miembros pueden:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <strong>Votar A FAVOR:</strong> Si están de acuerdo con
                        la propuesta.
                      </li>
                      <li>
                        <strong>Votar EN CONTRA:</strong> Si no están de
                        acuerdo.
                      </li>
                      <li>
                        <strong>ABSTENERSE:</strong> Si prefieren no tomar
                        posición.
                      </li>
                    </ul>
                    <p className="mt-2">
                      La propuesta será aprobada si tiene más votos a favor que
                      en contra al finalizar la fecha límite.
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
                        Elige nombres descriptivos y claros para tus propuestas.
                        Esto ayuda a los miembros a entender rápidamente de qué
                        se trata.
                      </li>
                      <li>
                        Verifica cuidadosamente la dirección del beneficiario.
                        Las transacciones en blockchain son irreversibles.
                      </li>
                      <li>
                        Establece fechas límite razonables. Muy cortas pueden no
                        dar tiempo suficiente para votar, muy largas pueden
                        retrasar la ejecución innecesariamente.
                      </li>
                      <li>
                        Asegúrate de tener suficiente ETH en tu wallet para
                        pagar las comisiones de gas al crear la propuesta.
                      </li>
                      <li>
                        Una vez creada, la propuesta no puede ser modificada.
                        Asegúrate de que toda la información sea correcta antes
                        de confirmar.
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

      {!canCreateProposal && (
        <div
          className="mb-4 p-3 rounded"
          style={{
            backgroundColor: "var(--color-muted-teal-900)",
            borderColor: "var(--color-muted-teal-400)",
            borderWidth: "1px",
          }}
        >
          <p
            className="text-sm"
            style={{ color: "var(--color-muted-teal-200)" }}
          >
            Necesitas tener al menos 10% del balance total del DAO para crear
            propuestas. Tu balance: {formatEther(balanceWei)} ETH, Mínimo
            requerido: {formatEther(minThreshold)} ETH
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--color-carbon-black-700)" }}
          >
            Nombre de la propuesta
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Mejora de infraestructura"
            className="w-full px-4 py-2 rounded disabled:opacity-50"
            style={{
              borderColor: "var(--color-carbon-black-300)",
              borderWidth: "1px",
              backgroundColor: "white",
              color: "var(--color-carbon-black)",
            }}
            disabled={isPending || !canCreateProposal}
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--color-carbon-black-700)" }}
          >
            Dirección del beneficiario
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-2 rounded disabled:opacity-50"
            style={{
              borderColor: "var(--color-carbon-black-300)",
              borderWidth: "1px",
              backgroundColor: "white",
              color: "var(--color-carbon-black)",
            }}
            disabled={isPending || !canCreateProposal}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--color-carbon-black-700)" }}
            >
              Cantidad de ETH
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
              disabled={isPending || !canCreateProposal}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--color-carbon-black-700)" }}
            >
              Fecha límite de votación
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2 rounded disabled:opacity-50"
              style={{
                borderColor: "var(--color-carbon-black-300)",
                borderWidth: "1px",
                backgroundColor: "white",
                color: "var(--color-carbon-black)",
              }}
              disabled={isPending || !canCreateProposal}
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={
            isPending ||
            !canCreateProposal ||
            !name ||
            !recipient ||
            !amount ||
            !deadline
          }
          className="w-full px-4 py-2 rounded transition-colors disabled:opacity-50"
          style={{
            backgroundColor: "var(--color-stormy-teal)",
            color: "white",
          }}
          onMouseEnter={(e) =>
            !e.currentTarget.disabled &&
            (e.currentTarget.style.backgroundColor =
              "var(--color-stormy-teal-600)")
          }
          onMouseLeave={(e) =>
            !e.currentTarget.disabled &&
            (e.currentTarget.style.backgroundColor = "var(--color-stormy-teal)")
          }
        >
          {isPending ? "Creando..." : "Crear Propuesta"}
        </button>

        {error && (
          <div
            className="text-sm"
            style={{ color: "var(--color-stormy-teal)" }}
          >
            Error: {error.message}
          </div>
        )}

        {isSuccess && (
          <div className="text-sm" style={{ color: "var(--color-seaweed)" }}>
            ¡Propuesta creada exitosamente!
          </div>
        )}
      </div>
    </div>
  );
}
