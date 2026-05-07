/**
 * Authentication Types
 * Aligned with the backend's wallet‑based auth flow
 */

export type UserRole = "client" | "worker" | "human" | "agent"

export interface AuthUser {
  id: string
  role: UserRole
  walletAddress: string
  name: string
  email?: string
  /** JWT token from POST /wallet/verify */
  token?: string
}

export interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  selectedRole: UserRole | null
}

export interface AuthContextType extends AuthState {
  login(user: AuthUser): Promise<void>
  logout(): Promise<void>
  selectRole(role: UserRole): void
  updateUser(user: Partial<AuthUser>): void
}
