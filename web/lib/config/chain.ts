import { defineChain } from "viem";

export const localChain = defineChain({
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 31337,
  name: "Local Anvil",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"],
    },
  },
});

export const chains = [localChain];
