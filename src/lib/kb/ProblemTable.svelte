<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { OUTCOME, problemsIn, SUMMARY, TICKET_REPO, TICKETS } from '#lib/kb/problems';

  let { ticket }: { ticket: number } = $props();

  const result = $derived(problemsIn(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const list = (n: Record<string, number>) =>
    Object.entries(n)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ×${v}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{result.merged}</strong> reports merged into #{ticket}
  ({result.exportRows - result.merged} repeated rows in the export dropped) ·
  <strong>{result.rows.length}</strong> problems
</p>
<p class="note">
  Counted the desk's way: each report under the flip bug its tenant and channel file it under. The
  {result.overlap} one-day moves also count toward <code>one-day</code>, so the rows add up to
  {result.merged + result.overlap}.
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>ticket</th><th>where it stands</th><th>what it is</th></tr>
  </thead>
  <tbody>
    {#each result.rows as row (row.problem)}
      <tr>
        <td><code>{row.problem}</code></td>
        <td><strong>{row.reports}</strong></td>
        <td>
          {#if row.problem !== 'unplaced'}
            <a href="{TICKET_REPO}/issues/{TICKETS[row.problem]}">#{TICKETS[row.problem]}</a>
          {:else}—{/if}
        </td>
        <td class:open={row.problem === 'one-day'}>{row.problem !== 'unplaced' ? OUTCOME[row.problem] : '—'}</td>
        <td>{row.problem !== 'unplaced' ? SUMMARY[row.problem] : 'no tenant on file'}</td>
      </tr>
    {/each}
  </tbody>
</table>

<table class="detail">
  <thead>
    <tr><th>problem</th><th>tenants</th><th>channels</th><th>intake tagged as</th><th>seen</th></tr>
  </thead>
  <tbody>
    {#each result.rows as row (row.problem)}
      <tr>
        <td><code>{row.problem}</code></td>
        <td>{row.tenants.length}: {row.tenants.join(', ')}</td>
        <td>{list(row.channels)}</td>
        <td>{list(row.taggedAs)}</td>
        <td>{row.firstSeen} → {row.lastSeen}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .open { color: var(--warn); font-weight: 600; }
  .note { color: var(--muted); font-size: 0.85em; }
  .detail { font-size: 0.85em; color: var(--muted); }
</style>
