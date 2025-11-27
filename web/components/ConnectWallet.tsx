"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { formatAddress } from "@/lib/utils";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <div
            className="font-semibold"
            style={{ color: "var(--color-alabaster-grey)" }}
          >
            Conectado
          </div>
          <div style={{ color: "var(--color-alabaster-grey-600)" }}>
            {formatAddress(address)}
          </div>
        </div>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 rounded transition-colors"
          style={{
            backgroundColor: "var(--color-stormy-teal)",
            color: "white",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor =
              "var(--color-stormy-teal-600)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--color-stormy-teal)")
          }
        >
          Desconectar
        </button>
      </div>
    );
  }

  const injectedConnector = connectors.find((c) => c.id === "injected");

  return (
    <button
      onClick={() =>
        injectedConnector && connect({ connector: injectedConnector })
      }
      disabled={isPending || !injectedConnector}
      className="px-6 py-2 rounded transition-colors disabled:opacity-50"
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
      {isPending ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
