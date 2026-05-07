export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Payment Management</p>
        <h1 className="text-3xl font-bold">Payment History</h1>
      </div>
      <div className="rounded-2xl border border-muted/50 bg-muted p-8 text-muted-foreground">
        <p>This page will display your payment history and transaction records.</p>
        <p className="mt-3">Integration with blockchain payment systems will be added when backend services are connected.</p>
      </div>
    </div>
  )
}