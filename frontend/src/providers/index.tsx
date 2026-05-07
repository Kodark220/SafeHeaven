import { QueryProvider } from "./query-provider"
import { ThemeProvider } from "./theme-provider"
import { ToastProvider } from "./toast-provider"
import { AuthProvider } from "@/lib/auth/context"
import { WalletProvider } from "@/lib/wallet/context"
import { TransactionProvider } from "@/lib/transaction/context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <AuthProvider>
          <WalletProvider>
            <TransactionProvider>
              {children}
              <ToastProvider />
            </TransactionProvider>
          </WalletProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}