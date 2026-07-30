<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Bug Fixes

-   `useView`, `loadView`. Fix merge/strip algorithm: `page` and `search` never have fallbacks; `type`, `perPage`, and `fields` can be provided as overrides; let users modify unlocked filters provided by active view overrides; a partial `sort` override no longer leaks the completed sort into the preference, which marked the view as modified forever; `layout` and `groupBy` overrides merge and strip per leaf, so an override for one field's styles no longer wipes the other fields' and no longer blocks persisting them. [#80832](https://github.com/WordPress/gutenberg/pull/80832)

## 1.18.0 (2026-07-14)

## 1.17.0 (2026-07-01)
