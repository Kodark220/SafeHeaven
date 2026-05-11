"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  Wallet,
  User,
  Bot,
  Handshake,
  Briefcase,
  X,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Client Hub", href: "/dashboard/client", icon: User },
  { name: "Worker Hub", href: "/dashboard/worker", icon: Users },
  { name: "Agent Hub", href: "/dashboard/agent", icon: Bot },
  { name: "Marketplace", href: "/dashboard/marketplace", icon: Briefcase },
  { name: "Escrows", href: "/dashboard/escrows", icon: Handshake },
  { name: "Verify", href: "/verification", icon: Shield },
  { name: "Vault", href: "/wallet", icon: Wallet },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-slate-900 text-slate-300 border-r border-slate-800 transition-transform duration-300 ease-in-out md:relative md:w-64 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold font-heading text-white tracking-tight leading-none">
                Safe Heaven
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                AI Protocol
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="md:hidden rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-4 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-3 mb-4">
            Main Menu
          </p>
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300",
                  isActive
                    ? "bg-white/5 text-white shadow-sm"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                  />
                )}
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 transition-colors shrink-0",
                    isActive
                      ? "text-primary"
                      : "text-slate-500 group-hover:text-slate-300",
                  )}
                />
                <span className="font-heading tracking-tight truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Network Secure</p>
                <p className="text-[10px] text-slate-500 truncate">Node v2.4.0-rc</p>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-full bg-emerald-500/40 animate-pulse" />
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
