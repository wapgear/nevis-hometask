# 4. Loading and scaling

## 4.1. Why the current implementation prepares the whole dataset

The fixture contains 12 reported nodes and 144 monthly observations, with a maximum hierarchy depth of four. Fully expanding the table shows 24 rows, including the explicit unavailable-channel rows. The server validates and prepares chart data for every node once at startup, then reuses the serialized response. The browser fetches the whole tree; expansion and chart filtering need no further requests.

With three fixed channels, preparation takes O(nodes × months) time and memory. At this size, preparing everything is straightforward and makes every drill-down immediate. Its limitation is that it prepares and sends chart details for people the user may never inspect. The current implementation accepts that small amount of unused work to avoid per-row requests, caches, loading states, and invalidation rules.

No lazy loading or virtualization is implemented. This is a decision based on the fixture's size, rather than the intended architecture for an unlimited hierarchy.

## 4.2. Separate complete chart summaries from paginated table details

When loading the entire hierarchy becomes expensive, keep the calculations on the backend and separate two requests: a summary for the selected chart scope, and a page of immediate children for the table. Both use the same scope, reporting periods, and applicable filters. The chart covers all matching records, regardless of which table pages have loaded.

For example, when someone filters the chart to Branch 1, return that branch's monthly reported totals, channel counts, missing coverage, and discrepancies. If its employee rows are expanded, return their names and monthly reported totals in pages. There is no need to build a full channel chart for every employee merely to display those rows. Request an employee summary when that employee is selected for the chart, and request channel details when their table breakdown is opened. Table expansion and chart selection remain independent.

Use cursor pagination with stable ordering and a unique tie-breaker for immediate children. Each expanded parent needs its own continuation cursor and loading/error/retry state. Cache fetched pages, cancel obsolete requests when the scope or filters change, and preserve expansion by node ID. If a consistent traversal is required while records change, tie cursors and summaries to a data revision or snapshot; a cursor alone does not guarantee that consistency.

This keeps payloads and browser work proportional to what someone inspects. It also prevents a misleading chart that changes its totals as more employee pages arrive. The trade-off is additional API contracts, request latency on first expansion, and more frontend loading and recovery states. These endpoints are a future design; the current API still returns the full enriched tree.

## 4.3. Prepare summaries only when they are useful

At a larger scale, replace recursive preparation of every node's chart with a summary query for the requested scope. A branch summary can aggregate the relevant records directly without constructing, serializing, and retaining an employee chart for each person. Smaller responses and fewer intermediate objects reduce work even when the underlying query still examines many records.

Deferring detail preparation does not eliminate the information needed for a correct parent total. Without a stored branch summary, the first branch query still has to read all relevant source records or lower-level aggregates. Merely hiding employee rows cannot make a complete total cheaper to calculate. Stored summaries move that work to an earlier calculation or to the update path.

There are three useful stages, chosen according to measured query cost and the required freshness:

| Approach | Benefit | Cost and limitation |
| --- | --- | --- |
| Calculate a requested summary from indexed source data | Simple ownership and a result based on the source visible to that query; avoids preparing unused employee charts | A large or frequently selected branch can repeat expensive reads and aggregation |
| Cache a calculated summary | Repeated visits reuse a prepared result; details can stay lazy | The first request can still be expensive; cache keys, expiry, invalidation, and concurrent cache misses need handling |
| Store precomputed summaries by scope and month | Predictable reads for common company/branch views without scanning employee detail on each visit | More storage and update work; results can lag unless summary maintenance is coordinated with source changes |

For caching, key results by scope, reporting range, filters, authorization context, and data revision as applicable. Share concurrent calculations for the same key so a popular expired summary does not trigger duplicate work. A time-to-live gives simple bounded reuse; invalidation or versioned keys give more direct control after changes. Frequently visited company and branch summaries are good candidates for precomputation, while less frequently opened employee summaries can be calculated on demand. Precomputing every possible filter combination would recreate the unused-work problem.

## 4.4. Updating prepared figures as data changes

For live data, update or invalidate only the summaries affected by a change. An employee's channel correction may affect that employee, their branch, and the company for the affected month. A move between branches affects both the old and new ancestry. These updates can maintain commonly requested figures incrementally, rather than rebuilding the entire hierarchy.

Use deltas only for metrics whose rules support them. Preserve separately reported parent totals as source facts; do not silently replace them with employee sums. Recompute missing balances, excesses, and mismatch flags from the updated inputs, because these are not all additive. Monthly snapshots also must not be summed into a yearly client count without an agreed metric definition.

Updating summaries in the source transaction provides stronger consistency but increases write cost and coupling. Background events keep source writes lighter and can update prepared summaries promptly, but introduce a delay and require idempotent processing, ordering/version checks, and recovery from missed events. Expose a calculation time or revision so the UI can describe freshness. If chart and table must agree at a specific revision, use that revision across both responses rather than combining unrelated snapshots.

The browser can refetch affected views after an update notification; polling or server-sent events can be selected according to the required update cadence. Pushing a notification does not itself recalculate or synchronize the figures. Cached or precomputed summaries need their own update policy. None of these live-data mechanisms is needed for the current read-only fixture.

## 4.5. When to add each optimization

Start with measurements of payload size, summary-query latency, expansion latency, scrolling, and target hardware. Introduce paginated children and lazy detail loading when full-tree transfer or preparation becomes costly. Add caching or precomputed summaries when repeated summary queries become costly, with a freshness policy agreed with the product owner. This avoids buying fast reads at the cost of unexpectedly stale client figures.

Pagination limits fetched data; virtualization limits rendered rows. Rendering at most 24 rows does not justify a virtualizer today. If hundreds or thousands of simultaneously visible rows cause a measured problem, flatten the visible hierarchy and virtualize that list with stable IDs, overscan, and preserved keyboard focus and hierarchy semantics. Do not change the page's scrolling model solely to introduce a virtualizer. A larger source hierarchy can still produce twelve monthly chart bars, so row virtualization and chart rendering remain separate decisions.

Route-level code splitting can follow substantial, infrequently visited screens. Deferring the current screen's chart or table would only add a loading boundary to content needed immediately. Authentication, authorization, persistent storage, and operational monitoring would also need actual production requirements; they are outside the current static dataset.
