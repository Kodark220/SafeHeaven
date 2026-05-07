"use client"

import { useAuth } from "@/lib/auth/context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { User, Briefcase, Bot } from "lucide-react"
import type { UserRole } from "@/lib/auth/types"

interface RoleSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoleSelector({ open, onOpenChange }: RoleSelectorProps) {
  const { selectRole } = useAuth()
  const router = useRouter()

  const roles: Array<{
    id: UserRole
    title: string
    description: string
    icon: typeof User
  }> = [
    {
      id: "client",
      title: "Client",
      description: "Create and manage escrows",
      icon: Briefcase,
    },
    {
      id: "worker",
      title: "Worker",
      description: "Complete work and earn",
      icon: User,
    },
    {
      id: "agent",
      title: "AI Agent",
      description: "Automated verification",
      icon: Bot,
    },
  ]

  const handleSelectRole = (role: UserRole) => {
    selectRole(role)
    onOpenChange(false)
    router.push(`/dashboard/${role}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Your Role</DialogTitle>
          <DialogDescription>
            Choose your role to access the appropriate dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {roles.map((role) => {
            const Icon = role.icon
            return (
              <Card
                key={role.id}
                className="p-6 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleSelectRole(role.id)}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <Icon className="h-12 w-12 text-primary" />
                  <div>
                    <h3 className="font-semibold">{role.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {role.description}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => handleSelectRole(role.id)}
                  >
                    Select
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
