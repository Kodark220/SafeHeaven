/**
 * Authentication Context
 * Manages user authentication state with JWT token from backend wallet auth.
 * On login the JWT is stored so the API layer can attach it to requests.
 */

"use client"

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react"
import type { AuthUser, AuthContextType, UserRole } from "./types"
import { walletMe } from "@/lib/api"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = "arc_escrow_auth"
const ROLE_STORAGE_KEY = "arc_escrow_role"
const TOKEN_STORAGE_KEY = "arc_auth_token"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  // Restore auth from storage on mount
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        const storedRole = localStorage.getItem(ROLE_STORAGE_KEY)
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)

        if (stored && storedToken) {
          const restoredUser = JSON.parse(stored) as AuthUser
          restoredUser.token = storedToken
          setUser(restoredUser)
          setSelectedRole(storedRole as UserRole)

          // Validate the token with the backend
          try {
            const me = await walletMe()
            if (me.actor) {
              setUser({
                ...restoredUser,
                id: me.actor.id,
                name: me.actor.name ?? restoredUser.name,
                walletAddress: me.auth?.address ?? restoredUser.walletAddress,
              })
            }
          } catch {
            // Token expired — clear
            localStorage.removeItem(TOKEN_STORAGE_KEY)
            localStorage.removeItem(STORAGE_KEY)
            setUser(null)
          }
        } else if (process.env.NODE_ENV === "development") {
          // Mock authenticated user for development when no backend token exists
          const mockUser: AuthUser = {
            id: "user-1",
            email: "dev@example.com",
            name: "Development User",
            role: "client",
            walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
          }
          setUser(mockUser)
          setSelectedRole("client")
        }
      } catch (error) {
        console.error("Failed to restore auth:", error)
      } finally {
        setIsLoading(false)
      }
    }

    restoreAuth()
  }, [])

  const login = useCallback(async (newUser: AuthUser) => {
    setIsLoading(true)
    try {
      setUser(newUser)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))

      // Store JWT separately so the API layer can read it
      if (newUser.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, newUser.token)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      setUser(null)
      setSelectedRole(null)
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(ROLE_STORAGE_KEY)
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const selectRole = useCallback((role: UserRole) => {
    setSelectedRole(role)
    localStorage.setItem(ROLE_STORAGE_KEY, role)
  }, [])

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    if (!user) return

    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser))

    if (updates.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, updates.token)
    }
  }, [user])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    selectedRole,
    login,
    logout,
    selectRole,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
