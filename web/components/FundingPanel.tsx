"use client";

import { useState } from "react";
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

  // Verificar si el contrato no está desplegado
  const contractNotDeployed =
    (balanceError && isContractNotDeployedError(balanceError)) ||
    (totalBalanceError && isContractNotDeployedError(totalBalanceError));

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
        {contractNotDeployed && (
          <div
            className="p-4 rounded-lg mb-4"
            style={{
              backgroundColor: "#fef3c7",
              border: "1px solid #fbbf24",
              color: "#92400e",
            }}
          >
            <p className="font-semibold mb-2">⚠️ Contrato no desplegado</p>
            <p className="text-sm mb-2">
              El contrato inteligente no está desplegado en la dirección
              configurada. Por favor, despliega los contratos primero.
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
