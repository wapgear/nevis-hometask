# Loading and scaling

## Current scale

The backend contains 12 nodes and 144 numerical observations, with a maximum depth of four. Fully expanding the table shows 12 reported rows plus 12 API-supplied unavailable-channel rows; the current fixture supplies 12 reporting months, so the chart shows 12 bars. The browser loads reporting months and the complete tree together once per page load. Expansion and scope selection then happen locally without another API request.

## Why there is no lazy loading

Code splitting is not useful for a single small screen whose main chart and table are needed immediately. Deferring either would add a loading boundary and another request on the first visit. React and the page are delivered together; the font is bundled locally and portrait URLs come from the API.

Likewise, fetching children on expansion would add API endpoints, per-row loading/error/retry state, and ordering/cancellation rules for a tiny already-loaded tree. The initial request has loading/error/retry handling and is canceled on unmount. No polling, query cache, or background refresh is needed for a static read-only payload.

Introduce route-level code splitting when there are substantial infrequently visited screens. Introduce incremental child loading when real payload size or fetch latency makes loading the full tree expensive. The API would expose stable node IDs and paginated children. The UI would then track each parent's unloaded/loading/ready/error state, cancel obsolete work, cache fetched children, and keep expansion usable by keyboard. Aggregates for the chart would need a server-side contract rather than summing whichever children happen to have loaded.

## Why there is no virtualization

Rendering at most 24 rows has no plausible DOM bottleneck. A virtualizer would add row measurement, scroll positioning, sticky-column integration, and accessibility complexity while removing almost no work. Contained horizontal scrolling solves the actual width constraint at 375px; virtualization solves a different problem.

Reconsider when representative production datasets have hundreds or thousands of simultaneously visible rows and profiling shows row rendering or scrolling causes meaningful delay. A row-count guess alone is not enough: measure real expansion, scrolling, update latency, payload size, and target hardware first.

If needed, flatten only the visible tree, then virtualize that list with stable IDs and measured or fixed row heights, a bounded scrolling viewport, and overscan. Preserve the sticky label column, focus when nodes enter/leave the viewport, and correct hierarchy/row metadata for assistive technology. Test keyboard expansion during scrolling and consider a paginated or non-virtualized accessible view. Do not virtualize the twelve-month chart or its tiny values table.

## Further operational work

The current server reads one validated fixture at startup and holds it in memory. There are no concurrent writes or transactions. A live service would need authentication/authorization, storage, explicit aggregation rules, caching/freshness policy, observability, and deployment-specific static serving. Add those when their requirements exist; they are outside this local demo.
