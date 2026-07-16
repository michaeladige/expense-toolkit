export type Grade = "S" | "A" | "B" | "C" | "D" | "F";

export interface GradeResult {
  grade: Grade;
  /** Unrounded; what it's a ratio *of* depends on the grader that produced it. */
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

interface SavingsTier {
  grade: Grade;
  /** Inclusive lower bound of the savings rate for this tier. */
  min: number;
  label: string;
  color: string;
}

/**
 * Savings-rate tiers, in descending order — unlike spending, more is better.
 * 20% is the conventional personal-finance benchmark, so it anchors an A.
 * A negative rate means the month spent more than it earned.
 */
const SAVINGS_TIERS: SavingsTier[] = [
  { grade: "S", min: 0.3, label: "Hoarding like a dragon. Respect.", color: "var(--success)" },
  { grade: "A", min: 0.2, label: "Saving like you mean it.", color: "var(--success)" },
  { grade: "B", min: 0.1, label: "A tidy little cushion.", color: "var(--warning)" },
  { grade: "C", min: 0, label: "Breaking even. Just barely.", color: "var(--warning)" },
  { grade: "D", min: -0.1, label: "Spending more than you earn.", color: "var(--danger)" },
  { grade: "F", min: -Infinity, label: "Torching the savings. Please stop.", color: "var(--danger)" },
];

/**
 * Grade what share of the month's income survived it, as `net / income`.
 *
 * Deliberately separate from `gradeSpending` rather than another target for it:
 * the two answer different questions ("did I stick to my plan?" vs "am I
 * keeping any of what I earn?") and you can pass one while failing the other.
 *
 * Returns null when no income was recorded — there's no rate to compute, and an
 * F would punish anyone who simply tracks expenses only.
 */
export function gradeSavings(net: number, income: number): GradeResult | null {
  if (!(income > 0)) return null;
  const ratio = net / income;
  const tier = SAVINGS_TIERS.find((t) => ratio >= t.min)!;
  return { grade: tier.grade, ratio, label: tier.label, color: tier.color };
}
