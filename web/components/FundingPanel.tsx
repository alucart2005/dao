"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useUserBalance, useTotalBalance, useFundDAO } from "@/hooks/useDAO";

export function FundingPanel() {
  const { isConnected } = useAccount();
  const { balance, refetch: refetchBalance } = useUserBalance();
  const { totalBalance, refetch: refetchTotal } = useTotalBalance();
  const { fundDAO, isPending, isSuccess, error } = useFundDAO();
  const [amount, setAmount] = useState("");

  const handleFund = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    fundDAO(amount);
    setAmount("");
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
      <h2
        className="text-xl font-bold mb-4"
        style={{ color: "var(--color-carbon-black)" }}
      >
        Panel de Financiación
      </h2>

      <div className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--color-carbon-black-700)" }}
          >
            Tu balance en el DAO
          </label>
          <div
            className="text-2xl font-semibold"
            style={{ color: "var(--color-seaweed)" }}
          >
            {balance} ETH
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--color-carbon-black-700)" }}
          >
            Balance total del DAO
          </label>
          <div
            className="text-2xl font-semibold"
            style={{ color: "var(--color-stormy-teal)" }}
          >
            {totalBalance} ETH
          </div>
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
          disabled={isPending || !amount}
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
        >
          {isPending ? "Enviando..." : "Enviar fondos al DAO"}
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
            ¡Fondos depositados exitosamente!
          </div>
        )}
      </div>
    </div>
  );
}
