// What #4471 holds, problem by problem, counted the desk's way. causes.ts files every report under the
// flip bug its tenant and channel give it (`parser` or `hint`); this file keeps that count as it is.
// The reports the desk read as a one-day move (desk-notes.json) are a third problem: they get a row and
// a ticket of their own, and stay counted where the desk files them, so the rows overlap by that many.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day';

// One ticket per problem, filed from this page's analysis.
export const TICKET_REPO = 'https://github.com/JamesNock/support-kb-4471';
export const TICKETS: Record<Problem, number> = { parser: 1, hint: 2, 'one-day': 3 };

export const SUMMARY: Record<Problem, string> = {
  parser: 'The shared parser reads every date month first. Day-first tenants get day and month swapped.',
  hint: "booking-v3's form prints MM/DD/YYYY under the date field. Day-first tenants' people type month first, and the form reads it day first.",
  'one-day': 'The date moves by exactly one day, not a swap. Weekday off by one, varies by where the reader is: a time-zone bug.',
};

// Every problem a report counts toward: the flip bug the desk files it under, plus `one-day` if the
// desk read it as a one-day move.
export function problemsOf(r: Report, t: Tenant | undefined, oneDay: readonly string[]): (Problem | 'unplaced')[] {
  const filed = causeOf(r, t) ?? 'unplaced';
  return oneDay.includes(r.id) ? [filed, 'one-day'] : [filed];
}

export type ProblemRow = {
  problem: Problem | 'unplaced';
  reports: number;
  tenants: string[];
  channels: Record<string, number>;
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

const tally = (xs: string[]) => xs.reduce<Record<string, number>>((n, x) => ({ ...n, [x]: (n[x] ?? 0) + 1 }), {});

export function problemsIn(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDay: readonly string[],
): { merged: number; exportRows: number; overlap: number; rows: ProblemRow[] } {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const by = new Map<ProblemRow['problem'], Report[]>();
  for (const r of merged) {
    for (const p of problemsOf(r, tenantOf(r), oneDay)) by.set(p, [...(by.get(p) ?? []), r]);
  }
  const rows = [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs.length,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: tally(rs.map((r) => r.channel)),
        taggedAs: tally(rs.map((r) => r.meta.intakeTag)),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports - a.reports);
  const overlap = merged.filter((r) => oneDay.includes(r.id)).length;
  return { merged: merged.length, exportRows: all.length, overlap, rows };
}
