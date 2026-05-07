"use client"

import { ReactNode } from "react"
import { useAuth } from "@/lib/auth/context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { UserRole } from "@/lib/auth/types"

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: UserRole | UserRole[]
  fallback?: ReactNode
}

export function ProtectedRoute({
  children,
  requiredRole,
  fallback,
}: ProtectedRouteProps) {
  const { user, isLoading, selectedRole } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isLoading || !isClient) return

    if (!user) {
      router.push("/login")
      return
    }

    if (requiredRole && selectedRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      if (!roles.includes(selectedRole)) {
        router.push("/role-select")
        return
      }
    }
  }, [user, isLoading, selectedRole, requiredRole, router, isClient])

  if (isLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin">
              <div className="h-8 w-8 border-4 border-muted border-t-primary rounded-full" />
            </div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: UserRole | UserRole[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { selectedRole } = useAuth()
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

  if (!selectedRole || !roles.includes(selectedRole)) {
    return null
  }

  return <>{children}</>
}
