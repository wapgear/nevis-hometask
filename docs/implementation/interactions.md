# 3. Dashboard interactions

## 3.1. Expand the hierarchy

Company starts expanded; branches start collapsed. Click a name/disclosure button to show or hide its children. Numeric cells stay selectable and do not toggle expansion. Branches without employees are leaves. Advisors with missing channel data expand to three unavailable rows, as described in [data caveats](data-caveats.md).

Enter and Space activate a focused disclosure. Up/Down and Home/End move between available disclosure buttons. Rows render directly when expansion changes; there are no exiting-row copies or animation timers to synchronize.

## 3.2. Select and reset the chart

The funnel button beside a reported row selects its chart scope. It appears on hover or keyboard focus and stays visible on touch devices. Its tooltip explains the action and its pressed state identifies the selection. Unavailable rows have no chart action.

Selection and expansion are separate. Selecting a row preserves expansion; collapsing its ancestors preserves the selected chart. IDs identify scopes even when names repeat. Reset chart appears after selecting a non-company scope or hiding a series. It returns to Company and shows every series without changing table expansion.

## 3.3. Filter series and inspect values

Legend buttons hide or show individual series. Hidden labels stay visible, dimmed and struck through. Filtering changes bar heights and the chart scale, while the hierarchy keeps all reported values. Hidden-series state survives scope changes. When the visible series have no values to plot, a friendly message replaces the bars and axis and invites users to pick a channel in the legend. This also covers scopes whose only populated series is Unknown channel when that series is hidden. The legend stays available, and selecting a channel with data restores the chart without changing its scope.

Bars grow from the bottom on first appearance and when selecting a populated channel restores an empty chart. Adding or hiding channels in an existing chart uses height transitions.

Hover, focus or tap a monthly bar to inspect its tooltip. The tooltip shows reported totals, visible series and any excess over the reported total. Its text stays reachable and selectable with the pointer. Escape dismisses it, including after pointer hover. Switching scope or toggling a series clears the current tooltip.

The inline Data discrepancies disclosure compares reported totals and immediate-child sums. It also points out disagreements below the selected scope. It uses native `details` and `summary` controls, so it needs no floating notice, close button or custom dismissal state. Chart filters do not alter the comparison.

## 3.4. Scrolling and accessibility

The page provides vertical scrolling; the chart and hierarchy provide horizontal scrolling when needed. A table scroll hint appears whenever its content exceeds the container width, including at desktop sizes, and also describes the scroll region to assistive technology. It updates when the table or container resizes. The table keeps its name column pinned and its month header visible while the page scrolls. Names wrap into taller rows, with reduced indentation on narrow layouts.

Native table headers and disclosure names describe the hierarchy. Chart bars expose figures in their accessible names, and focus remains visible. Reduced-motion settings disable chart entrance animations, transitions and number animation. Automated checks cover these behaviors, but manual screen-reader and real browser zoom checks remain open in [testing and Demo mode](testing-and-demo.md).
