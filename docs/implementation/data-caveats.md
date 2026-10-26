# Source data caveats

## Preserve reported figures

The fixture has twelve nodes and twelve monthly values per node. The PDF's values are shown unchanged in the hierarchy table. Parents are separately reported totals; they are not silently replaced by a sum of their children.

Examples of discrepancies:

- May 2024: Company reports 301, but its branches sum to 279.
- August 2024: Branch 1 reports 214, but its advisors sum to 216.
- September 2024: Anna reports 27, but her channels sum to 28.

These could be mistakes, different reporting definitions, or incomplete coverage. The data does not establish which. Resolve that with the data owner before deriving reconciled totals or attributing the gap to a channel.

## Channel coverage

Only Anna has acquisition channels. James, Maria, Robert, Sarah, Branch 2, and Branch 3 have no channel breakdown. Omission means unavailable; it does not mean zero clients or no business activity.

Advisors without channel data still have a table disclosure. Expanding it shows the three standard channel labels with **-** for every month, announced as "Channel data unavailable" to assistive technology. The backend supplies these rows explicitly in `unavailableChannels`, with stable IDs, names, and null values. The frontend does not invent records or fill omitted values. These rows do not enter chart aggregation or scope selection. Branches without employees remain leaf rows.

For each chart scope and month, the backend sums only the channel leaves actually supplied under that scope and returns chart rows. It computes:

- unavailable balance = max(reported total − supplied channel sum, 0);
- excess = max(supplied channel sum − reported total, 0);
- plotted height = max(reported total, supplied channel sum).

For example, Company in February reports 250. Its supplied channel data contains 25 Existing clients, so the chart shows 25 purple and 225 hatched gray. The gray balance includes any discrepancy as well as unavailable channel coverage; it is not a separately verified category. Branch 2 has no channel data, so its 76 reported clients are entirely hatched gray. A channel scope plots just that channel's supplied values.

For Anna in September, known channels total 28 and the reported total is 27. The chart preserves 28, shows no negative gray segment, and explains the excess beside the chart, in the tooltip, and in the values table. It never rescales or edits the source values to hide disagreement.

## Design interpretation

The Figma company chart depicts predominantly Existing clients. The payload only supplies that breakdown for one advisor, so reproducing those segments would invent data. We preserve the design's layout and palette but add the labeled gray segment. The default company and expanded-branch table state follows the reference. Chart scope is independent of expansion to allow selecting even nodes whose ancestors are currently collapsed.

The data has no timestamps, freshness policy, historical snapshots, or client-level records. The app displays counts, not individual client records. Refreshing reloads the static fixture; there is no polling or simulated live data.

## Questions for the data owner

1. Should parent totals always equal children, and which figures win when they disagree?
2. Is omitted channel data genuinely unknown, or should the API supply a complete classification?
3. Are monthly values snapshots or flows? The demo uses the brief's client-count interpretation and does not derive growth or acquisition rates.
4. What volume, refresh cadence, and navigation expectations should drive the next iteration?
