"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  Users,
  Shield,
  Settings,
  Wallet,
  User,
  Bot,
  Zap
} from "lucide-react"
import { motion } from "framer-motion"

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Client Hub", href: "/dashboard/client", icon: User },
  { name: "Worker Hub", href: "/dashboard/worker", icon: Users },
  { name: "Agent Hub", href: "/dashboard/agent", icon: Bot },
  { name: "Escrows", href: "/dashboard/escrows", icon: FileText },
  { name: "Verify", href: "/verification", icon: Shield },
  { name: "Vault", href: "/wallet", icon: Wallet },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-slate-300 border-r border-slate-800">
      <div className="flex h-20 items-center px-6 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-white tracking-tight leading-none">Arc Escrow</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">AI Protocol</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1.5 px-4 py-4">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-3 mb-4">Main Menu</p>
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group relative flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300",
                isActive
                  ? "bg-white/5 text-white shadow-sm"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                />
              )}
              <item.icon className={cn(
                "mr-3 h-5 w-5 transition-colors",
                isActive ? "text-primary" : "text-slate-500 group-hover:text-slate-300"
              )} />
              <span className="font-heading tracking-tight">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-800">
           <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                 <Shield className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                 <p className="text-xs font-bold text-white">Network Secure</p>
                 <p className="text-[10px] text-slate-500">Node v2.4.0-rc</p>
              </div>
           </div>
           <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-full bg-emerald-500/40 animate-pulse" />
           </div>
        </div>
      </div>
    </div>
  )
}