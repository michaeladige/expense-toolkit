export type Grade = "S" | "A" | "B" | "C" | "D" | "F";

export interface GradeResult {
  grade: Grade;
  /** spent / target, unrounded. */
  ratio: number;
  label: string;
  /** CSS custom-property reference, e.g. "var(--success)". */
  color: string;
}

interface Tier {
  grade: Grade;
  /** Inclusive upper bound of ratio for this tier. */
  max: number;
  label: string;
  color: string;
}

const TIERS: Tier[] = [
  { grade: "S", max: 0.7, label: "Certified tightwad. We're impressed.", color: "var(--success)" },
  { grade: "A", max: 0.85, label: "Basically a budgeting wizard.", color: "var(--success)" },
  { grade: "B", max: 1.0, label: "Solid. Your wallet approves.", color: "var(--warning)" },
  { grade: "C", max: 1.1, label: "A bit spicy, but survivable.", color: "var(--warning)" },
  { grade: "D", max: 1.3, label: "Your wallet is filing a complaint.", color: "var(--danger)" },
  { grade: "F", max: Infinity, label: "RIP wallet. Send flowers.", color: "var(--danger)" },
];

/**
 * Compute a letter grade from spend vs. target. Returns null when there's no
 * valid target to grade against (target <= 0, including corrupted/imported
 * budget data the form's own validation wouldn't normally allow).
 */
export function gradeSpending(spent: number, target: number): GradeResult | null {
  if (!(target > 0)) return null;
  const ratio = spent / target;
  const tier = TIERS.find((t) => ratio <= t.max)!;
  return { grade: tier.grade, ratio, label: tier.label, color: tier.color };
}
