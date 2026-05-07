"use client"

import { ProtectedRoute } from "@/components/route-guards"
import { EscrowCreationForm } from "@/components/escrow/escrow-creation-form"

export default function NewEscrowPage() {
  return (
    <ProtectedRoute requiredRole="client">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Client Workspace</p>
            <h1 className="text-3xl font-bold">Create a New Escrow</h1>
          </div>
        </div>

        <EscrowCreationForm />
      </div>
    </ProtectedRoute>
  )
}
