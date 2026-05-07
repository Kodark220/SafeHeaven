"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { useWallet } from "@/lib/wallet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Wallet, Shield, Briefcase, Zap } from "lucide-react"

type LoginStep = "connect" | "role" | "loading"

export function LoginContent() {
  const router = useRouter()
  const auth = useAuth()
  const wallet = useWallet()
  const [step, setStep] = useState<LoginStep>("connect")
  const [error, setError] = useState<string | null>(null)

  const handleConnectWallet = async () => {
    try {
      setError(null)
      setStep("loading")
      await wallet.connectWallet()
      setStep("role")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet")
      setStep("connect")
    }
  }

  const handleSelectRole = async (role: "client" | "worker" | "agent") => {
    try {
      setError(null)
      setStep("loading")
      
      // Authenticate with selected role
      await auth.selectRole(role)
      
      // Redirect to role dashboard
      router.push(`/dashboard/${role}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select role")
      setStep("role")
    }
  }

  const handleDisconnect = async () => {
    try {
      await wallet.disconnectWallet()
      setStep("connect")
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect wallet")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo Section */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/50 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Arc Escrow</h1>
          <p className="text-muted-foreground">AI-Verified Escrow Platform</p>
        </div>

        {/* Step 1: Connect Wallet */}
        {step === "connect" && (
          <Card>
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>
                Start by connecting your Web3 wallet to access the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleConnectWallet}
                  disabled={wallet.isLoading}
                  className="w-full h-12"
                  size="lg"
                >
                  {wallet.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Connect Wallet
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Supports MetaMask, WalletConnect, and other Web3 wallets
                </p>
              </div>

              {/* Network Info */}
              <div className="p-3 bg-muted rounded-lg text-sm space-y-2">
                <p className="font-medium">Supported Networks</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Arc Network (Recommended)</li>
                  <li>• Sepolia Testnet</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Role */}
        {step === "role" && wallet.isConnected && (
          <Card>
            <CardHeader>
              <CardTitle>Select Your Role</CardTitle>
              <CardDescription>
                Choose how you&apos;ll use the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                {/* Client Role */}
                <button
                  onClick={() => handleSelectRole("client")}
                  className="w-full p-4 border rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Client</p>
                      <p className="text-xs text-muted-foreground">Create and manage escrow contracts</p>
                    </div>
                  </div>
                </button>

                {/* Worker Role */}
                <button
                  onClick={() => handleSelectRole("worker")}
                  className="w-full p-4 border rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
                      <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">Worker</p>
                      <p className="text-xs text-muted-foreground">Complete milestones and earn</p>
                    </div>
                  </div>
                </button>

                {/* AI Agent Role */}
                <button
                  onClick={() => handleSelectRole("agent")}
                  className="w-full p-4 border rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
                      <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium">AI Agent</p>
                      <p className="text-xs text-muted-foreground">Verify milestones with AI analysis</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Wallet Info */}
              <div className="p-3 bg-muted rounded-lg text-sm space-y-2">
                <p className="text-xs text-muted-foreground">Connected Wallet</p>
                <p className="font-mono text-xs break-all">{wallet.address}</p>
                <p className="text-xs text-muted-foreground">
                  Balance: {wallet.balance} {wallet.network === "arc" ? "ARC" : "ETH"}
                </p>
              </div>

              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="w-full"
              >
                Disconnect Wallet
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {step === "loading" && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Completing authentication...</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground space-y-2">
          <p>Your data is secure and encrypted</p>
          <p>
            By connecting, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  )
}
