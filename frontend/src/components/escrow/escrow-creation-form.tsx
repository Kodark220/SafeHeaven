"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useWorkers, useCreateEscrow } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, CheckCircle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const escrowSchema = z.object({
  title: z.string().min(8, "Add a descriptive title for the escrow"),
  description: z.string().min(20, "Tell the worker what this project is about"),
  workerId: z.string().min(1, "Select a worker"),
  currency: z.enum(["USD", "ETH", "USDC"]),
  amount: z.preprocess(
    (value) => (typeof value === "string" ? Number(value) : value),
    z.number().positive("Escrow amount must be greater than 0")
  ),
  milestones: z
    .array(
      z.object({
        title: z.string().min(5, "Milestone title is required"),
        description: z.string().min(10, "Milestone description is required"),
        amount: z.preprocess(
          (value) => (typeof value === "string" ? Number(value) : value),
          z.number().positive("Milestone amount must be greater than 0")
        ),
        dueDate: z
          .string()
          .min(1, "Add a due date")
          .refine((value) => !Number.isNaN(Date.parse(value)), {
            message: "Enter a valid due date",
          }),
      })
    )
    .min(1, "Add at least one milestone"),
})
.superRefine((data, ctx) => {
  const total = data.milestones.reduce((sum, milestone) => sum + milestone.amount, 0)
  if (total !== data.amount) {
    ctx.addIssue({
      path: ["milestones"],
      code: "custom",
      message: `Milestone total must equal escrow amount ($${data.amount})`,
    })
  }
})

type EscrowFormValues = z.infer<typeof escrowSchema>

export function EscrowCreationForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const workersQuery = useWorkers()
  const createEscrowMutation = useCreateEscrow()

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EscrowFormValues>({
    resolver: zodResolver(escrowSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      workerId: "",
      currency: "USD",
      amount: 0,
      milestones: [
        {
          title: "Initial milestone",
          description: "Describe the first milestone",
          amount: 0,
          dueDate: "",
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "milestones",
  })

  const milestones = watch("milestones")
  const totalMilestoneAmount = milestones.reduce((sum, milestone) => sum + Number(milestone?.amount || 0), 0)
  const selectedAmount = Number(watch("amount") || 0)

  const handleNext = async () => {
    const stepFields =
      step === 1
        ? (["title", "description", "workerId", "currency", "amount"] as const)
        : (["milestones"] as const)
    const valid = await trigger(stepFields)
    if (valid) setStep((prev) => Math.min(prev + 1, 3))
  }

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const onSubmit = async (values: EscrowFormValues) => {
    try {
      const created = await createEscrowMutation.mutateAsync({
        title: values.title,
        description: values.description,
        workerId: values.workerId,
        clientId: "c1",
        amount: values.amount,
        currency: values.currency,
        status: "draft",
        milestones: values.milestones.map((milestone, index) => ({
          id: `m-${Date.now()}-${index}`,
          escrowId: `e-temp-${Date.now()}`,
          title: milestone.title,
          description: milestone.description,
          order: index + 1,
          status: "pending",
          amount: milestone.amount,
          dueDate: new Date(milestone.dueDate),
        })),
        verifications: [],
        totalMilestonesCompleted: 0,
        totalMilestones: values.milestones.length,
      })

      toast.success("Escrow created successfully")
      router.push("/dashboard/escrows")
      return created
    } catch (error) {
      toast.error("Unable to create escrow. Please try again.")
      console.error(error)
    }
  }

  return (
    <Card className="border">
      <CardHeader className="surface-muted border-b border-border/50 py-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="font-heading text-xl sm:text-2xl font-bold text-foreground">Protocol Deployment</CardTitle>
        </div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Configure Smart Verification Parameters</p>
      </CardHeader>
      <CardContent className="card-padding space-y-8">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {['Parameters', 'Milestones', 'Final Audit'].map((label, index) => (
            <div key={label} className={cn(
              "relative rounded-2xl border p-3 sm:p-4 transition-all duration-300",
              step === index + 1 ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-muted/30 opacity-60"
            )}>
              <p className="text-[10px] font-bold uppercase tracking-[.24em] text-muted-foreground">Node {index + 1}</p>
              <p className={cn("font-bold font-heading mt-1 text-sm sm:text-base", step === index + 1 ? "text-primary" : "text-foreground")}>{label}</p>
              {step > index + 1 && (
                <CheckCircle className="absolute top-3 right-3 h-4 w-4 text-emerald-500" />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contract Title</Label>
                <Input id="title" placeholder="Protocol: Website Redesign Execution" {...register("title")} className="h-12 rounded-xl" />
                {errors.title && <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="workerId" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Worker</Label>
                <select id="workerId" {...register("workerId")} className="w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 appearance-none font-medium">
                  <option value="">Select Talent Node</option>
                  {workersQuery.data?.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name} — {worker.categories?.join(', ') || ''}
                    </option>
                  ))}
                </select>
                {errors.workerId && <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">{errors.workerId.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Specifications</Label>
              <Textarea id="description" placeholder="Define the algorithmic scope, required deliverables, and technical expectations." {...register("description")} className="min-h-[160px] rounded-2xl p-4" />
              {errors.description && <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Committed Capital</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                  <Input id="amount" type="number" min="0" step="0.01" {...register("amount", { valueAsNumber: true })} className="h-12 pl-8 rounded-xl font-bold" />
                </div>
                {errors.amount && <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">{errors.amount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Settlement Asset</Label>
                <select id="currency" {...register("currency")} className="w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 appearance-none font-bold">
                  <option value="USD">USD (Fiat Peg)</option>
                  <option value="ETH">ETH (Native)</option>
                  <option value="USDC">USDC (Stable)</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-1 col-span-3 md:col-auto">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Capital Summary</Label>
                <div className="h-12 rounded-xl border border-primary/20 bg-primary/5 flex items-center px-4">
                  <span className="text-lg font-bold font-heading text-primary">${selectedAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Milestone Breakdown</h2>
                <p className="text-sm text-muted-foreground">Create milestones that add up to the escrow amount.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ title: "", description: "", amount: 0, dueDate: "" })}>
                <Plus className="mr-2 h-4 w-4" />
                Add Milestone
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-2xl border border-muted/50 bg-muted p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">Milestone {index + 1}</p>
                      <p className="text-xs text-muted-foreground">Define milestone details and due date.</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor={`milestones.${index}.title`}>Title</Label>
                      <Input id={`milestones.${index}.title`} placeholder="Milestone description" {...register(`milestones.${index}.title` as const)} />
                      {errors.milestones?.[index]?.title && (
                        <p className="text-sm text-destructive">{errors.milestones?.[index]?.title?.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`milestones.${index}.amount`}>Amount</Label>
                      <Input id={`milestones.${index}.amount`} type="number" min="0" step="0.01" {...register(`milestones.${index}.amount` as const, { valueAsNumber: true })} />
                      {errors.milestones?.[index]?.amount && (
                        <p className="text-sm text-destructive">{errors.milestones?.[index]?.amount?.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 mt-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`milestones.${index}.description`}>Description</Label>
                      <Textarea id={`milestones.${index}.description`} placeholder="Describe the milestone" {...register(`milestones.${index}.description` as const)} className="min-h-[100px]" />
                      {errors.milestones?.[index]?.description && (
                        <p className="text-sm text-destructive">{errors.milestones?.[index]?.description?.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`milestones.${index}.dueDate`}>Due Date</Label>
                      <Input id={`milestones.${index}.dueDate`} type="date" {...register(`milestones.${index}.dueDate` as const)} />
                      {errors.milestones?.[index]?.dueDate && (
                        <p className="text-sm text-destructive">{errors.milestones?.[index]?.dueDate?.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-muted/50 bg-muted p-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Total milestone amount</span>
                <span className="font-semibold">${totalMilestoneAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span>Remaining</span>
                <span className={totalMilestoneAmount !== selectedAmount ? "text-destructive font-semibold" : "font-semibold"}>
                  ${Math.abs(selectedAmount - totalMilestoneAmount).toFixed(2)}
                </span>
              </div>
              {errors.milestones?.message && (
                <p className="mt-2 text-sm text-destructive">{errors.milestones.message}</p>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-muted/50 bg-muted p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Review before creating</p>
                  <h2 className="text-xl font-semibold">{watch("title")}</h2>
                </div>
                <Badge variant="secondary">Draft Mode</Badge>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Worker</p>
                  <p className="text-sm text-muted-foreground">
                    {workersQuery.data?.find((worker) => worker.id === watch("workerId"))?.name || "Not selected"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total</p>
                  <p className="text-sm text-muted-foreground">${selectedAmount.toFixed(2)} {watch("currency")}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={index} className="rounded-2xl border border-muted/50 bg-background p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{milestone.title || `Milestone ${index + 1}`}</p>
                    <span className="text-sm text-muted-foreground">Due {milestone.dueDate}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{milestone.description}</p>
                  <div className="mt-3 flex items-center justify-between text-sm font-medium">
                    <span>Amount</span>
                    <span>${milestone.amount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between pt-6 border-t border-border">
          <div className="flex gap-3">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting} className="h-12 px-8 rounded-xl font-bold text-xs uppercase tracking-widest">
                Back
              </Button>
            )}
            {step < 3 && (
              <Button type="button" onClick={handleNext} className="h-12 px-8 rounded-xl font-bold text-xs uppercase tracking-widest">
                Continue Execution
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
          {step === 3 && (
            <Button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting || createEscrowMutation.isPending} className="h-12 px-10 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold text-xs uppercase tracking-widest">
              {createEscrowMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deploying Nodes...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Authorize Protocol
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
