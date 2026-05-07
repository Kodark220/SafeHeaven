"use client"

import { WalletConnect } from "@/components/wallet/wallet-connect"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/lib/wallet"
import { Wallet, ShieldCheck, Globe, RefreshCcw } from "lucide-react"

export default function WalletPage() {
  const wallet = useWallet()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Wallet Dashboard</p>
          <h1 className="text-3xl font-bold">Manage Your Web3 Connection</h1>
        </div>
        <WalletConnect />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Network Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Connected Network</span>
              <Badge variant={wallet.isCorrectNetwork ? "secondary" : "destructive"}>
                {wallet.network === "arc" ? "Arc" : wallet.network === "sepolia" ? "Sepolia" : "Unknown"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Wallet Status</span>
              <Badge variant={wallet.isConnected ? "secondary" : "outline"}>
                {wallet.isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Address</span>
              <span className="font-mono text-xs">{wallet.address ?? "Not connected"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <p className="text-sm">Mock balance display for Arc readiness.</p>
            </div>
            <p className="text-3xl font-semibold">{wallet.balance ?? "0.00"}</p>
            <p className="text-sm text-muted-foreground">Estimated available funds for escrow actions</p>
            <Button variant="outline" onClick={wallet.refresh} disabled={wallet.isLoading}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh Balance
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Arc Readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <span className="text-sm">Ready for frontend Arc integration.</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Wallet connection is mocked, but the UI mirrors a real Web3 onboarding experience.
            </p>
            {!wallet.isCorrectNetwork && (
              <Button onClick={() => wallet.switchNetwork("arc")}>Switch to Arc</Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
