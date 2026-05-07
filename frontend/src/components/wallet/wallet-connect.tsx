"use client"

import { useState } from "react"
import { useWallet } from "@/lib/wallet/context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Wallet, AlertCircle, CheckCircle, Copy } from "lucide-react"

export function WalletConnect() {
  const wallet = useWallet()
  const [copied, setCopied] = useState(false)

  const copyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!wallet.isConnected) {
    return (
      <Button
        onClick={wallet.connectWallet}
        disabled={wallet.isLoading}
        variant="default"
        className="gap-2"
      >
        <Wallet className="h-4 w-4" />
        {wallet.isLoading ? "Connecting..." : "Connect Wallet"}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <div className="flex items-center gap-2">
            {wallet.isCorrectNetwork ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
            <span className="text-sm font-medium">
              {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Connected</span>
            {wallet.isCorrectNetwork && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Arc Network
              </Badge>
            )}
            {!wallet.isCorrectNetwork && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                Wrong Network
              </Badge>
            )}
          </div>
          <p className="font-mono text-xs mt-2 break-all">{wallet.address}</p>
          {wallet.balance && (
            <p className="text-xs text-muted-foreground mt-1">
              Balance: {wallet.balance} ETH
            </p>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
          <Copy className="h-4 w-4 mr-2" />
          {copied ? "Copied" : "Copy Address"}
        </DropdownMenuItem>
        {!wallet.isCorrectNetwork && (
          <DropdownMenuItem
            onClick={() => wallet.switchNetwork("arc")}
            className="cursor-pointer text-yellow-600"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Switch to Arc Network
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={wallet.refresh}
          disabled={wallet.isLoading}
          className="cursor-pointer"
        >
          Refresh Balance
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={wallet.disconnectWallet}
          className="cursor-pointer text-red-600"
        >
          <Wallet className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
