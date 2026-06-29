# DataViews

Use `@wordpress/dataviews` for browsing, selecting, and editing datasets with table, grid, list, picker, filter, sort, and pagination patterns.

## Rules

- Treat the dataset as consumer-owned. DataViews calls `onChangeView` when the user changes search, filters, sorting, layout, page, or other view state.
- Every record needs a stable identifier. Provide `getItemId` when records do not expose `id`.
- Use fields to describe visible record properties, formatting, sorting, filtering, and edit behavior.
- Use design-system status components for state display. Do not invent local badge or notice colors inside a field renderer.
- Use `DataViewsPicker` for selection-optimized flows instead of forcing picker behavior into a full table.
- Use `DataForm` for editing record data with field metadata.

## Setup

Outside WordPress, load theme, components, and dataviews styles in the documented order. The design tokens stylesheet has no separate RTL file; package styles do.

## Sources

- [@wordpress/dataviews README](../../packages/dataviews/README.md)
- [DataViews manifest PR #78960](../_sources/github/threads/pr-78960.md)
- [DataViews richtext control PR #79345](../_sources/github/threads/pr-79345.md)
- [DataViews size-token adoption PR #79093](../_sources/github/threads/pr-79093.md)
