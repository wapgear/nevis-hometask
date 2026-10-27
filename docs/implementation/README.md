# Design and implementation decisions

These notes explain the main product and engineering trade-offs for reviewers: how the dashboard treats incomplete figures, why the implementation stays small, and how it could grow without changing what its numbers mean.

For product context, read [users and purpose](users-and-purpose.md) first. It describes the intended audience, their tasks, and the assumptions we still need to validate.

| No. | Guide | What it explains |
| --- | --- | --- |
| 1 | [Architecture and dependency choices](architecture.md) | React, TypeScript, Vite, SCSS Modules, API validation, backend calculations, native charts, and Express. Also when to add TanStack Query, a router, or a chart library. |
| 2 | [Data sources and caveats](data-caveats.md) | The assignment fixture, design references, reported figures, missing channel data, discrepancies, and questions for the data owner. |
| 3 | [Dashboard interactions](interactions.md) | Expansion, chart selection, reset, legend filters, tooltips, discrepancies, scrolling, and keyboard behavior. |
| 4 | [Loading and scaling](loading-and-scaling.md) | Full-tree loading today; future pagination, partial loads, lazy details, summary caching, live updates, virtualization, and code splitting. |
| 5 | [Testing and Demo mode](testing-and-demo.md) | All five demo scenarios, request isolation, verification commands, test coverage, and manual accessibility follow-up. |
| 6 | [Development and deployment](running-and-deployment.md) | Local and Docker setup, production builds, GitHub Actions, VPS configuration, health checks, and rollback. |
| 7 | [Users and purpose](users-and-purpose.md) | Advisors and managers, expected tasks, a suggested review flow, product acceptance checks, and open research questions. |

The current application loads and prepares one static fixture. Pagination, lazy loading of hierarchy details, and live summary updates describe a future design. Each guide separates shipped behavior from proposed changes. The [project README](../../README.md) is the short guide for trying the app.
