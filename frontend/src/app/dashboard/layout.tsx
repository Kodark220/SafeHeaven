"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { ProtectedRoute } from "@/components/route-guards"
import { PageTransition } from "@/components/ui/motion-wrapper"
import { useWallet } from "@/lib/wallet"
import { Button } from "@/components/ui/button"
import { Wallet, LogOut, Menu } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const wallet = useWallet()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20">
            <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg text-foreground hover:bg-accent transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <h1 className="text-lg sm:text-xl font-semibold font-heading truncate">Dashboard</h1>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle />
                {wallet.isConnected ? (
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-flex text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      {wallet.address?.substring(0, 6)}...{wallet.address?.substring(wallet.address.length - 4)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={wallet.disconnectWallet}
                      className="rounded-xl font-bold text-xs"
                    >
                      <LogOut className="h-3.5 w-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">DISCONNECT</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={wallet.connectWallet}
                    className="rounded-xl font-bold text-xs"
                  >
                    <Wallet className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">CONNECT</span>
                  </Button>
                )}
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 relative">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
