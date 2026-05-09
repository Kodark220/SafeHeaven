import { Sidebar } from "@/components/layout/sidebar"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { ProtectedRoute } from "@/components/route-guards"
import { PageTransition } from "@/components/ui/motion-wrapper"
import { useWallet } from "@/lib/wallet"
import { Button } from "@/components/ui/button"
import { Wallet, LogOut } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const wallet = useWallet()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex h-16 items-center justify-between px-6">
              <h1 className="text-xl font-semibold font-heading">Dashboard</h1>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                {wallet.isConnected ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      {wallet.address?.substring(0, 6)}...{wallet.address?.substring(wallet.address.length - 4)}
                    </span>
                    <Button variant="outline" size="sm" onClick={wallet.disconnectWallet} className="rounded-xl font-bold text-xs">
                      <LogOut className="h-3.5 w-3.5 mr-1.5" />
                      DISCONNECT
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" onClick={wallet.connectWallet} className="rounded-xl font-bold text-xs bg-slate-900 text-white hover:bg-slate-800">
                    <Wallet className="h-3.5 w-3.5 mr-1.5" />
                    CONNECT
                  </Button>
                )}
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 relative">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}