import { Address, encodeAbiParameters, keccak256, toHex } from "viem";

export interface ForwardRequest {
  from: Address;
  to: Address;
  value: bigint;
  gas: bigint;
  nonce: bigint;
  data: `0x${string}`;
}

export function getForwardRequestTypeHash(): `0x${string}` {
  return keccak256(
    toHex(
      "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)"
    )
  );
}

export function encodeForwardRequest(req: ForwardRequest): `0x${string}` {
  return encodeAbiParameters(
    [
      { type: "address", name: "from" },
      { type: "address", name: "to" },
      { type: "uint256", name: "value" },
      { type: "uint256", name: "gas" },
      { type: "uint256", name: "nonce" },
      { type: "bytes32", name: "dataHash" },
    ],
    [req.from, req.to, req.value, req.gas, req.nonce, keccak256(req.data)]
  );
}
