export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Application Settings</p>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      <div className="rounded-2xl border border-muted/50 bg-muted p-8 text-muted-foreground">
        <p>This page is reserved for application settings and user preferences.</p>
        <p className="mt-3">Wallet settings, notifications, and integrations will be added as backend services are integrated.</p>
      </div>
    </div>
  )
}
