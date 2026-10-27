# 2. Source data caveats

The dashboard prioritizes an honest reading of the supplied figures over making every total reconcile or reproducing a chart breakdown the data cannot support. Reviewers can inspect the original counts and see where information is missing; deciding which inconsistent figure is correct requires a product/data-owner decision.

## 2.1. Data and design sources

The counts come from the supplied `Nevis Frontend Home Assignment.pdf`, transcribed into [server/clients.json](../../server/clients.json). The fixture contains 12 reported nodes and 144 monthly observations, covering February 2024 to January 2025. It contains aggregate counts, not individual client records. The original PDF stays local under the repository's ignore rules.

The [assignment Figma design](https://www.figma.com/design/t6itC2qsmr3WLPugwrVdqS/Web-engineer-home-task?node-id=1-2781) guided layout, typography and colors. Inspection of Nevis's public sign-in page and loaded assets informed the frontend stack and styling conventions. The implementation keeps those references separate from the supplied figures; visual proportions cannot establish missing channel values. Local research captures remain excluded from Git.

## 2.2. Preserve reported figures

The fixture has twelve nodes and twelve monthly values per node. The PDF's values are shown unchanged in the hierarchy table. Parents are separately reported totals; they are not silently replaced by a sum of their children.

Examples of discrepancies:

- May 2024: Company reports 301, but its branches sum to 279.
- August 2024: Branch 1 reports 214, but its advisors sum to 216.
- September 2024: Anna reports 27, but her channels sum to 28.

These could be mistakes, different reporting definitions, or incomplete coverage. The data does not establish which. Resolve that with the data owner before deriving reconciled totals or attributing the gap to a channel.

## 2.3. Channel coverage

Only Anna has acquisition channels. James, Maria, Robert, Sarah, Branch 2, and Branch 3 have no channel breakdown. Omission means unavailable; it does not mean zero clients or no business activity.

Advisors without channel data still have a table disclosure. Expanding it shows the three standard channel labels with **-** for every month, announced as "Channel data unavailable" to assistive technology. The backend supplies these rows explicitly in `unavailableChannels`, with stable IDs, names, and null values. The frontend does not invent records or fill omitted values. These rows do not enter chart aggregation or scope selection. Branches without employees remain leaf rows.

For each chart scope and month, the backend sums only the channel leaves actually supplied under that scope and returns chart rows. It computes:

- unavailable balance = max(reported total − supplied channel sum, 0);
- excess = max(supplied channel sum − reported total, 0);
- plotted height with all series visible = max(reported total, supplied channel sum).

For example, Company in February reports 250. Its supplied channel data contains 25 Existing clients, so the chart shows 25 purple and 225 hatched gray. The legend labels the gray balance **Unknown channel**. It includes any discrepancy as well as unavailable channel coverage; it is not a separately verified acquisition category. Branch 2 has no channel data, so its 76 reported clients are entirely hatched gray. A channel scope plots just that channel's supplied values. Hiding a legend series changes the visible stack and its scale, while the API figures and hierarchy totals remain unchanged.

For Anna in September, known channels total 28 and the reported total is 27. With all series visible, the chart preserves 28, shows no negative gray segment, and explains the excess in an inline discrepancy disclosure and the monthly tooltip. It never rescales or edits the source values to hide disagreement.

The API also supplies `reportedChildTotals`, the immediate-child sum for each reporting month, or `null` when there are no reported children. The disclosure compares these totals with the selected node's reported values, including Company and Branch 1. `hasReportedMismatch` also flags discrepancies below the selected level; the UI points users to branch and advisor chart scopes to inspect those figures. Hiding chart series does not change this comparison. Native `details`/`summary` controls keep the explanation keyboard-accessible without a floating notice or custom dismissal state.

## 2.4. Design interpretation

The Figma company chart depicts predominantly Existing clients. The payload only supplies that breakdown for one advisor, so reproducing those segments would invent data. We preserve the design's layout and palette but add the labeled gray segment. Company starts expanded and branches start collapsed. The [row filter](architecture.md#14-why-there-is-a-filter-button-beside-each-row) provides explicit chart drill-down independently of table expansion; collapsing a selected row's ancestors does not change the selected chart.

The data has reporting months but no update timestamps, freshness policy, versioned history, or client-level records. The app displays counts, not individual client records. Refreshing reloads the static fixture; there is no polling or simulated live data.

## 2.5. Questions for the data owner

1. Should parent totals always equal children, and which figures win when they disagree?
2. Is omitted channel data genuinely unknown, or should the API supply a complete classification?
3. Are monthly values snapshots or flows? The demo uses the brief's client-count interpretation and does not derive growth or acquisition rates.
4. What volume, refresh cadence, and navigation expectations should drive the next iteration?
