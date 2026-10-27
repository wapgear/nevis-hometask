# 7. Users and purpose

## 7.1. Who this is for

The assignment names advisors and their managers. They need to see how their book of business develops over time and drill from the company down to a branch, advisor or acquisition channel. Here, the dashboard measures that book through monthly client counts. It does not show portfolio value, revenue or individual client records.

This is the product context for our implementation. We have not interviewed users or observed their work. The roles come from the brief; the likely tasks below are our interpretation and need validation before expanding the product.

| User | What they are trying to understand | How the dashboard helps |
| --- | --- | --- |
| Advisor | How their reported client count changes month to month, and which acquisition channels have supplied figures. | Select their row for the chart, inspect monthly values, and expand available channel details. |
| Branch or team manager | How their branch changes over time and how its reported figures compare with advisor figures. | Inspect the branch summary, expand its advisors, and switch chart scopes while keeping the table open. |
| Manager reviewing the company | How company and branch counts change, and where to investigate a difference. | Start at Company, inspect branches, and follow the hierarchy into available detail. |

The two management views are working interpretations of "managers," not confirmed job titles or permission levels. The public demo gives every visitor the same fixture; it does not implement role-based access.

## 7.2. What they should expect

The chart gives a quick view of change over the supplied months. The table provides exact reported counts and the organizational context behind them. A user should be able to move between those views without losing their place or wondering whose figures the chart shows.

| Expectation | What that means for this dashboard |
| --- | --- |
| Know the current scope | The chart identifies the selected company, branch, advisor or channel. Row actions select that scope; Reset chart returns to Company. |
| Read exact values | Monthly table cells and chart tooltips show the supplied figures. Filtering a chart series does not edit the table totals. |
| Explore without losing context | Expanding rows reveals details independently of chart selection. Selecting a chart scope preserves expansion. |
| Recognize incomplete information | A dash means channel data is unavailable. Unknown channel is a balance that can include discrepancies, not a confirmed acquisition category. |
| Trust the explanation of a mismatch | Keep reported parent and child figures, explain their disagreement, and leave correction to the data owner. |
| Recover when data cannot load | Distinguish loading, an empty result and an error. Offer retry without inventing replacement figures. |

Client counts alone cannot explain why a month changed or prove that one advisor performed better. Missing channel coverage and inconsistent totals limit those conclusions. The [data caveats](data-caveats.md) define those limits.

## 7.3. A typical review

This is a suggested task flow, not a workflow confirmed through user research.

1. Start with Company and scan the monthly chart for a change worth inspecting. Use a tooltip or the table to read the exact count.
2. Compare the reported branch rows for those months. Expand a branch with available advisor detail to see its employees.
3. Use a row's funnel button to inspect that branch or advisor in the chart. The open table remains available for context.
4. Inspect the supplied channel breakdown. For Anna, expand the channel rows or use legend filters to examine the chart. Treat unavailable breakdowns as missing information.
5. Open Data discrepancies when totals disagree. Compare the reported values before drawing a conclusion. For example, Company's May 2024 total is 301 while its branches sum to 279; the dashboard shows the difference but cannot determine its cause.
6. Reset the chart to return to the company overview. If the question needs missing or corrected data, take it to the data owner outside this demo.

The current chart shows one scope at a time. Comparing branches means reading their table rows or switching scopes; there is no simultaneous multi-branch chart, export or in-app follow-up task.

## 7.4. How this should guide product decisions

Keep the overview readable and put drill-down actions beside the rows they affect. Preserve monthly alignment and visible scope labels. Exact counts and clear missing-data explanations matter more than making the chart resemble a complete dataset.

Judge future changes against the same review task. With pagination, a manager must still get a complete branch chart before all advisor rows have loaded. With virtualization, keyboard users must retain focus and hierarchy context. A chart-library migration must preserve the count definitions and access to values. These constraints are part of the [scaling plan](loading-and-scaling.md), not reasons to add those dependencies today.

Demo mode helps reviewers and developers inspect response states. It is a testing aid, not part of an advisor's business review. See [testing and Demo mode](testing-and-demo.md).

## 7.5. What a successful review looks like

Use these as acceptance checks when reviewing changes. They are proposed criteria, not measured research results.

1. A user can identify whose figures the chart shows and read a specific month's reported count.
2. A user can move from Company to an available advisor and back without losing table expansion.
3. A user can distinguish an unavailable channel count from zero and find an explanation for inconsistent totals.
4. A keyboard user can perform the same expansion, scope selection and reset tasks.
5. A user can distinguish a failed request from an empty dataset and recover through retry or restored service.

## 7.6. What we still need to ask users

1. Which management roles use this view, and should advisors see only their own book or also team comparisons?
2. Is this a daily check, a monthly review, or preparation for a meeting? How current do the figures need to be?
3. What does each monthly count mean: a snapshot, an acquisition flow, or something else? Which comparisons are valid?
4. After spotting a change, what decision or follow-up do they make, and what information is missing from this screen?
5. Who owns reporting discrepancies, and how should users request a correction?
6. Do they need simultaneous comparisons, saved views or exports? How often do they review this on a phone or with assistive technology?

Answers should determine the next iteration. The brief supports a read-only client-count review; it does not establish these broader workflows.
