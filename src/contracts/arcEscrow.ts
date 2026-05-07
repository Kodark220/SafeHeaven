import { keccak256, stringToHex } from "viem";

export const arcEscrowAbi = [
  "function createJob(bytes32 jobId,address client,address worker,bytes32[] milestoneIds,uint256[] amounts) payable",
  "function releaseMilestone(bytes32 jobId,bytes32 milestoneId) returns (uint256 amount)",
  "function getJob(bytes32 jobId) view returns (address client,address worker,uint256 totalFunded,uint256 totalReleased,bool exists)",
  "function getMilestone(bytes32 jobId,bytes32 milestoneId) view returns (uint256 amount,bool released,bool exists)"
] as const;

export function toEscrowKey(value: string) {
  return keccak256(stringToHex(value));
}

export function usdNumberToArcUnits(amountUsd: number): bigint {
  const normalized = amountUsd.toFixed(6);
  const [wholePart, fractionalPart = ""] = normalized.split(".");
  const whole = BigInt(wholePart || "0");
  const fractional = BigInt((fractionalPart.padEnd(6, "0")).slice(0, 6));
  return whole * 10n ** 18n + fractional * 10n ** 12n;
}
