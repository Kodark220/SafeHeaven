/**
 * Wallet Context
 * Connects to MetaMask / injected provider if available,
 * otherwise falls back to mock wallet for development.
 * Triggers backend wallet auth flow on connect.
 */

"use client"

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react"
import type { WalletState, WalletContextType, NetworkName } from "./types"
import { NETWORKS } from "./types"
import { walletChallenge, walletVerify } from "@/lib/api"
import { useAuth } from "@/lib/auth"

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    network: "unknown",
    isCorrectNetwork: false,
    balance: null,
    isLoading: false,
    error: null,
  })

  const auth = useAuth()

  // Restore wallet state from storage on mount
  useEffect(() => {
    const restoreWallet = () => {
      try {
        const stored = localStorage.getItem("arc_wallet_state")
        if (stored) {
          const walletState = JSON.parse(stored)
          setState(walletState)
        }
      } catch (error) {
        console.error("Failed to restore wallet state:", error)
      }
    }

    restoreWallet()
  }, [])

  const connectWallet = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      let address: string
      let networkName: NetworkName = "arc"

      // Try real MetaMask / injected wallet
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const ethereum = (window as any).ethereum
        const accounts: string[] = await ethereum.request({ method: "eth_requestAccounts" })
        address = accounts[0]

        const chainIdHex: string = await ethereum.request({ method: "eth_chainId" })
        const chainId = parseInt(chainIdHex, 16)

        if (chainId === NETWORKS.arc.id) networkName = "arc"
        else if (chainId === NETWORKS.sepolia.id) networkName = "sepolia"
        else networkName = "unknown"

        // Backend wallet auth flow
        try {
          const challenge = await walletChallenge(address, NETWORKS.arc.id)
          const signature: string = await ethereum.request({
            method: "personal_sign",
            params: [challenge.message, address],
          })
          const { token, actor } = await walletVerify(address, challenge.nonce, signature)

          // Store auth
          await auth.login({
            id: actor?.id ?? address,
            name: actor?.name ?? address.slice(0, 10) + "...",
            walletAddress: address,
            role: (actor?.type as any) ?? "client",
            token,
          })
        } catch (authErr) {
          console.warn("Backend auth failed, continuing without JWT:", authErr)
        }
      } else {
        // Mock wallet for development
        address = "0x" + "a".repeat(40)
        console.log("No injected wallet found — using mock address")
      }

      const newState: WalletState = {
        isConnected: true,
        address,
        network: networkName,
        isCorrectNetwork: networkName === "arc",
        balance: null,
        isLoading: false,
        error: null,
      }

      setState(newState)
      localStorage.setItem("arc_wallet_state", JSON.stringify(newState))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to connect wallet",
      }))
    }
  }, [auth])

  const disconnectWallet = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const newState: WalletState = {
        isConnected: false,
        address: null,
        network: "unknown",
        isCorrectNetwork: false,
        balance: null,
        isLoading: false,
        error: null,
      }

      setState(newState)
      localStorage.removeItem("arc_wallet_state")
      await auth.logout()
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to disconnect wallet",
      }))
    }
  }, [auth])

  const switchNetwork = useCallback(async (network: NetworkName) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      if (typeof window !== "undefined" && (window as any).ethereum && network !== "unknown") {
        const target = NETWORKS[network]
        try {
          await (window as any).ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${target.id.toString(16)}` }],
          })
        } catch {
          // Chain not added — try adding it
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${target.id.toString(16)}`,
                chainName: target.name,
                rpcUrls: [target.rpcUrl],
              },
            ],
          })
        }
      }

      setState((prev) => ({
        ...prev,
        network,
        isCorrectNetwork: network === "arc",
        isLoading: false,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to switch network",
      }))
    }
  }, [])

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      if (typeof window !== "undefined" && (window as any).ethereum && state.address) {
        const balanceHex: string = await (window as any).ethereum.request({
          method: "eth_getBalance",
          params: [state.address, "latest"],
        })
        const balanceWei = BigInt(balanceHex)
        const balanceEth = Number(balanceWei) / 1e18

        setState((prev) => ({
          ...prev,
          balance: balanceEth.toFixed(4),
          isLoading: false,
        }))
      } else {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to refresh",
      }))
    }
  }, [state.address])

  const value: WalletContextType = {
    ...state,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refresh,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within WalletProvider")
  }
  return context
}
