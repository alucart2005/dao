export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatDate(timestamp: bigint | number): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString();
}

export function getProposalStatus(
  proposal:
    | {
        executed: boolean;
        deadline: bigint;
        votesFor: bigint;
        votesAgainst: bigint;
      }
    | undefined
): string {
  if (!proposal) return "Unknown";
  if (proposal.executed) return "Ejecutada";
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (now > proposal.deadline) {
    if (proposal.votesFor > proposal.votesAgainst) {
      return "Aprobada";
    }
    return "Rechazada";
  }
  return "Activa";
}
