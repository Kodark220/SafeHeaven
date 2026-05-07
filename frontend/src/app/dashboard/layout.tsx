import { Sidebar } from "@/components/layout/sidebar"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { ProtectedRoute } from "@/components/route-guards"
import { PageTransition } from "@/components/ui/motion-wrapper"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex h-16 items-center justify-between px-6">
              <h1 className="text-xl font-semibold font-heading">Dashboard</h1>
              <ThemeToggle />
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