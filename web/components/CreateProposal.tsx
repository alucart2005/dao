"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import {
  useCreateProposal,
  useUserBalance,
  useTotalBalance,
} from "@/hooks/useDAO";
import { isAddress } from "viem";

export function CreateProposal() {
  const { address, isConnected } = useAccount();
  const { balanceWei, refetch: refetchBalance } = useUserBalance();
  const { totalBalanceWei, refetch: refetchTotal } = useTotalBalance();
  const { createProposal, isPending, isSuccess, error } = useCreateProposal();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  // Check if user has >= 10% of total balance
  const minThreshold = totalBalanceWei
    ? (totalBalanceWei * 1000n) / 10000n
    : 0n;
  const canCreateProposal = balanceWei >= minThreshold;

  const handleCreate = async () => {
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

    createProposal(recipient as `0x${string}`, amount, deadlineTimestamp);
    setRecipient("");
    setAmount("");
    setDeadline("");
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
      <h2
        className="text-xl font-bold mb-4"
        style={{ color: "var(--color-carbon-black)" }}
      >
        Crear Propuesta
      </h2>

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
            propuestas. Tu balance: {balanceWei.toString()} wei, Mínimo
            requerido: {minThreshold.toString()} wei
          </p>
        </div>
      )}

      <div className="space-y-4">
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

        <button
          onClick={handleCreate}
          disabled={
            isPending ||
            !canCreateProposal ||
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
