export const ApplicationStatus = {
  LOI: "LOI",
  WAITING_FOR_FEEDBACK: "WAITING_FOR_FEEDBACK",
  APPROVED: "APPROVED",
  DECLINED: "DECLINED",
  NOT_QUALIFIED: "NOT_QUALIFIED",
  AVAILABLE: "AVAILABLE",
  IN_PROGRESS: "IN_PROGRESS",
  APPLIED: "APPLIED",
  NOT_APPLIED: "NOT_APPLIED",
} as const;

export type ApplicationStatus = typeof ApplicationStatus[keyof typeof ApplicationStatus];