type Timestamped = Date | null | undefined;

type ActorShape = Record<string, unknown>;

type VerificationShape = {
  createdAt: Date;
} & Record<string, unknown>;

type SubmissionShape = {
  submittedAt: Date;
} & Record<string, unknown>;

type MilestoneShape = {
  dueDate: Date;
  releasedAt?: Timestamped;
} & Record<string, unknown>;

type JobShape = {
  createdAt: Date;
  fundedAt?: Timestamped;
  milestones?: MilestoneShape[];
} & Record<string, unknown>;

type NanopaymentShape = {
  createdAt: Date;
} & Record<string, unknown>;

export function serializeActor(actor: ActorShape) {
  return actor;
}

export function serializeVerification(verification: VerificationShape) {
  return {
    ...verification,
    createdAt: verification.createdAt.toISOString()
  };
}

export function serializeSubmission(submission: SubmissionShape) {
  return {
    ...submission,
    submittedAt: submission.submittedAt.toISOString()
  };
}

export function serializeMilestone(milestone: MilestoneShape) {
  return {
    ...milestone,
    dueDate: milestone.dueDate.toISOString(),
    releasedAt: milestone.releasedAt?.toISOString()
  };
}

export function serializeJob(job: JobShape) {
  return {
    ...job,
    createdAt: job.createdAt.toISOString(),
    fundedAt: job.fundedAt?.toISOString(),
    milestones: job.milestones?.map(serializeMilestone)
  };
}

export function serializeNanopayment(nanopayment: NanopaymentShape) {
  return {
    ...nanopayment,
    createdAt: nanopayment.createdAt.toISOString()
  };
}
