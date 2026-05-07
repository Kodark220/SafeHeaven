/**
 * Wallet Types
 * Updated with real Arc testnet chain ID
 */

export type NetworkName = "sepolia" | "arc" | "unknown"

export interface WalletState {
  isConnected: boolean
  address: string | null
  network: NetworkName
  isCorrectNetwork: boolean
  balance: string | null
  isLoading: boolean
  error: string | null
}

export interface WalletContextType extends WalletState {
  connectWallet(): Promise<void>
  disconnectWallet(): Promise<void>
  switchNetwork(network: NetworkName): Promise<void>
  refresh(): Promise<void>
}

export const NETWORKS = {
  arc: {
    id: 5042002,
    name: "Arc Testnet",
    rpcUrl: process.env.NEXT_PUBLIC_ARC_RPC_URL ?? "https://rpc.testnet.arc.network",
  },
  sepolia: {
    id: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_KEY",
  },
} as const
